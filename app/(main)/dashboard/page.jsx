'use client';

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DashboardTable } from "@/components/dashboard/sections-table"
import { SectionCards } from "@/components/section-cards"
import { useState, useMemo } from "react";
import data from "../data.json"
import { subscribeToSales, getAllCustomers, getAllAdmins } from "@/lib/firebase/collections";

export const dynamic = 'force-dynamic';
export default function Page() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [admins, setAdmins] = useState([]);

useEffect(() => {
  if (!loading) {
    if (!user) {
      router.push('/login');
    } else if (user.role?.trim().toLowerCase() !== "admin") {
      router.push('/sales');
    }
  }
}, [user, loading, router]);


  useEffect(() => {
    if (!user || user.role?.trim().toLowerCase() !== "admin") return;

    const unsubscribe = subscribeToSales({}, (salesData) => {
      setSales(salesData); // ALL sales
    });

    const loadData = async () => {
      const [customerData, adminData] = await Promise.all([
        getAllCustomers(),
        getAllAdmins()
      ]);
      setCustomers(customerData);
      setAdmins(adminData);
    };

    loadData();

    return () => unsubscribe();
  }, [user]);

  const stats = useMemo(() => {
    const totalRevenue = sales.reduce(
      (sum, sale) => sum + (Number(sale.totalAmount) || 0),
      0
    );

    const activeAccounts = admins.filter(a => a.role === "staff").length;

    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );

    const newCustomers = customers.filter(c => {
      const date = c.createdAt?.toDate
        ? c.createdAt.toDate()
        : new Date(c.createdAt);
      return date >= startOfMonth;
    }).length;

    return {
      totalRevenue,
      activeAccounts,
      newCustomers
    };
  }, [sales, customers, admins]);

// Loading first
if (loading) {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    </div>
  );
}

// If not logged in
if (!user) {
  return null;
}

// If not admin
if (user.role !== "admin") {
  return null;
}

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards stats={stats} />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive />
        </div>
        <DashboardTable data={data} />
      </div>
    </div>
  )
}
