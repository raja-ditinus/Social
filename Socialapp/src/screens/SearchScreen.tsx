import React, { useCallback, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { searchApi, feedApi } from '../api';
import { Post, User } from '../types';
import { UserCard } from '../components';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONT, SPACING, BORDER_RADIUS } from '../theme';
import { RootStackParamList } from '../navigation/types';

type SearchTab = 'posts' | 'users';

const SearchScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { userId } = useAuth();

  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<SearchTab>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Load trending on mount
  React.useEffect(() => {
    (async () => {
      try {
        const res = await feedApi.getTrendingFeed(1, 12);
        setTrendingPosts(res.data);
      } catch {}
    })();
  }, []);

  const search = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      if (tab === 'posts') {
        const res = await searchApi.searchPosts(query);
        setPosts(res.data);
      } else {
        const res = await searchApi.searchUsers(query);
        setUsers(res.data);
      }
    } catch (err) {
      console.warn('Search error', err);
    } finally {
      setLoading(false);
    }
  }, [query, tab]);

  const renderTrendingGrid = () => (
    <View style={styles.grid}>
      {trendingPosts.map(post => (
        <TouchableOpacity
          key={post._id}
          style={styles.gridItem}
          onPress={() => navigation.navigate('Comments', { postId: post._id })}>
          <Image source={{ uri: post.mediaUrl }} style={styles.gridImg} />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPostItem = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.postRow}
      onPress={() => navigation.navigate('Comments', { postId: item._id })}>
      <Image source={{ uri: item.mediaUrl }} style={styles.postThumb} />
      <View style={styles.postInfo}>
        <Text style={styles.postCaption} numberOfLines={2}>
          {item.caption || 'Untitled'}
        </Text>
        <Text style={styles.postMeta}>
          @{item.author.username} · {item.likesCount} likes
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Icon
          name="search"
          size={20}
          color={COLORS.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Search..."
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={search}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setQuery('');
              setSearched(false);
            }}>
            <Icon name="close-circle" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tab toggle */}
      <View style={styles.tabs}>
        <TouchableOpacity
          onPress={() => {
            setTab('posts');
            if (searched) search();
          }}>
          <Text style={[styles.tabText, tab === 'posts' && styles.tabActive]}>
            Posts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setTab('users');
            if (searched) search();
          }}>
          <Text style={[styles.tabText, tab === 'users' && styles.tabActive]}>
            Users
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : !searched ? (
        <FlatList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={
            <>
              <Text style={styles.sectionTitle}>Trending</Text>
              {renderTrendingGrid()}
            </>
          }
        />
      ) : tab === 'posts' ? (
        <FlatList
          data={posts}
          renderItem={renderPostItem}
          keyExtractor={item => item._id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No posts found</Text>
          }
        />
      ) : (
        <FlatList
          data={users}
          renderItem={({ item }) => (
            <UserCard
              user={item}
              onPress={id => navigation.navigate('UserProfile', { userId: id })}
              currentUserId={userId}
            />
          )}
          keyExtractor={item => item._id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No users found</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 44,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: FONT.md,
  },
  tabs: {
    flexDirection: 'row',
    gap: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: FONT.md,
    fontWeight: FONT.semibold,
  },
  tabActive: {
    color: COLORS.white,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: FONT.lg,
    fontWeight: FONT.bold,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg - 1,
  },
  gridItem: {
    width: '33.33%',
    aspectRatio: 9 / 16,
    padding: 1,
  },
  gridImg: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  postRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  postThumb: {
    width: 60,
    height: 80,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.md,
  },
  postInfo: {
    flex: 1,
  },
  postCaption: {
    color: COLORS.white,
    fontSize: FONT.md,
    fontWeight: FONT.semibold,
  },
  postMeta: {
    color: COLORS.textSecondary,
    fontSize: FONT.sm,
    marginTop: 4,
  },
  emptyText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xxl,
    fontSize: FONT.md,
  },
});

export default SearchScreen;
