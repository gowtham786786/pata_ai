import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, googleProvider } from '../firebase/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  updatePassword
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch role from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role || 'user');
        } else {
          // If user doc doesn't exist (e.g. first time Google Login), create it
          await setDoc(userDocRef, {
            uid: user.uid,
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            role: 'user',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          });
          setUserRole('user');
        }
        
        // Update lastLogin on subsequent logins
        if (userDoc.exists()) {
           await setDoc(userDocRef, { lastLogin: new Date().toISOString() }, { merge: true });
        }
      } else {
        setUserRole(null);
      }
      
      setCurrentUser(user);
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  };

  const loginWithEmail = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Email Login failed", error);
      throw error;
    }
  };

  const registerWithEmail = async (email, password, name) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: name || email.split('@')[0],
        email: email,
        role: 'user',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      });
      
    } catch (error) {
      console.error("Registration failed", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const updateUserPassword = async (newPassword) => {
    if (!auth.currentUser) throw new Error("No user is currently signed in.");
    try {
      await updatePassword(auth.currentUser, newPassword);
    } catch (error) {
      console.error("Failed to set password", error);
      throw error;
    }
  };

  const value = {
    currentUser,
    userRole,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
    updateUserPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
