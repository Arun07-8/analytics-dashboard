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
import { SaleDetailsModal } from "@/components/sales/sale-details-modal";
import {
  subscribeToSales,
  getAllSales,
  getAllCustomers,
  createCustomer,
  getCustomerByMobile,
  getCustomerByEmail,
  getAllAdmins
} from "@/lib/firebase/collections";

import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { InvoiceTemplate } from "@/components/sales/invoice-template";
import { InvoicePreviewModal } from "@/components/sales/invoice-preview-modal";
import { downloadInvoice } from "@/lib/invoice-utils";
import { IconCalendar } from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'yesterday', 'week', 'month', 'last6months', 'year', 'custom'
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  // Sale Modal States
  const [selectedSale, setSelectedSale] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isInvoiceGenerating, setIsInvoiceGenerating] = useState(false);
  const [invoiceSaleData, setInvoiceSaleData] = useState(null);
  const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState(false);
  const [previewSaleData, setPreviewSaleData] = useState(null);

  const resetCustomerForm = () => {
    setCustomerFormData(initialCustomerFormData);
    setCustomerErrors({});
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch Customers & Admins once (or use snapshot if needed, but keeping it simple for now)
  useEffect(() => {
    const fetchStaticData = async () => {
      if (!user) return;
      try {
        const [customersData, adminsData] = await Promise.all([
          getAllCustomers(),
          getAllAdmins()
        ]);
        setCustomers(customersData);
        setAdmins(adminsData);
      } catch (error) {
        console.error("Error fetching static data:", error);
      }
    };
    fetchStaticData();
  }, [user]);

  // Real-time Sales Subscription with Query
  useEffect(() => {
    if (!user) return;

    let filterConstraints = {};
    const now = new Date();

    if (dateFilter === 'today') {
      filterConstraints = { fromDate: now, toDate: now };
    } else if (dateFilter === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      filterConstraints = { fromDate: yesterday, toDate: yesterday };
    } else if (dateFilter === 'week') {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      filterConstraints = { fromDate: startOfWeek };
    } else if (dateFilter === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      filterConstraints = { fromDate: startOfMonth };
    } else if (dateFilter === 'last6months') {
      const last6Months = new Date();
      last6Months.setMonth(last6Months.getMonth() - 6);
      filterConstraints = { fromDate: last6Months };
    } else if (dateFilter === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      filterConstraints = { fromDate: startOfYear };
    } else if (dateFilter === 'custom') {
      filterConstraints = { fromDate, toDate };
    }

    // Role-based filtering
if (user?.role?.trim().toLowerCase() === "staff") {
  filterConstraints.createdBy = user.uid;
}

    setLoadingData(true);
    const unsubscribe = subscribeToSales(filterConstraints, (salesData) => {
      setSales(salesData);
      setLoadingData(false);
    });

    return () => unsubscribe();
  }, [user, dateFilter, fromDate, toDate]);

  const handleFromDateSelect = (date) => {
    setFromDate(date);
    if (date && toDate && date > toDate) {
      setToDate(date);
      toast.info("Adjusted 'To' date to match 'From' selection");
    }
  };

  const handleToDateSelect = (date) => {
    setToDate(date);
    if (date && fromDate && date < fromDate) {
      setFromDate(date);
      toast.info("Adjusted 'From' date to match 'To' selection");
    }
  };

  // Process data for components
  const salesWithDetails = useMemo(() => {
    const customerMap = new Map(customers.map(c => [c.id, c.name]));
    const adminMap = new Map(admins.map(a => [a.id, a.name]));

    return sales.map(sale => ({
      ...sale,
      customerName: customerMap.get(sale.customerId) || 'Unknown Customer',
      staffName: adminMap.get(sale.createdBy) || "Unknown Staff",
      staffEmail: sale.staffEmail || '',
      status: sale.status || (sale.closed ? "Closed" : "Pending")
    })).sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB - dateA; // Descending
    });
  }, [sales, customers, admins]);

  const filteredSales = useMemo(() => {
    return salesWithDetails.filter(sale => {
      // Tab filter
      if (activeTab === 'closed' && sale.status !== 'Closed') return false;
      if (activeTab === 'pending' && sale.status !== 'Pending') return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          sale.customerName?.toLowerCase().includes(query) ||
          sale.staffName?.toLowerCase().includes(query) ||
          sale.id?.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [salesWithDetails, activeTab, searchQuery, dateFilter]);

  const salesTabs = useMemo(() => {
    const counts = {
      all: salesWithDetails.length,
      closed: salesWithDetails.filter(s => s.status === 'Closed').length,
      pending: salesWithDetails.filter(s => s.status === 'Pending').length
    };

    return [
      { label: "All Sales", value: "all", badge: counts.all.toString() },
      { label: "Closed", value: "closed", badge: counts.closed.toString() },
      { label: "Pending", value: "pending", badge: counts.pending.toString() },
    ];
  }, [salesWithDetails]);

  const stats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfLastMonth = new Date(currentYear, currentMonth, 0);

    let totalRevenue = 0;
    let currentPeriodRevenue = 0;
    let lastPeriodRevenue = 0;

    let newCustomersCount = 0;
    let lastMonthCustomersCount = 0;
    let activeAccountsCount = new Set(filteredSales.map(s => s.customerId)).size;

    filteredSales.forEach(sale => {
      const amount = Number(sale.totalAmount) || 0;
      totalRevenue += amount;

      const date = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt);
      if (date >= startOfCurrentMonth) {
        currentPeriodRevenue += amount;
      } else if (date >= startOfLastMonth && date <= endOfLastMonth) {
        lastPeriodRevenue += amount;
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

    const revenueGrowth = lastPeriodRevenue > 0
      ? ((currentPeriodRevenue - lastPeriodRevenue) / lastPeriodRevenue) * 100
      : (currentPeriodRevenue > 0 ? 100 : 0);

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
  }, [filteredSales, customers]);

  const chartData = useMemo(() => {
    // Aggregate sales by day
    const dailyData = {};
    filteredSales.forEach(sale => {
      const dateObj = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt);
      const dateStr = dateObj.toISOString().split('T')[0];

      if (!dailyData[dateStr]) {
        dailyData[dateStr] = { date: dateStr, desktop: 0, mobile: 0 };
      }

      dailyData[dateStr].desktop += Number(sale.totalAmount) || 0; // Revenue
      dailyData[dateStr].mobile += 1; // Order count
    });

    const result = Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Ensure at least some data for the chart if empty
    if (result.length === 0) {
      return [{ date: new Date().toISOString().split('T')[0], desktop: 0, mobile: 0 }];
    }

    return result;
  }, [filteredSales]);

  const handleViewDetails = (sale) => {
    setSelectedSale(sale);
    setIsDetailsModalOpen(true);
  };

  const handleEditSale = (sale) => {
    router.push(`/sales/edit/${sale.id}`);
  };

  const handleDownloadInvoice = (sale) => {
    // Show preview modal first
    setPreviewSaleData(sale);
    setIsInvoicePreviewOpen(true);
  };

  const handleConfirmDownload = async () => {
    if (!previewSaleData) return;

    // Close preview modal
    setIsInvoicePreviewOpen(false);

    // Start generating PDF
    setInvoiceSaleData(previewSaleData);
    setIsInvoiceGenerating(true);

    // Give state a moment to update and render the template
    setTimeout(async () => {
      try {
        const refId = Array.isArray(previewSaleData.salesRefId)
          ? previewSaleData.salesRefId[0]
          : previewSaleData.salesRefId;
        const success = await downloadInvoice('dashboard-invoice-template', `Invoice-${refId || previewSaleData.id}.pdf`);
        if (success) {
          toast.success("Invoice downloaded successfully");
        } else {
          toast.error("Failed to generate PDF");
        }
      } catch (error) {
        console.error("Dashboard invoice error:", error);
        toast.error("Failed to generate invoice");
      } finally {
        setIsInvoiceGenerating(false);
        setInvoiceSaleData(null);
        setPreviewSaleData(null);
      }
    }, 500);
  };


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

  // if (!user) {
  //   return null;
  // }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Sales Dashboard</h1>
            <p className="text-xs text-muted-foreground">Monitor and manage your business performance</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-card border rounded-lg pl-3 h-10 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground shrink-0 border-r pr-2 h-full flex items-center">Period</span>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer outline-none h-full px-2 w-[120px] shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="last6months">Last 6 Months</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {dateFilter === 'custom' && (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                {/* From Date Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-10 justify-start text-left font-bold text-xs bg-card pl-3 pr-4 border shadow-sm rounded-lg",
                        !fromDate && "text-muted-foreground"
                      )}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-3">From</span>
                      {fromDate ? format(fromDate, "dd/MM/yy") : <span className="opacity-50">Select</span>}
                      <IconCalendar className="ml-auto h-3.5 w-3.5 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={fromDate}
                      onSelect={handleFromDateSelect}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <div className="h-4 w-[1px] bg-border" />

                {/* To Date Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-10 justify-start text-left font-bold text-xs bg-card pl-3 pr-4 border shadow-sm rounded-lg",
                        !toDate && "text-muted-foreground"
                      )}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-3">To</span>
                      {toDate ? format(toDate, "dd/MM/yy") : <span className="opacity-50">Select</span>}
                      <IconCalendar className="ml-auto h-3.5 w-3.5 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={toDate}
                      onSelect={handleToDateSelect}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

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
          <SalesTable
            data={filteredSales}
            tabs={salesTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search customer, staff or ref..."
            onAddClick={() => router.push('/sales/create')}
            onViewDetails={handleViewDetails}
            onEditSale={handleEditSale}
            onDownloadInvoice={handleDownloadInvoice}
          />
        </div>
      </div>

      {/* Hidden Invoice Template for PDF generation */}
      <div className="absolute -top-[10000px] left-0 opacity-0 pointer-events-none z-[-100]">
        <div id="dashboard-invoice-template">
          {invoiceSaleData && (
            <InvoiceTemplate
              sale={invoiceSaleData}
              customer={customers.find(c => c.id === invoiceSaleData.customerId)}
              admins={admins}
            />
          )}
        </div>
      </div>

      <SaleDetailsModal
        isOpen={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        sale={selectedSale}
        customer={customers.find(c => c.id === selectedSale?.customerId)}
        onDownloadInvoice={handleDownloadInvoice}
      />

      <InvoicePreviewModal
        isOpen={isInvoicePreviewOpen}
        onClose={() => {
          setIsInvoicePreviewOpen(false);
          setPreviewSaleData(null);
        }}
        sale={previewSaleData}
        customer={customers.find(c => c.id === previewSaleData?.customerId)}
        admins={admins}
        onConfirmDownload={handleConfirmDownload}
      />

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
