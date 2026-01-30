import { useState, useEffect } from 'react';
import { getAllCustomers } from '@/lib/firebase';

/**
 * Hook to fetch all customers
 * Returns { customers, loading, error }
 */
export function useCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const data = await getAllCustomers();
        setCustomers(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  return { customers, loading, error };
}
