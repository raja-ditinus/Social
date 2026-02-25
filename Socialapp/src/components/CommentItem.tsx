import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Comment as CommentType } from '../types';
import { COLORS, FONT, SPACING, BORDER_RADIUS } from '../theme';
import { postsApi } from '../api';

interface CommentItemProps {
  comment: CommentType;
  onReply?: (comment: CommentType) => void;
  onDelete?: (commentId: string) => void;
  currentUserId?: string | null;

  // ✅ add this
  onLikeChange?: (commentId: string, liked: boolean, likeCount: number) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onDelete,
  currentUserId,
  onLikeChange,
}) => {
  const initialLikeCount = comment.likeCount ?? comment.likesCount ?? 0;

  const [liked, setLiked] = useState(comment.isLiked ?? false);
  const [likeCount, setLikeCount] = useState<number>(initialLikeCount);

  // ✅ sync local state when list data updates / re-fetch / virtualization remount
  useEffect(() => {
    setLiked(comment.isLiked ?? false);
    setLikeCount(comment.likeCount ?? comment.likesCount ?? 0);
  }, [comment._id, comment.isLiked, comment.likeCount, comment.likesCount]);

  const handleLike = useCallback(async () => {
    const wasLiked = liked;

    // optimistic UI
    setLiked(!wasLiked);
    setLikeCount(prev => (wasLiked ? Math.max(0, prev - 1) : prev + 1));

    try {
      const res = await postsApi.toggleCommentLike(comment._id);
      const d = res.data ?? {};

      const serverLiked = d.liked ?? !wasLiked;
      const serverCount =
        d.likeCount ?? (wasLiked ? Math.max(0, likeCount - 1) : likeCount + 1);

      setLiked(serverLiked);
      setLikeCount(serverCount);

      // ✅ update parent list state so it persists when row unmount/mount
      onLikeChange?.(comment._id, serverLiked, serverCount);
    } catch {
      // revert
      setLiked(wasLiked);
      setLikeCount(prev => (wasLiked ? prev + 1 : Math.max(0, prev - 1)));
    }
  }, [liked, comment._id, onLikeChange, likeCount]);

  const isOwner = currentUserId === comment.author._id;

  return (
    <View style={styles.container}>
      <Image
        source={{
          uri:
            comment.author.avatarUrl ||
            'https://ui-avatars.com/api/?name=' + comment.author.displayName,
        }}
        style={styles.avatar}
      />

      <View style={styles.body}>
        <Text style={styles.username}>@{comment.author.username}</Text>
        <Text style={styles.text}>{comment.text}</Text>

        <View style={styles.row}>
          <Text style={styles.time}>
            {new Date(comment.createdAt).toLocaleDateString()}
          </Text>

          {onReply && (
            <TouchableOpacity onPress={() => onReply(comment)}>
              <Text style={styles.replyBtn}>Reply</Text>
            </TouchableOpacity>
          )}

          {isOwner && onDelete && (
            <TouchableOpacity onPress={() => onDelete(comment._id)}>
              <Text style={styles.deleteBtn}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TouchableOpacity onPress={handleLike} style={styles.likeWrap}>
        <Icon
          name={liked ? 'heart' : 'heart-outline'}
          size={16}
          color={liked ? COLORS.like : COLORS.textMuted}
        />
        <Text style={styles.likeCount}>{likeCount}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
  },
  body: { flex: 1 },
  username: {
    color: COLORS.white,
    fontSize: FONT.sm,
    fontWeight: FONT.bold,
  },
  text: {
    color: COLORS.white,
    fontSize: FONT.sm,
    lineHeight: 18,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: SPACING.md,
  },
  time: { color: COLORS.textMuted, fontSize: FONT.xs },
  replyBtn: {
    color: COLORS.textSecondary,
    fontSize: FONT.xs,
    fontWeight: FONT.semibold,
  },
  deleteBtn: {
    color: COLORS.error,
    fontSize: FONT.xs,
    fontWeight: FONT.semibold,
  },
  likeWrap: {
    alignItems: 'center',
    paddingTop: SPACING.sm,
    paddingLeft: SPACING.sm,
  },
  likeCount: { color: COLORS.textMuted, fontSize: FONT.xs, marginTop: 2 },
});

export default React.memo(CommentItem);
