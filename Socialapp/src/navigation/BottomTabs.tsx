import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { FeedScreen, SearchScreen, CreatePostScreen, ProfileScreen } from '../screens';
import { COLORS, FONT } from '../theme';
import { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const tabIcons: Record<keyof TabParamList, { focused: string; default: string }> = {
  Feed: { focused: 'home', default: 'home-outline' },
  Search: { focused: 'search', default: 'search-outline' },
  Create: { focused: 'add-circle', default: 'add-circle-outline' },
  Profile: { focused: 'person', default: 'person-outline' },
};

const BottomTabs: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 6,
        },
        tabBarActiveTintColor: COLORS.white,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: FONT.xs,
          fontWeight: FONT.semibold,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = tabIcons[route.name];
          return (
            <Icon
              name={focused ? icons.focused : icons.default}
              size={size}
              color={color}
            />
          );
        },
      })}>
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: 'Explore' }} />
      <Tab.Screen name="Create" component={CreatePostScreen} />
      <Tab.Screen name="Profile">
        {() => <ProfileScreen />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default BottomTabs;
