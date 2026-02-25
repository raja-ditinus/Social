import React, { useCallback, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { usersApi } from '../api';
import { COLORS, FONT, SPACING, BORDER_RADIUS } from '../theme';

interface FollowButtonProps {
  userId: string;
  isFollowing?: boolean;
}

const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  isFollowing: initialFollowing = false,
}) => {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const handlePress = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    const prev = following;
    // optimistic
    setFollowing(!prev);
    try {
      if (prev) {
        await usersApi.unfollowUser(userId);
      } else {
        await usersApi.followUser(userId);
      }
    } catch {
      setFollowing(prev);
    } finally {
      setLoading(false);
    }
  }, [following, loading, userId]);

  return (
    <TouchableOpacity
      style={[styles.btn, following ? styles.following : styles.follow]}
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={loading}>
      <Text style={[styles.label, following && styles.followingLabel]}>
        {following ? 'Following' : 'Follow'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 90,
    alignItems: 'center',
  },
  follow: {
    backgroundColor: COLORS.primary,
  },
  following: {
    backgroundColor: COLORS.transparent,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  label: {
    color: COLORS.white,
    fontSize: FONT.sm,
    fontWeight: FONT.bold,
  },
  followingLabel: {
    color: COLORS.textSecondary,
  },
});

export default React.memo(FollowButton);
