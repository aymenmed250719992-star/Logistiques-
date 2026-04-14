import { onAuthStateChanged, type User } from "firebase/auth";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { auth } from "@/services/firebase";
import {
  getUserProfile,
  signIn as fbSignIn,
  signOut as fbSignOut,
  signUp as fbSignUp,
  type FirestoreUser,
  type UserRole,
} from "@/services/authService";

interface AuthContextValue {
  currentUser: User | null;
  userProfile: FirestoreUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<FirestoreUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch {
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setIsLoading(false);
    });
    return unsub;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await fbSignIn(email, password);
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, name: string, role: UserRole) => {
      const profile = await fbSignUp(email, password, name, role);
      setUserProfile(profile);
    },
    []
  );

  const signOut = useCallback(async () => {
    await fbSignOut();
    setUserProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!currentUser) return;
    try {
      const profile = await getUserProfile(currentUser.uid);
      setUserProfile(profile);
    } catch {
      // ignore
    }
  }, [currentUser]);

  return (
    <AuthContext.Provider
      value={{ currentUser, userProfile, isLoading, signIn, signUp, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
