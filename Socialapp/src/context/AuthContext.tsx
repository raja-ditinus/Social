import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, User } from '../types';
import { setAuthUserId } from '../api/client';
import { register as apiRegister, getUser } from '../api/users';

const STORAGE_KEY = '@social_user_id';

interface AuthContextValue extends AuthState {
  login: (userId: string) => Promise<void>;
  register: (body: {
    username: string;
    email: string;
    displayName: string;
    bio?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AuthState>({
    userId: null,
    user: null,
    isLoading: true,
  });

  // Bootstrap – check persisted user id
  useEffect(() => {
    (async () => {
      try {
        const storedId = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedId) {
          setAuthUserId(storedId);
          const res = await getUser(storedId);
          setState({ userId: storedId, user: res.data, isLoading: false });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    })();
  }, []);

  const login = useCallback(async (userId: string) => {
    setAuthUserId(userId);
    await AsyncStorage.setItem(STORAGE_KEY, userId);
    const res = await getUser(userId);
    setState({ userId, user: res.data, isLoading: false });
  }, []);

  const register = useCallback(
    async (body: {
      username: string;
      email: string;
      displayName: string;
      bio?: string;
    }) => {
      const res = await apiRegister(body);
      const newUser: User = res.data;
      setAuthUserId(newUser._id);
      await AsyncStorage.setItem(STORAGE_KEY, newUser._id);
      setState({ userId: newUser._id, user: newUser, isLoading: false });
    },
    [],
  );

  const logout = useCallback(async () => {
    setAuthUserId(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
    setState({ userId: null, user: null, isLoading: false });
  }, []);

  const refreshUser = useCallback(async () => {
    if (!state.userId) return;
    const res = await getUser(state.userId);
    setState(prev => ({ ...prev, user: res.data }));
  }, [state.userId]);

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
};
