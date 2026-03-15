'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoader } from '@/components/page-loader';

const LoadingContext = createContext({
  setIsLoading: () => {},
});

export const useLoading = () => useContext(LoadingContext);

export function LoadingProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);
  const { loading: authLoading } = useAuth();
  const pathname = usePathname();

  // Reset loading state when pathname changes 
  // BUT only if we are manually loading. 
  // The full overlay will depend on both manual isLoading and global authLoading
  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  // The actual loading state is a combination of manual triggers and auth state
  const showLoader = isLoading || authLoading;

  return (
    <LoadingContext.Provider value={{ setIsLoading }}>
      {children}
      {showLoader && <PageLoader />}
    </LoadingContext.Provider>
  );
}
