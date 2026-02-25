import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Text,
  TouchableOpacity,
  ViewToken,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { feedApi } from '../api';
import { Post, FeedApiResponse } from '../types';
import { ReelCard } from '../components';
import { COLORS, FONT, SPACING } from '../theme';
import { FEED_PAGE_SIZE } from '../config';
import { RootStackParamList } from '../navigation/types';

const { height: SCREEN_H } = Dimensions.get('window');

type FeedTab = 'public' | 'following' | 'trending';

const FeedScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const itemHeight = SCREEN_H - tabBarHeight;
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [tab, setTab] = useState<FeedTab>('public');
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const flatListRef = useRef<FlatList<Post>>(null);

  // ── Fetch ───────────────────────────────────────────
  const fetchPosts = useCallback(
    async (reset = false) => {
      if (loading) return;
      setLoading(true);
      try {
        let res: FeedApiResponse;
        if (tab === 'public') {
          res = await feedApi.getPublicFeed(
            reset ? undefined : cursor,
            FEED_PAGE_SIZE,
          );
        } else if (tab === 'following') {
          res = await feedApi.getFollowingFeed(
            reset ? undefined : cursor,
            FEED_PAGE_SIZE,
          );
        } else {
          res = await feedApi.getTrendingFeed(
            reset ? 1 : page,
            FEED_PAGE_SIZE,
          );

        }

        const newPosts = res.data;

        console.log(res.data, 'fetched posts for tab', tab, 'reset:', reset);
        setPosts(prev => {
          if (reset) return newPosts;
          const existingIds = new Set(prev.map(p => p._id));
          const unique = newPosts.filter(p => !existingIds.has(p._id));
          return [...prev, ...unique];
        });
        setHasMore(res.pagination?.hasMore ?? newPosts.length >= FEED_PAGE_SIZE);

        if (tab === 'trending') {
          setPage(prev => (reset ? 2 : prev + 1));
        } else {
          setCursor(res.pagination?.nextCursor ?? undefined);
        }

        // Prefetch next batch thumbnails
        if (res.prefetch?.length) {
          res.prefetch.forEach(item => {
            const url = item.thumbnailUrl || item.mediaUrl;
            if (url) {
              Image.prefetch(url).catch(() => {});
            }
          });
        }
      } catch (err) {
        console.warn('Feed fetch error', err);
      } finally {
        setLoading(false);
      }
    },
    [tab, cursor, page, loading],
  );

  // Initial load & tab change
  useEffect(() => {
    setPosts([]);
    setCursor(undefined);
    setPage(1);
    setHasMore(true);
    // Small delay so state resets before fetch
    const t = setTimeout(() => fetchPosts(true), 50);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ── Pull-to-refresh ─────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setCursor(undefined);
    setPage(1);
    setHasMore(true);
    await fetchPosts(true);
    setRefreshing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ── Infinite scroll ─────────────────────────────────
  const onEndReached = useCallback(() => {
    if (hasMore && !loading) {
      fetchPosts(false);
    }
  }, [hasMore, loading, fetchPosts]);

  // ── Viewability tracking ────────────────────────────
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  // ── Render ──────────────────────────────────────────
  const renderItem = useCallback(
    ({ item, index }: { item: Post; index: number }) => (
      <ReelCard
        post={item}
        isActive={index === activeIndex}
        height={itemHeight}
        onCommentPress={postId =>
          navigation.navigate('Comments', { postId })
        }
        onProfilePress={userId =>
          navigation.navigate('UserProfile', { userId })
        }
      />
    ),
    [activeIndex, navigation, itemHeight],
  );

  const keyExtractor = useCallback((item: Post) => item._id, []);

  return (
    <View style={styles.container}>
      {/* Tab switcher */}
      <View style={[styles.tabBar, { top: insets.top + 10 }]}>
        {(['public', 'following', 'trending'] as FeedTab[]).map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={styles.tabBtn}>
            <Text style={[styles.tabLabel, tab === t && styles.tabActive]}>
              {t === 'public'
                ? 'For You'
                : t === 'following'
                ? 'Following'
                : 'Trending'}
            </Text>
            {tab === t && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        ref={flatListRef}
        data={posts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        onEndReached={onEndReached}
        onEndReachedThreshold={1}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        })}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.white}
          />
        }
        ListFooterComponent={
          loading && posts.length > 0 ? (
            <View style={styles.loader}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No posts yet</Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <ActivityIndicator color={COLORS.primary} size="large" />
            </View>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  tabBar: {
    position: 'absolute',
    top: 50, // overridden by dynamic insets.top
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 10,
    gap: SPACING.xl,
  },
  tabBtn: {
    alignItems: 'center',
  },
  tabLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT.md,
    fontWeight: FONT.semibold,
  },
  tabActive: {
    color: COLORS.white,
    fontWeight: FONT.bold,
  },
  tabIndicator: {
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.white,
    marginTop: 4,
  },
  loader: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    height: SCREEN_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONT.lg,
  },
});

export default FeedScreen;
