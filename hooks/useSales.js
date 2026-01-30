import { useState, useEffect } from 'react';
import { getAllSales } from '@/lib/firebase';

/**
 * Hook to fetch all sales
 * Returns { sales, loading, error }
 */
export function useSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true);
        const data = await getAllSales();
        setSales(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setSales([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  return { sales, loading, error };
}
