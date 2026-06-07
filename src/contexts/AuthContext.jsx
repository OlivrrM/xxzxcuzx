import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, firebaseInitError } from "../firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

const AuthContext = createContext({
  user: null,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || firebaseInitError) {
      setLoading(false);
      return () => {};
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = (email, password) => {
    if (!auth) {
      return Promise.reject(new Error(firebaseInitError || "Firebase auth is not configured."));
    }
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    if (!auth) {
      return Promise.reject(new Error(firebaseInitError || "Firebase auth is not configured."));
    }
    return signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
