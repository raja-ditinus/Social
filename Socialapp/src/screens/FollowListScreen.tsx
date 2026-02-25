import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usersApi } from '../api';
import { User } from '../types';
import { UserCard } from '../components';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONT, SPACING } from '../theme';
import { RootStackParamList } from '../navigation/types';

type FollowListRoute = RouteProp<RootStackParamList, 'FollowList'>;

const FollowListScreen: React.FC = () => {
  const route = useRoute<FollowListRoute>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { userId: authUserId } = useAuth();
  const { userId, type } = route.params;

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const res =
        type === 'followers'
          ? await usersApi.getFollowers(userId)
          : await usersApi.getFollowing(userId);
      setUsers(res.data);
    } catch (err) {
      console.warn('FollowList error', err);
    } finally {
      setLoading(false);
    }
  }, [userId, type]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {type === 'followers' ? 'Followers' : 'Following'}
      </Text>
      <FlatList
        data={users}
        renderItem={({ item }) => (
          <UserCard
            user={item}
            onPress={id => navigation.push('UserProfile', { userId: id })}
            currentUserId={authUserId}
          />
        )}
        keyExtractor={item => item._id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No users</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  title: {
    color: COLORS.white,
    fontSize: FONT.lg,
    fontWeight: '700',
    textAlign: 'center',
    paddingTop: 16,
    paddingBottom: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  emptyText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xxl,
    fontSize: FONT.md,
  },
});

export default FollowListScreen;
