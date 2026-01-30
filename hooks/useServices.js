import { useState, useEffect } from 'react';
import { getAllServices, getActiveServices } from '@/lib/firebase';

/**
 * Hook to fetch all services
 * @param {boolean} activeOnly - If true, fetch only active services
 * Returns { services, loading, error }
 */
export function useServices(activeOnly = false) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const data = activeOnly ? await getActiveServices() : await getAllServices();
        setServices(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [activeOnly]);

  return { services, loading, error };
}
