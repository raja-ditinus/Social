import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONT, SPACING, BORDER_RADIUS } from '../theme';

const LoginScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  // Login field
  const [loginId, setLoginId] = useState('');

  // Register fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');

  const handleLogin = async () => {
    if (!loginId.trim()) {
      Alert.alert('Error', 'Please enter your User ID');
      return;
    }
    setLoading(true);
    try {
      await login(loginId.trim());
    } catch (err: any) {
      Alert.alert('Login failed', err.message || 'Could not find user');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !displayName.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        displayName: displayName.trim(),
        bio: bio.trim() || undefined,
      });
    } catch (err: any) {
      Alert.alert(
        'Registration failed',
        err?.response?.data?.message || err.message || 'Something went wrong',
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
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top }]}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>SocialApp</Text>
        <Text style={styles.subtitle}>
          {isRegister ? 'Create your account' : 'Welcome back'}
        </Text>

        {isRegister ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Username *"
              placeholderTextColor={COLORS.textMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Email *"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Display Name *"
              placeholderTextColor={COLORS.textMuted}
              value={displayName}
              onChangeText={setDisplayName}
            />
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="Bio (optional)"
              placeholderTextColor={COLORS.textMuted}
              value={bio}
              onChangeText={setBio}
              multiline
            />
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleRegister}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.primaryBtnText}>Sign Up</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Enter your User ID (MongoDB _id)"
              placeholderTextColor={COLORS.textMuted}
              value={loginId}
              onChangeText={setLoginId}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleLogin}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.primaryBtnText}>Log In</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={() => setIsRegister(prev => !prev)}>
          <Text style={styles.switchText}>
            {isRegister
              ? 'Already have an account? Log In'
              : "Don't have an account? Sign Up"}
          </Text>
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
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  logo: {
    color: COLORS.primary,
    fontSize: FONT.xxl + 6,
    fontWeight: FONT.bold,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT.md,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
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
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: FONT.lg,
    fontWeight: FONT.bold,
  },
  switchText: {
    color: COLORS.accent,
    fontSize: FONT.sm,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
});

export default LoginScreen;
