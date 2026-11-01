import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleAuthProvider, testFirestoreConnection } from '../../lib/firebase';
import { getCurrentUser, setCurrentUser, DEMO_USERS, UserProfile } from '../../lib/storage';

export interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  login: (email: string, password?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (name: string, email: string, password?: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(() => getCurrentUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Sync with Firestore user profile document
  const syncFirestoreProfile = async (fbUser: FirebaseUser, displayName?: string) => {
    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        const initialProfile = {
          uid: fbUser.uid,
          name: displayName || fbUser.displayName || fbUser.email?.split('@')[0] || 'Planner',
          email: fbUser.email || '',
          avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          role: 'planner',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(userDocRef, initialProfile);
      }
    } catch (err) {
      console.warn('Could not sync Firestore user document:', err);
    }
  };

  // Convert Firebase user to app UserProfile
  const mapFirebaseToProfile = (fbUser: FirebaseUser, overrideName?: string): UserProfile => {
    return {
      id: fbUser.uid,
      name: overrideName || fbUser.displayName || fbUser.email?.split('@')[0].replace('.', ' ') || 'Event Planner',
      email: fbUser.email || 'planner@eventai.app',
      role: 'planner',
      avatar:
        fbUser.photoURL ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    };
  };

  useEffect(() => {
    // Test initial connection as required by Firebase skill
    testFirestoreConnection();

    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentFirebaseUser) => {
      setFirebaseUser(currentFirebaseUser);

      if (currentFirebaseUser) {
        const appUser = mapFirebaseToProfile(currentFirebaseUser);
        setUser(appUser);
        setCurrentUser(appUser);
      } else {
        // If not logged in via Firebase, keep local stored user or default demo persona
        const fallback = getCurrentUser();
        setUser(fallback);
      }
      setIsLoading(false);
    });

    // Also support local demo persona switcher events
    const handleLocalUserChange = () => {
      const updated = getCurrentUser();
      setUser(updated);
    };
    window.addEventListener('event_ai_user_changed', handleLocalUserChange);

    return () => {
      unsubscribe();
      window.removeEventListener('event_ai_user_changed', handleLocalUserChange);
    };
  }, []);

  // Email / Password Login
  const login = async (email: string, password?: string) => {
    setError(null);
    setIsLoading(true);

    try {
      if (password && password.length >= 6) {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const mapped = mapFirebaseToProfile(cred.user);
        setUser(mapped);
        setCurrentUser(mapped);
        await syncFirestoreProfile(cred.user);
      } else {
        // Demo shortcut fallback if password is omitted or demo user clicked
        const matched = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
        const demoUser: UserProfile = matched || {
          id: `usr_${Date.now()}`,
          name: email.split('@')[0].replace('.', ' '),
          email,
          role: 'planner',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        };
        setUser(demoUser);
        setCurrentUser(demoUser);
      }
    } catch (err: any) {
      console.warn('Firebase signIn error:', err);
      // If user doesn't exist in Firebase yet during a demo, fallback gracefully to demo persona
      const matched = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (matched || !password) {
        const demoUser: UserProfile = matched || {
          id: `usr_${Date.now()}`,
          name: email.split('@')[0].replace('.', ' '),
          email,
          role: 'planner',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        };
        setUser(demoUser);
        setCurrentUser(demoUser);
      } else {
        const errorMsg =
          err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found'
            ? 'Invalid email or password. Please verify your credentials or create an account.'
            : err.message || 'Failed to sign in with Firebase Auth.';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Google Popup Login
  const loginWithGoogle = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const mapped = mapFirebaseToProfile(result.user);
      setUser(mapped);
      setCurrentUser(mapped);
      await syncFirestoreProfile(result.user);
    } catch (err: any) {
      console.warn('Google signIn error:', err);
      // If popup was cancelled or blocked in iframe sandbox, provide fallback demo Google user
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        const googleUser: UserProfile = {
          id: 'usr_google_planner',
          name: 'Demo Google Planner',
          email: 'planner.demo@gmail.com',
          role: 'planner',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        };
        setUser(googleUser);
        setCurrentUser(googleUser);
      } else {
        const errorMsg = err.message || 'Google Sign-In failed';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Up with Email/Password and create Profile
  const signup = async (name: string, email: string, password?: string) => {
    setError(null);
    setIsLoading(true);

    try {
      if (password && password.length >= 6) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        const mapped = mapFirebaseToProfile(cred.user, name);
        setUser(mapped);
        setCurrentUser(mapped);
        await syncFirestoreProfile(cred.user, name);
      } else {
        const newUser: UserProfile = {
          id: `usr_${Date.now()}`,
          name,
          email,
          role: 'planner',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        };
        setUser(newUser);
        setCurrentUser(newUser);
      }
    } catch (err: any) {
      console.warn('Firebase signup error:', err);
      const errorMsg =
        err.code === 'auth/email-already-in-use'
          ? 'This email address is already in use. Please sign in instead.'
          : err.code === 'auth/weak-password'
          ? 'Password must be at least 6 characters.'
          : err.message || 'Failed to create account.';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Password reset email
  const sendPasswordReset = async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      console.warn('Password reset error:', err);
      // Still allow UI to show success for email privacy
    }
  };

  // Sign out
  const logout = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Signout error:', err);
    } finally {
      const defaultUser = DEMO_USERS[0];
      setCurrentUser(defaultUser);
      setUser(defaultUser);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isAuthenticated: !!user,
        isLoading,
        error,
        clearError,
        login,
        loginWithGoogle,
        signup,
        sendPasswordReset,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
