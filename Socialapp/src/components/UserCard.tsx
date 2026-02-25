import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { User } from '../types';
import FollowButton from './FollowButton';
import { COLORS, FONT, SPACING, BORDER_RADIUS } from '../theme';

interface UserCardProps {
  user: User;
  onPress: (userId: string) => void;
  showFollow?: boolean;
  currentUserId?: string | null;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  onPress,
  showFollow = true,
  currentUserId,
}) => {
  const isMe = currentUserId === user._id;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(user._id)}
      activeOpacity={0.7}>
      <Image
        source={{
          uri:
            user.avatarUrl ||
            'https://ui-avatars.com/api/?name=' + user.displayName,
        }}
        style={styles.avatar}
      />
      <View style={styles.info}>
        <Text style={styles.displayName} numberOfLines={1}>
          {user.displayName}
        </Text>
        <Text style={styles.username} numberOfLines={1}>
          @{user.username}
        </Text>
      </View>
      {showFollow && !isMe && (
        <FollowButton userId={user._id} isFollowing={user.isFollowing} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.md,
  },
  info: {
    flex: 1,
  },
  displayName: {
    color: COLORS.white,
    fontSize: FONT.md,
    fontWeight: FONT.bold,
  },
  username: {
    color: COLORS.textSecondary,
    fontSize: FONT.sm,
    marginTop: 2,
  },
});

export default React.memo(UserCard);
