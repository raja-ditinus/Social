import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { usersApi } from '../api';
import { feedApi } from '../api';
import { User, Post } from '../types';
import { FollowButton } from '../components';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONT, SPACING, BORDER_RADIUS } from '../theme';
import { RootStackParamList } from '../navigation/types';

type ProfileRoute = RouteProp<RootStackParamList, 'UserProfile'>;
type ProfileTab = 'posts' | 'saved';

const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ProfileRoute>();
  const routeUserId = route.params?.userId;
  const { userId: authUserId, user: authUser, logout } = useAuth();

  const profileId = routeUserId || authUserId;
  const isMe = !routeUserId || routeUserId === authUserId;

  const [user, setUser] = useState<User | null>(isMe ? authUser : null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [postsCursor, setPostsCursor] = useState<string | null>(null);
  const [postsHasMore, setPostsHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!profileId) return;
    try {
      const [userRes] = await Promise.all([usersApi.getUser(profileId)]);
      setUser(userRes.data);
    } catch (err) {
      console.warn('Profile fetch error', err);
    }
  }, [profileId]);

  const fetchUserPosts = useCallback(async (reset = false) => {
    if (!profileId) return;
    try {
      const cursor = reset ? undefined : (postsCursor ?? undefined);
      const res = await usersApi.getUserPosts(profileId, cursor, 9);
      const newPosts: Post[] = Array.isArray(res.data) ? res.data : (res.data as any)?.posts ?? [];
      if (reset) {
        setMyPosts(newPosts);
      } else {
        setMyPosts(prev => {
          const ids = new Set(prev.map(p => p._id));
          return [...prev, ...newPosts.filter(p => !ids.has(p._id))];
        });
      }
      setPostsCursor(res.pagination?.nextCursor ?? null);
      setPostsHasMore(res.pagination?.hasMore ?? newPosts.length >= 9);
    } catch (err) {
      console.warn('User posts fetch error', err);
    }
  }, [profileId, postsCursor]);

  const fetchSaved = useCallback(async () => {
    if (!isMe) return;
    try {
      const res = await feedApi.getSavedPosts();
      const posts = Array.isArray(res.data) ? res.data : [];
      setSavedPosts(posts);
    } catch (err) {
      console.warn('Saved posts fetch error', err);
    }
  }, [isMe]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchProfile();
      await fetchUserPosts(true);
      if (isMe) await fetchSaved();
      setLoading(false);
    })();
  }, [fetchProfile, isMe]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    await fetchUserPosts(true);
    if (isMe) await fetchSaved();
    setRefreshing(false);
  }, [fetchProfile, fetchUserPosts, fetchSaved, isMe]);

  const onEndReached = useCallback(async () => {
    if (activeTab !== 'posts' || !postsHasMore || loadingMore) return;
    setLoadingMore(true);
    await fetchUserPosts(false);
    setLoadingMore(false);
  }, [activeTab, postsHasMore, loadingMore, fetchUserPosts]);

  if (loading || !user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      <Image
        source={{
          uri:
            user.avatarUrl ||
            'https://ui-avatars.com/api/?name=' + user.displayName,
        }}
        style={styles.avatar}
      />
      <Text style={styles.displayName}>{user.displayName}</Text>
      <Text style={styles.username}>@{user.username}</Text>
      {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

      <View style={styles.statsRow}>
        <TouchableOpacity
          style={styles.stat}
          onPress={() =>
            navigation.navigate('FollowList', {
              userId: user._id,
              type: 'followers',
            })
          }>
          <Text style={styles.statNumber}>{user.followersCount}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.stat}
          onPress={() =>
            navigation.navigate('FollowList', {
              userId: user._id,
              type: 'following',
            })
          }>
          <Text style={styles.statNumber}>{user.followingCount}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </TouchableOpacity>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{user.postsCount}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
      </View>

      {isMe ? (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.editBtn} onPress={() => {}}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Icon name="log-out-outline" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actionRow}>
          <FollowButton userId={user._id} isFollowing={user.isFollowing} />
        </View>
      )}

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.tabActive]}
          onPress={() => setActiveTab('posts')}>
          <Icon
            name="grid-outline"
            size={20}
            color={activeTab === 'posts' ? COLORS.white : COLORS.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'posts' && styles.tabTextActive]}>
            Posts
          </Text>
        </TouchableOpacity>
        {isMe && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
            onPress={() => setActiveTab('saved')}>
            <Icon
              name="bookmark-outline"
              size={20}
              color={activeTab === 'saved' ? COLORS.white : COLORS.textMuted}
            />
            <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
              Saved
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {currentPosts.length === 0 && !loading && (
        <Text style={styles.emptyText}>
          {activeTab === 'posts' ? 'No posts yet' : 'No saved posts yet'}
        </Text>
      )}
    </View>
  );

  const renderPostThumb = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.thumb}
      onPress={() => navigation.navigate('Comments', { postId: item._id })}>
      <Image source={{ uri: item.thumbnailUrl || item.mediaUrl }} style={styles.thumbImg} />
      <View style={styles.thumbOverlay}>
        <Icon name="heart" size={14} color={COLORS.white} />
        <Text style={styles.thumbCount}>{item.likesCount ?? 0}</Text>
      </View>
    </TouchableOpacity>
  );

  const currentPosts = activeTab === 'posts' ? myPosts : savedPosts;

  return (
    <FlatList
      data={currentPosts}
      renderItem={renderPostThumb}
      keyExtractor={item => item._id}
      numColumns={3}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={
        loadingMore ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 16 }} />
        ) : null
      }
      style={styles.container}
      contentContainerStyle={styles.content}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.white}
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: 100,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: COLORS.primary,
    marginBottom: SPACING.md,
  },
  displayName: {
    color: COLORS.white,
    fontSize: FONT.xl,
    fontWeight: FONT.bold,
  },
  username: {
    color: COLORS.textSecondary,
    fontSize: FONT.md,
    marginTop: 2,
  },
  bio: {
    color: COLORS.textSecondary,
    fontSize: FONT.sm,
    textAlign: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.xxl,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: SPACING.xl,
    gap: SPACING.xxl,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    color: COLORS.white,
    fontSize: FONT.lg,
    fontWeight: FONT.bold,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT.xs,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  editBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
  },
  editBtnText: {
    color: COLORS.white,
    fontSize: FONT.sm,
    fontWeight: FONT.semibold,
  },
  logoutBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
  },
  tabRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.white,
  },
  tabText: {
    color: COLORS.textMuted,
    fontSize: FONT.sm,
    fontWeight: FONT.semibold,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: FONT.md,
    fontWeight: FONT.bold,
    alignSelf: 'flex-start',
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  thumb: {
    flex: 1 / 3,
    aspectRatio: 9 / 16,
    margin: 1,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  thumbOverlay: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  thumbCount: {
    color: COLORS.white,
    fontSize: FONT.xs,
    fontWeight: FONT.semibold,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: FONT.sm,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});

export default ProfileScreen;
