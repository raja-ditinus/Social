import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { postsApi } from '../api';
import { COLORS, FONT, SPACING, BORDER_RADIUS } from '../theme';

const CreatePostScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [mediaUrl, setMediaUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [mediaType, setMediaType] = useState<'video' | 'image'>('video');
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePost = async () => {
    if (!mediaUrl.trim()) {
      Alert.alert('Error', 'Media URL is required');
      return;
    }
    setLoading(true);
    try {
      await postsApi.createPost({
        mediaUrl: mediaUrl.trim(),
        mediaType,
        caption: caption.trim(),
        tags: tags
          .split(',')
          .map(t => t.trim())
          .filter(Boolean),
        thumbnailUrl: thumbnailUrl.trim() || undefined,
      });
      Alert.alert('Success', 'Post created!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.response?.data?.message || 'Failed to create post',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Post</Text>

        <TextInput
          style={styles.input}
          placeholder="Media URL *"
          placeholderTextColor={COLORS.textMuted}
          value={mediaUrl}
          onChangeText={setMediaUrl}
          autoCapitalize="none"
        />

        {mediaType === 'video' && (
          <TextInput
            style={styles.input}
            placeholder="Thumbnail URL (optional)"
            placeholderTextColor={COLORS.textMuted}
            value={thumbnailUrl}
            onChangeText={setThumbnailUrl}
            autoCapitalize="none"
          />
        )}

        <View style={styles.typeRow}>
          {(['video', 'image'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[
                styles.typeBtn,
                mediaType === t && styles.typeBtnActive,
              ]}
              onPress={() => setMediaType(t)}>
              <Text
                style={[
                  styles.typeBtnText,
                  mediaType === t && styles.typeBtnTextActive,
                ]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={[styles.input, styles.captionInput]}
          placeholder="Write a caption..."
          placeholderTextColor={COLORS.textMuted}
          value={caption}
          onChangeText={setCaption}
          multiline
        />

        <TextInput
          style={styles.input}
          placeholder="Tags (comma-separated)"
          placeholderTextColor={COLORS.textMuted}
          value={tags}
          onChangeText={setTags}
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={styles.postBtn}
          onPress={handlePost}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.postBtnText}>Post</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xxl,
  },
  title: {
    color: COLORS.white,
    fontSize: FONT.xl,
    fontWeight: FONT.bold,
    marginBottom: SPACING.xl,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    color: COLORS.white,
    fontSize: FONT.md,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  captionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeBtnText: {
    color: COLORS.textSecondary,
    fontSize: FONT.sm,
    fontWeight: FONT.semibold,
  },
  typeBtnTextActive: {
    color: COLORS.white,
  },
  postBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  postBtnText: {
    color: COLORS.white,
    fontSize: FONT.lg,
    fontWeight: FONT.bold,
  },
});

export default CreatePostScreen;
