import { useState, useEffect } from 'react';
import { getAllAdmins } from '@/lib/firebase';

/**
 * Hook to fetch all admins
 * Returns { admins, loading, error }
 */
export function useAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        setLoading(true);
        const data = await getAllAdmins();
        setAdmins(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setAdmins([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  return { admins, loading, error };
}
