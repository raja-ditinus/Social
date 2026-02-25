import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { postsApi } from '../api';
import { Comment } from '../types';
import { CommentItem } from '../components';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONT, SPACING, BORDER_RADIUS } from '../theme';
import { COMMENTS_PAGE_SIZE } from '../config';
import { RootStackParamList } from '../navigation/types';
import { useHeaderHeight } from '@react-navigation/elements';

type CommentsRoute = RouteProp<RootStackParamList, 'Comments'>;

const CommentsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute<CommentsRoute>();
  const { postId } = route.params;
  const { userId } = useAuth();
  const headerHeight = useHeaderHeight()

  const [comments, setComments] = useState<Comment[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [flexToggle, setFlexToggle] = useState(false);

  // ── Fetch comments ──────────────────────────────────
  const fetchComments = useCallback(
    async (reset = false) => {
      try {
        const res = await postsApi.getComments(
          postId,
          reset ? undefined : cursor,
          COMMENTS_PAGE_SIZE,
        );

        console.log('Fetched comments', res.data);
        setComments(prev => (reset ? res.data : [...prev, ...res.data]));
        setHasMore(res.pagination?.hasMore ?? false);
        setCursor(res.pagination?.nextCursor ?? undefined);
      } catch (err) {
        console.warn('Comments fetch error', err);
      } finally {
        setLoading(false);
      }
    },
    [postId, cursor],
  );

  useEffect(() => {
    fetchComments(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  // ── Add comment ─────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await postsApi.addComment(postId, text.trim());
      setComments(prev => [res.data, ...prev]);
      setText('');
    } catch (err) {
      console.warn('Add comment error', err);
    } finally {
      setSending(false);
    }
  }, [text, sending, postId]);

  // ── Delete comment ──────────────────────────────────
  const handleDelete = useCallback(
    async (commentId: string) => {
      // optimistic
      setComments(prev => prev.filter(c => c._id !== commentId));
      try {
        await postsApi.deleteComment(commentId);
      } catch {
        // re-fetch on failure
        fetchComments(true);
      }
    },
    [fetchComments],
  );

  const onLikeChange = useCallback((commentId: string, liked: boolean, likeCount: number) => {
  setComments(prev =>
    prev.map(c =>
      c._id === commentId
        ? { ...c, isLiked: liked, likeCount, likesCount: likeCount } // keep both if your types use likesCount
        : c
    )
  );
}, []);

  const renderItem = useCallback(
    ({ item }: { item: Comment }) => (
      <CommentItem
        comment={item}
        onDelete={handleDelete}
        currentUserId={userId}
        onLikeChange={onLikeChange} 
      />
    ),
    [handleDelete, userId , onLikeChange],
  );
// Source - https://stackoverflow.com/a/79665003
// Posted by Iulian T, modified by community. See post 'Timeline' for change history
// Retrieved 2026-02-24, License - CC BY-SA 4.0

useEffect(() => {
  const keyboardShowListener = Keyboard.addListener("keyboardDidShow", () => {
    setFlexToggle(false);
  });

  const keyboardHideListener = Keyboard.addListener("keyboardDidHide", () => {
    setFlexToggle(true);
  });

  return () => {
    keyboardShowListener.remove();
    keyboardHideListener.remove();
  };
}, []);

  return (
    <KeyboardAvoidingView
       style={
    flexToggle
      ? [{ flexGrow: 1 }, styles.container]
      : [{ flex: 1 }, styles.container]
  }
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 30}
      enabled={!flexToggle}
      >
      <Text style={styles.title}>Comments</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
         style={{ flex: 1 }}
          data={comments}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          onEndReached={() => hasMore && fetchComments(false)}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.list}
             keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.emptyText}>No comments yet</Text>
          }
        />
      )}

      {/* Input bar */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + SPACING.md }]}>
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          placeholderTextColor={COLORS.textMuted}
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!text.trim() || sending}>
          <Text
            style={[
              styles.sendBtn,
              (!text.trim() || sending) && styles.sendDisabled,
            ]}>
            {sending ? '...' : 'Post'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  title: {
    color: COLORS.white,
    fontSize: FONT.lg,
    fontWeight: FONT.bold,
    textAlign: 'center',
    paddingTop: 16,
    paddingBottom: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingVertical: SPACING.sm,
  },
  emptyText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xxl,
    fontSize: FONT.md,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: FONT.md,
    backgroundColor: COLORS.inputBg,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    maxHeight: 100,
  },
  sendBtn: {
    color: COLORS.primary,
    fontSize: FONT.md,
    fontWeight: FONT.bold,
    marginLeft: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  sendDisabled: {
    opacity: 0.4,
  },
});

export default CommentsScreen;
