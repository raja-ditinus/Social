export type RootStackParamList = {
  MainTabs: undefined;
  Comments: { postId: string };
  UserProfile: { userId?: string };
  FollowList: { userId: string; type: 'followers' | 'following' };
};

export type TabParamList = {
  Feed: undefined;
  Search: undefined;
  Create: undefined;
  Profile: undefined;
};
