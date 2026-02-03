'use client';
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useMemo } from "react";
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SalesTable } from "@/components/sales/sales-table"
import { SectionCards } from "@/components/section-cards"
import { Button } from "@/components/ui/button";
import { IconUserPlus, IconPlus } from "@tabler/icons-react";
import { CustomerModal } from "@/components/customers/customer-modal";
import { createCustomer, getCustomerByEmail, getCustomerByMobile, getAllSales, getAllCustomers, getAllAdmins } from "@/lib/firebase/collections";
import { toast } from "sonner";

// Mark this page as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

export default function Page() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const initialCustomerFormData = {
    name: '',
    mobile: '',
    email: '',
    country: '',
    place: '',
    state: '',
    city: '',
    pincode: '',
    address: ''
  };

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerErrors, setCustomerErrors] = useState({});
  const [customerFormData, setCustomerFormData] = useState(initialCustomerFormData);

  // Data states
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const resetCustomerForm = () => {
    setCustomerFormData(initialCustomerFormData);
    setCustomerErrors({});
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoadingData(true);
        const [salesData, customersData, adminsData] = await Promise.all([
          getAllSales(),
          getAllCustomers(),
          getAllAdmins()
        ]);
        setSales(salesData);
        setCustomers(customersData);
        setAdmins(adminsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [user]);

  // Process data for components
  const salesWithDetails = useMemo(() => {
    const customerMap = new Map(customers.map(c => [c.id, c.name]));
    const adminMap = new Map(admins.map(a => [a.id, a.name]));

    return sales.map(sale => ({
      ...sale,
      customerName: customerMap.get(sale.customerId) || 'Unknown Customer',
      staffName: adminMap.get(sale.staffId) || 'Unknown Staff'
    })).sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB - dateA; // Descending
    });
  }, [sales, customers, admins]);

  const stats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfLastMonth = new Date(currentYear, currentMonth, 0);

    let totalRevenue = 0;
    let currentMonthRevenue = 0;
    let lastMonthRevenue = 0;

    let newCustomersCount = 0;
    let lastMonthCustomersCount = 0;
    let activeAccountsCount = customers.length;

    sales.forEach(sale => {
      const amount = Number(sale.totalAmount) || 0;
      totalRevenue += amount;

      const date = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt);
      if (date >= startOfCurrentMonth) {
        currentMonthRevenue += amount;
      } else if (date >= startOfLastMonth && date <= endOfLastMonth) {
        lastMonthRevenue += amount;
      }
    });

    customers.forEach(customer => {
      const date = customer.createdAt?.toDate ? customer.createdAt.toDate() : new Date(customer.createdAt || 0);
      if (date >= startOfCurrentMonth) {
        newCustomersCount++;
      } else if (date >= startOfLastMonth && date <= endOfLastMonth) {
        lastMonthCustomersCount++;
      }
    });

    const revenueGrowth = lastMonthRevenue > 0
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : (currentMonthRevenue > 0 ? 100 : 0);

    const customerGrowth = lastMonthCustomersCount > 0
      ? ((newCustomersCount - lastMonthCustomersCount) / lastMonthCustomersCount) * 100
      : (newCustomersCount > 0 ? 100 : 0);

    return {
      totalRevenue: totalRevenue,
      revenueGrowth: Number(revenueGrowth.toFixed(1)),
      newCustomers: newCustomersCount,
      customerGrowth: Number(customerGrowth.toFixed(1)),
      activeAccounts: activeAccountsCount,
      activeAccountsGrowth: 0,
      growthRate: 0,
      growthRateChange: 0
    };
  }, [sales, customers]);

  const chartData = useMemo(() => {
    // Aggregate sales by day
    const dailyData = {};
    sales.forEach(sale => {
      const dateObj = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt);
      const dateStr = dateObj.toISOString().split('T')[0];

      if (!dailyData[dateStr]) {
        dailyData[dateStr] = { date: dateStr, desktop: 0, mobile: 0 };
      }

      dailyData[dateStr].desktop += Number(sale.totalAmount) || 0; // Revenue
      dailyData[dateStr].mobile += 1; // Order count
    });

    return Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [sales]);


  const handleCustomerInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (customerErrors[name]) {
      setCustomerErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!customerFormData.name.trim()) errors.name = "Full Name is required";
    if (!customerFormData.mobile.trim()) {
      errors.mobile = "Mobile Number is required";
    } else if (!/^\+?[\d\s-]{10,}$/.test(customerFormData.mobile)) {
      errors.mobile = "Invalid mobile number format";
    }

    if (customerFormData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerFormData.email)) {
      errors.email = "Invalid email format";
    }

    if (Object.keys(errors).length > 0) {
      setCustomerErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      const mobileExists = await getCustomerByMobile(customerFormData.mobile);
      if (mobileExists) {
        setCustomerErrors(prev => ({ ...prev, mobile: "Mobile number already exists" }));
        setIsSubmitting(false);
        return;
      }

      if (customerFormData.email) {
        const emailExists = await getCustomerByEmail(customerFormData.email);
        if (emailExists) {
          setCustomerErrors(prev => ({ ...prev, email: "Email already exists" }));
          setIsSubmitting(false);
          return;
        }
      }

      await createCustomer(customerFormData);
      toast.success("Customer added successfully");
      setIsCustomerModalOpen(false);
      resetCustomerForm();
      const [newSales, newCustomers] = await Promise.all([getAllSales(), getAllCustomers()]);
      setSales(newSales);
      setCustomers(newCustomers);

    } catch (error) {
      console.error("Error creating customer:", error);
      toast.error(error.message || "Failed to add customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || loadingData) {
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

  if (!user) {
    return null;
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <h1 className="text-2xl font-bold tracking-tight">Sales Dashboard</h1>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={() => router.push('/sales/create')}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <IconPlus className="h-4 w-4" />
              Create Sale
            </Button>
            <Button
              onClick={() => setIsCustomerModalOpen(true)}
              className="flex items-center gap-2 w-full sm:w-auto"
              variant="outline"
            >
              <IconUserPlus className="h-4 w-4" />
              Add Customer
            </Button>
          </div>
        </div>

        <SectionCards stats={stats} />

        <div className="px-4 lg:px-6">
          <ChartAreaInteractive data={chartData} />
        </div>

        <div className="px-4 lg:px-6">
          <SalesTable data={salesWithDetails} />
        </div>
      </div>

      <CustomerModal
        isOpen={isCustomerModalOpen}
        onOpenChange={(open) => {
          setIsCustomerModalOpen(open);
          if (!open) resetCustomerForm();
        }}
        mode="add"
        formData={customerFormData}
        onInputChange={handleCustomerInputChange}
        onSubmit={handleCustomerSubmit}
        onCancel={() => {
          setIsCustomerModalOpen(false);
          resetCustomerForm();
        }}
        isLoading={isSubmitting}
        errors={customerErrors}
      />
    </div>
  )
}
