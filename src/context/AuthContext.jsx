import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser
} from 'firebase/auth';
import { auth, googleProvider, db, storage } from '../config/firebase';
import { doc, setDoc, getDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Get additional user data from Firestore
          let userData = {};
          try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            userData = userDoc.data() || {};
          } catch (e) {
            console.warn('Could not fetch user data from Firestore:', e);
          }
          
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
      } catch (error) {
        console.error('Auth state change error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
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

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  // Change password (requires re-authentication)
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No user logged in');
      
      // Re-authenticate user first
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update password
      await updatePassword(currentUser, newPassword);
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  };

  // Delete user account
  const deleteAccount = async (password) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No user logged in');
      
      // Check if user signed in with Google (no password required for re-auth)
      const isGoogleUser = currentUser.providerData.some(
        provider => provider.providerId === 'google.com'
      );
      
      if (!isGoogleUser && password) {
        // Re-authenticate with password for email users
        const credential = EmailAuthProvider.credential(currentUser.email, password);
        await reauthenticateWithCredential(currentUser, credential);
      }
      
      // Delete user data from Firestore
      await deleteDoc(doc(db, 'users', currentUser.uid));
      
      // Delete the Firebase Auth user
      await deleteUser(currentUser);
      
      setUser(null);
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  };

  // Check if user signed in with Google
  const isGoogleUser = () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;
    return currentUser.providerData.some(
      provider => provider.providerId === 'google.com'
    );
  };

  // Update profile photo
  const updateProfilePhoto = async (file) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No user logged in');
      
      // Create a reference to the user's profile photo in Storage
      const photoRef = ref(storage, `profile-photos/${currentUser.uid}`);
      
      // Upload the file
      await uploadBytes(photoRef, file);
      
      // Get the download URL
      const photoURL = await getDownloadURL(photoRef);
      
      // Update Firebase Auth profile
      await updateProfile(currentUser, { photoURL });
      
      // Update Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, { photoURL }, { merge: true });
      
      // Update local user state
      setUser(prev => ({ ...prev, photoURL }));
      
      return photoURL;
    } catch (error) {
      console.error('Update profile photo error:', error);
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
    resetPassword,
    changePassword,
    deleteAccount,
    isGoogleUser,
    updateProfilePhoto,
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
