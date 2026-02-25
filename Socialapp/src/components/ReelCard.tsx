import React, { useCallback, useState, } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  
} from 'react-native';
import Video, { ResizeMode } from 'react-native-video';
import Icon from 'react-native-vector-icons/Ionicons';
import { Post } from '../types';
import { COLORS, FONT, SPACING } from '../theme';
import { postsApi } from '../api';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface ReelCardProps {
  post: Post;
  isActive: boolean;
  height: number;
  onCommentPress: (postId: string) => void;
  onProfilePress: (userId: string) => void;
}

const ReelCard: React.FC<ReelCardProps> = ({
  post,
  isActive,
  height,
  onCommentPress,
  onProfilePress,
}) => {
  const [buffering, setBuffering] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  // priority="play" → load video eagerly; "next" → only load when active
  const shouldLoadVideo =
    post.priority === 'play' || isActive;

  // Optimistic local state
  const [liked, setLiked] = useState(post.isLiked ?? false);
  const [likesCount, setLikesCount] = useState(post.likesCount ?? 0);
  const [saved, setSaved] = useState(post.isSaved ?? false);
  const [savesCount, setSavesCount] = useState(post.savesCount ?? 0);

  // Sync local state when post prop changes (refresh / re-fetch)
  React.useEffect(() => {
    setLiked(post.isLiked ?? false);
    setLikesCount(post.likesCount ?? 0);
    setSaved(post.isSaved ?? false);
    setSavesCount(post.savesCount ?? 0);
    setVideoReady(false);
  }, [post._id, post.isLiked, post.likesCount, post.isSaved, post.savesCount]);

  // Record view when reel becomes active
  React.useEffect(() => {
    if (isActive) {
      postsApi.recordView(post._id).catch(() => {});
    }
  }, [isActive, post._id]);

  const handleLike = useCallback(async () => {
    // optimistic
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikesCount(prev => (wasLiked ? Math.max(0, prev - 1) : prev + 1));
    try {
      const res = await postsApi.toggleLike(post._id);
      const d: any = res.data ?? {};
      setLiked(d.liked ?? !wasLiked);
      setLikesCount(d.likesCount ?? d.likeCount ?? (wasLiked ? Math.max(0, likesCount - 1) : likesCount + 1));
    } catch {
      // revert
      setLiked(wasLiked);
      setLikesCount(prev => (wasLiked ? prev + 1 : Math.max(0, prev - 1)));
    }
  }, [liked, post._id]);

  const handleSave = useCallback(async () => {
    const wasSaved = saved;
    setSaved(!wasSaved);
    setSavesCount(prev => (wasSaved ? Math.max(0, prev - 1) : prev + 1));
    try {
      const res = await postsApi.toggleSave(post._id);
      const d: any = res.data ?? {};
      setSaved(d.saved ?? !wasSaved);
      setSavesCount(d.savesCount ?? d.saves ?? d.saveCount ?? (wasSaved ? Math.max(0, savesCount - 1) : savesCount + 1));
    } catch {
      // revert
      setSaved(wasSaved);
      setSavesCount(prev => (wasSaved ? prev + 1 : Math.max(0, prev - 1)));
    }
  }, [saved, post._id]);

  const handleShare = useCallback(async () => {
    try {
      await postsApi.recordShare(post._id);
    } catch {}
  }, [post._id]);

  const isVideo =
    post.mediaType === 'video' ||
    /\.(mp4|mov|m3u8|webm|mkv)(\?|$)/i.test(post.mediaUrl);

  // Thumbnail URL: use thumbnailUrl from API, or for images use the mediaUrl itself
  const posterUrl = post.thumbnailUrl || (!isVideo ? post.mediaUrl : undefined);

  return (
    <View style={[styles.container, { height }]}>
      {/* Thumbnail poster – always rendered behind video as placeholder */}
      {posterUrl ? (
        <Image
          source={{ uri: posterUrl }}
          style={[styles.media, { height }]}
          resizeMode={ResizeMode.CONTAIN}
        />
      ) : (
        <View style={[styles.media, { height, backgroundColor: COLORS.black }]} />
      )}

      {/* Video – rendered on top; only mounted when priority="play" or active */}
      {isVideo && shouldLoadVideo ? (
        <>
          <Video
            source={{
              uri: post.mediaUrl,
              bufferConfig: {
                minBufferMs: 2500,
                maxBufferMs: 10000,
                bufferForPlaybackMs: 1000,
                bufferForPlaybackAfterRebufferMs: 2000,
              },
            }}
            style={[styles.media, { height, opacity: videoReady ? 1 : 0 }]}
            resizeMode={ResizeMode.CONTAIN}
            repeat={true}
            paused={!isActive}
            muted={false}
            playInBackground={false}
            playWhenInactive={false}
            useTextureView={true}
            poster={posterUrl}
            posterResizeMode={ResizeMode.COVER}
            onLoad={(data: any) => {
              setVideoReady(true);
              setBuffering(false);
            }}
            onBuffer={(data: any) => {
              setBuffering(data?.isBuffering);
            }}
            onError={(e: any) => console.warn('Video error:', JSON.stringify(e?.error || e))}
          />
          {(buffering || !videoReady) && isActive && (
            <View style={styles.bufferOverlay}>
              <ActivityIndicator size="large" color={COLORS.white} />
            </View>
          )}
        </>
      ) : null}

      {/* Gradient overlay – pointerEvents none so buttons remain tappable */}
      <View style={styles.overlay} pointerEvents="none" />

      {/* Right action column */}
      <View style={styles.actions}>
        {/* Author avatar */}
        <TouchableOpacity
          onPress={() => onProfilePress(post.author._id)}
          style={styles.avatarWrap}>
          <Image
            source={{
              uri:
                post.author.avatarUrl ||
                'https://ui-avatars.com/api/?name=' + post.author.displayName,
            }}
            style={styles.avatar}
          />
        </TouchableOpacity>

        {/* Like */}
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <Icon
            name={liked ? 'heart' : 'heart-outline'}
            size={30}
            color={liked ? COLORS.like : COLORS.white}
          />
          <Text style={styles.actionCount}>{likesCount}</Text>
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onCommentPress(post._id)}>
          <Icon name="chatbubble-outline" size={28} color={COLORS.white} />
          <Text style={styles.actionCount}>{post.commentsCount ?? 0}</Text>
        </TouchableOpacity>

        {/* Save */}
        <TouchableOpacity style={styles.actionBtn} onPress={handleSave}>
          <Icon
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={28}
            color={saved ? COLORS.accent : COLORS.white}
          />
          <Text style={styles.actionCount}>{savesCount}</Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <Icon name="paper-plane-outline" size={26} color={COLORS.white} />
          <Text style={styles.actionCount}>{post.sharesCount ?? 0}</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom info */}
      <View style={styles.info}>
        <TouchableOpacity onPress={() => onProfilePress(post.author._id)}>
          <Text style={styles.username}>@{post.author.username}</Text>
        </TouchableOpacity>
        {post.caption ? (
          <Text style={styles.caption} numberOfLines={2}>
            {post.caption}
          </Text>
        ) : null}
        {post.tags?.length > 0 && (
          <Text style={styles.tags}>
            {post.tags.map(t => `#${t}`).join(' ')}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_W,
    backgroundColor: COLORS.black,
  },
  media: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_W,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
    opacity: 0.3,
  },
  bufferOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    position: 'absolute',
    right: SPACING.md,
    bottom: 80,
    alignItems: 'center',
    gap: SPACING.lg,
  },
  avatarWrap: {
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  actionBtn: {
    alignItems: 'center',
  },
  actionCount: {
    color: COLORS.white,
    fontSize: FONT.xs,
    marginTop: 2,
    fontWeight: FONT.semibold,
  },
  info: {
    position: 'absolute',
    bottom: 24,
    left: SPACING.lg,
    right: 80,
  },
  username: {
    color: COLORS.white,
    fontSize: FONT.md,
    fontWeight: FONT.bold,
    marginBottom: SPACING.xs,
  },
  caption: {
    color: COLORS.white,
    fontSize: FONT.sm,
    lineHeight: 18,
  },
  tags: {
    color: COLORS.accent,
    fontSize: FONT.sm,
    marginTop: SPACING.xs,
  },
});

export default React.memo(ReelCard);
