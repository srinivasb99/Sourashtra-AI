import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider, db } from '../config/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get additional user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userData = userDoc.data();
        
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || userData?.displayName || 'User',
          photoURL: firebaseUser.photoURL || userData?.photoURL || null,
          ...userData
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Save user to Firestore
  const saveUserToFirestore = async (user, additionalData = {}) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // New user - create document
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || additionalData.displayName || 'User',
          photoURL: user.photoURL || null,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          ...additionalData
        });
      } else {
        // Existing user - update last login
        await setDoc(userRef, {
          lastLogin: serverTimestamp(),
          // Update photo URL if it changed (for Google sign-in)
          ...(user.photoURL && { photoURL: user.photoURL })
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error saving user to Firestore:', error);
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Request additional scopes for profile info
      googleProvider.addScope('profile');
      googleProvider.addScope('email');
      
      const result = await signInWithPopup(auth, googleProvider);
      
      // Save/update user in Firestore
      await saveUserToFirestore(result.user);
      
      return result.user;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email, password, displayName) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(result.user, { displayName });
      
      // Save user to Firestore
      await saveUserToFirestore(result.user, { displayName });
      
      // Update local user state
      setUser({
        uid: result.user.uid,
        email: result.user.email,
        displayName: displayName,
        photoURL: null
      });
      
      return result.user;
    } catch (error) {
      console.error('Email sign up error:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login in Firestore
      await saveUserToFirestore(result.user);
      
      return result.user;
    } catch (error) {
      console.error('Email sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user?.displayName) return 'U';
    const names = user.displayName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    signOut,
    isAuthenticated: !!user,
    getUserInitials,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
