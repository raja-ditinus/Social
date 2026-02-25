/**
 * SocialApp – Reels / TikTok-style social app
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation';

function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
