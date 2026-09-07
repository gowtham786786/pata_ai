import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
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

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Reliable Multi-Tier Role Determination
  const determineUserRole = async (user) => {
    if (!user) return null;

    // 1. Direct Email Check for configured Super Admin
    if (user.email === 'reddygowtham397@gmail.com') {
      return 'admin';
    }

    // 2. Custom Token Claims Check (Firebase Auth native, fast & reliable)
    try {
      const idTokenResult = await user.getIdTokenResult(true);
      if (idTokenResult.claims?.role === 'admin') {
        return 'admin';
      }
    } catch (e) {
      console.warn("Could not check token claims:", e.message);
    }

    // 3. Backend Secure Verification (Bypasses client Firestore rules)
    try {
      const token = await user.getIdToken();
      const res = await axios.get(`${API_URL}/auth/role`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success && res.data?.role) {
        return res.data.role;
      }
    } catch (e) {
      console.warn("Backend role verification fallback:", e.message);
    }

    // 4. Client-side Firestore fallback
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists() && userDoc.data().role) {
        return userDoc.data().role;
      }
    } catch (error) {
      // Client Firestore rules may restrict read
    }

    return 'user';
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const role = await determineUserRole(user);
          setUserRole(role);
        } catch (e) {
          setUserRole(user.email === 'reddygowtham397@gmail.com' ? 'admin' : 'user');
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const role = await determineUserRole(cred.user);
      setUserRole(role);
      setCurrentUser(cred.user);
      return { user: cred.user, role };
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  };

  const loginWithEmail = async (email, password) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const role = await determineUserRole(cred.user);
      setUserRole(role);
      setCurrentUser(cred.user);
      return { user: cred.user, role };
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
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: name || email.split('@')[0],
          email: email,
          role: 'user',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        });
      } catch (err) {
        console.warn("Client profile write notice:", err.message);
      }
      
      setUserRole('user');
      setCurrentUser(user);
      return { user, role: 'user' };
    } catch (error) {
      console.error("Registration failed", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserRole(null);
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
    loading,
    determineUserRole,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
    updateUserPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
