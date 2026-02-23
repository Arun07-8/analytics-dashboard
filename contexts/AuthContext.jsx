'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange, db } from '@/lib/firebase';
import { doc, getDoc } from "firebase/firestore";


const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (currentUser) => {
      if (currentUser) {
        const docSnap = await getDoc(
          doc(db, "admins", currentUser.uid)
        );

        if (docSnap.exists()) {
          const data = docSnap.data();

          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            name: data.name,
            role: data.role,
          });
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    // Listen for logout events from other tabs
    const handleStorageChange = (e) => {
      if (e.key === 'logout-event') {
        // Force logout if we receive a logout event from another tab
        setUser(null);
        // Firebase signOut might already be triggered, but we can call it again just in case
        // or just rely on the fact that setUser(null) will trigger redirection in pages.
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-muted border-t-primary"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
