// ============================================================================
// AUTHENTICATION CONTEXT (FIXED)
// ============================================================================
// Fixed version with proper SSR protection and localStorage access

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification as firebaseSendEmailVerification,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// ============================================================================
// SSR-SAFE UTILS
// ============================================================================

function isClient(): boolean {
  return typeof window !== "undefined";
}

function getStorageItem(key: string): string | null {
  if (!isClient()) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStorageItem(key: string, value: string): void {
  if (!isClient()) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    console.warn(`Failed to set localStorage item: ${key}`);
  }
}

function removeStorageItem(key: string): void {
  if (!isClient()) return;
  try {
    localStorage.removeItem(key);
  } catch {
    console.warn(`Failed to remove localStorage item: ${key}`);
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface AuthContextType {
  user: User | null;
  login: (username: string, pass: string) => Promise<void>;
  register: (username: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isEmailVerified: boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initialize Google Provider
const googleProvider = new GoogleAuthProvider();

// ============================================================================
// PROVIDER
// ============================================================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // ============================================================================
  // SSR-SAFE AUTH INIT
  // ============================================================================

  const initializeAuth = useCallback(async () => {
    // Check key storage item directly to avoid dependency cycle
    if (typeof window !== "undefined" && window.localStorage.getItem("rt_auth_initialized") === "true") {
      // check if we really have a user, if not we might need to listen apart from the flag
      // proceed to listener setup but don't reset flag
    }

    // Check for dev mode
    const isDevMode = getStorageItem("rt_dev_mode") === "true";
    if (isDevMode) {
      // ... same dev user creation ...
      const devUser = {
        uid: "dev-crytonix",
        email: "crytonix@webdev.local",
        displayName: "Crytonix WebDev",
        photoURL: null,
        emailVerified: true,
        isAnonymous: false,
        accessToken: "dev-token",
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
        }
      } as unknown as User;

      setUser(devUser);
      setIsLoading(false);
      setIsInitialized(true);
      return () => { }; // No cleanup needed for dev mode
    }

    // Set persistence with error handling
    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch (persistenceError) {
      console.warn("Auth persistence error (falling back to default):", persistenceError);
    }

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      // Ensure user document exists in Firestore
      if (currentUser) {
        await ensureUserDocument(currentUser);
      }

      setIsLoading(false);
      setIsInitialized(true);
    });

    // Cleanup on unmount - DO NOT reset isInitialized to false here as it triggers re-effect
    return () => {
      unsubscribe();
      // setIsInitialized(false); // REMOVED to prevent loop
    };
  }, []); // Removed isInitialized dependency

  // Initialize on mount (client-side only)
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    // Delay slightly to ensure Firebase is initialized
    const timer = setTimeout(() => {
      initializeAuth().then((cleanupFn) => {
        cleanup = cleanupFn;
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      cleanup?.();
    };
  }, [initializeAuth]);

  // ============================================================================
  // USER DOCUMENT MANAGEMENT
  // ============================================================================

  const ensureUserDocument = async (currentUser: User): Promise<void> => {
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create new user document
        const baseName = (currentUser.displayName || "User").replace(/\s+/g, '');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const username = `@${baseName}${randomSuffix}`;

        await setDoc(userDocRef, {
          email: currentUser.email,
          displayName: currentUser.displayName || baseName,
          username: username,
          photoURL: currentUser.photoURL,
          score: 0,
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          isPublic: true
        });
      } else if (!userDoc.data().username) {
        // Legacy support - add username
        const baseName = (currentUser.displayName || "User").replace(/\s+/g, '');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const username = `@${baseName}${randomSuffix}`;

        await setDoc(userDocRef, { username }, { merge: true });
      }
    } catch (error) {
      console.error("Error ensuring user document:", error);
      // Don't throw - this shouldn't block login
    }
  };

  // ============================================================================
  // AUTH ACTIONS
  // ============================================================================

  const FAKE_DOMAIN = "@routinetracker.local";

  const login = async (username: string, pass: string): Promise<void> => {
    // Developer bypass
    if (username.toLowerCase() === "crytonix") {
      const devUser = {
        uid: "dev-crytonix",
        email: "crytonix@webdev.local",
        displayName: "Crytonix WebDev",
        photoURL: null,
        emailVerified: true,
        isAnonymous: false,
        accessToken: "dev-token",
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
        }
      } as unknown as User;

      setUser(devUser);
      setIsLoading(false);
      setStorageItem("rt_dev_mode", "true");
      return;
    }

    const email = username.includes("@") ? username : `${username}${FAKE_DOMAIN}`;
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const register = async (username: string, pass: string): Promise<void> => {
    const email = `${username}${FAKE_DOMAIN}`;
    const result = await createUserWithEmailAndPassword(auth, email, pass);

    if (result.user) {
      try {
        const displayName = username;
        const uniqueUsername = `@${username.replace(/\s+/g, '')}`;

        await setDoc(doc(db, "users", result.user.uid), {
          email: result.user.email,
          displayName: displayName,
          username: uniqueUsername,
          score: 0,
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          isPublic: true
        });
      } catch (e) {
        console.error("Error creating profile on register:", e);
      }
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    await signInWithPopup(auth, googleProvider);
  };

  const sendEmailVerification = async (): Promise<void> => {
    if (user && !user.emailVerified) {
      await firebaseSendEmailVerification(user);
    }
  };

  const logout = async (): Promise<void> => {
    removeStorageItem("rt_dev_mode");
    setUser(null);
    await firebaseSignOut(auth);
  };

  const isEmailVerified = user?.emailVerified ?? false;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      loginWithGoogle,
      sendEmailVerification,
      logout,
      isLoading,
      isEmailVerified
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
