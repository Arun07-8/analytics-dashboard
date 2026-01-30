import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to use authenticated user context
 * Returns { user, loading }
 */
export function useAuthUser() {
  return useAuth();
}
