import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LoginScreen, CommentsScreen, ProfileScreen, FollowListScreen } from '../screens';
import BottomTabs from './BottomTabs';
import { COLORS } from '../theme';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { userId, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: COLORS.background,
        }}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {userId ? (
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.background },
          }}>
          <Stack.Screen name="MainTabs" component={BottomTabs} />
          <Stack.Screen
            name="Comments"
            component={CommentsScreen}
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: '',
              headerStyle: { backgroundColor: COLORS.background },
              headerTintColor: COLORS.white,
            }}
          />
          <Stack.Screen
            name="UserProfile"
            component={ProfileScreen}
            options={{
              headerShown: true,
              headerTitle: 'Profile',
              headerStyle: { backgroundColor: COLORS.background },
              headerTintColor: COLORS.white,
            }}
          />
          <Stack.Screen
            name="FollowList"
            component={FollowListScreen}
            options={{
              headerShown: true,
              headerTitle: '',
              headerStyle: { backgroundColor: COLORS.background },
              headerTintColor: COLORS.white,
            }}
          />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
