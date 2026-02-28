'use client';
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useMemo } from "react";
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SalesTable } from "@/components/sales/sales-table"
import { SectionCards } from "@/components/section-cards"
import { Button } from "@/components/ui/button";
import { IconUserPlus, IconPlus, IconReceipt, IconCash, IconClock, IconListCheck } from "@tabler/icons-react";
import { CustomerModal } from "@/components/customers/customer-modal";
import { SaleDetailsModal } from "@/components/sales/sale-details-modal";
import {
  subscribeToSales,
  getAllSales,
  getAllCustomers,
  createCustomer,
  getCustomerByMobile,
  getCustomerByEmail,
  getAllAdmins,
  deleteSale
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
  const [dateFilter, setDateFilter] = useState('month'); // 'all', 'today', 'yesterday', 'week', 'month', 'last6months', 'year', 'custom'
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [chartTimeRange, setChartTimeRange] = useState("month");

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

  // Real-time Sales Subscription
  useEffect(() => {
    if (!user) return;

    // Personal Record Tracking: Both Admins and Staff see ONLY their own records here.
    let filterConstraints = {
      createdBy: user.uid
    };

    setLoadingData(true);
    const unsubscribe = subscribeToSales(filterConstraints, (salesData) => {
      setSales(salesData);
      setLoadingData(false);
    });

    return () => unsubscribe();
  }, [user]);

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

    return sales.map(sale => {
      const date = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt);
      const mappedStatus = (sale.status === 'paid' || sale.status === 'Closed' || sale.closed) ? 'paid' : 'unpaid';
      return {
        ...sale,
        createdAtDate: date, // Keep a real Date object for filtering
        customerName: customerMap.get(sale.customerId) || 'Unknown Customer',
        staffName: adminMap.get(sale.createdBy) || sale.staffName || "Unknown Staff",
        staffEmail: sale.staffEmail || '',
        status: mappedStatus,
        verificationStatus: sale.verificationStatus || (sale.isVerified ? "Approved" : "Pending"),
        isVerified: sale.isVerified
      };
    }).sort((a, b) => b.createdAtDate - a.createdAtDate);
  }, [sales, customers, admins]);

  // Apply Date Filtering locally
  const periodSales = useMemo(() => {
    if (dateFilter === 'all') return salesWithDetails;

    const now = new Date();
    let start = new Date();
    let end = new Date();

    // Set boundaries
    if (dateFilter === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (dateFilter === 'yesterday') {
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
    } else if (dateFilter === 'week') {
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
    } else if (dateFilter === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else if (dateFilter === 'last6months') {
      start.setMonth(start.getMonth() - 6);
      start.setHours(0, 0, 0, 0);
    } else if (dateFilter === 'year') {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    } else if (dateFilter === 'specific-day') {
      if (!fromDate) return salesWithDetails;
      start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(fromDate);
      end.setHours(23, 59, 59, 999);
    } else if (dateFilter === 'custom') {
      if (!fromDate && !toDate) return salesWithDetails;
      if (fromDate) {
        start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
      } else {
        start = new Date(2000, 0, 1);
      }
      if (toDate) {
        end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
      } else {
        end = new Date();
      }
    }

    return salesWithDetails.filter(sale => {
      const d = sale.createdAtDate;
      return d >= start && d <= end;
    });
  }, [salesWithDetails, dateFilter, fromDate, toDate]);

  const filteredSales = useMemo(() => {
    return periodSales.filter(sale => {
      // Tab filter logic:
      if (activeTab === 'closed' && sale.status !== 'paid') return false;
      if (activeTab === 'pending' && sale.status !== 'unpaid') return false;

      // Staff-only tabs
      if (activeTab === 'requests' && sale.verificationStatus !== 'Pending') return false;
      if (activeTab === 'declined' && sale.verificationStatus !== 'Rejected') return false;

      // Primary tabs ('all', 'closed', 'pending') only show Approved records
      // This is crucial for "Revenue should add only after Admin approval"
      if (['all', 'closed', 'pending'].includes(activeTab)) {
        if (sale.verificationStatus === 'Rejected' || sale.isVerified === false) {
          return false;
        }
      }

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
  }, [periodSales, activeTab, searchQuery]);

  const salesTabs = useMemo(() => {
    const isAdmin = user?.role?.trim().toLowerCase() === 'admin';
    const counts = {
      // For personal stats, only count verified/approved items in main tabs
      all: periodSales.filter(s => s.isVerified !== false).length,
      closed: periodSales.filter(s => s.isVerified !== false && s.status === 'paid').length,
      pending: periodSales.filter(s => s.isVerified !== false && s.status === 'unpaid').length,
      // Track pending/rejected items separately for Staff
      requests: periodSales.filter(s => s.verificationStatus === 'Pending').length,
      declined: periodSales.filter(s => s.verificationStatus === 'Rejected').length
    };

    const tabs = [
      { label: isAdmin ? "All Sales" : "My Sales", value: "all", badge: counts.all.toString() },
      { label: "Payment Closed", value: "closed", badge: counts.closed.toString() },
      { label: "Payment Pending", value: "pending", badge: counts.pending.toString() },
    ];

    // Only show extra tabs to Staff
    if (!isAdmin) {
      if (counts.requests > 0) {
        tabs.push({ label: "Requests", value: "requests", badge: counts.requests.toString() });
      }
      if (counts.declined > 0) {
        tabs.push({ label: "Declined", value: "declined", badge: counts.declined.toString() });
      }
    }

    return tabs;
  }, [periodSales, user]);

  const stats = useMemo(() => {
    const verifiedSales = salesWithDetails.filter(s => s.isVerified !== false && s.verificationStatus !== 'Rejected');
    const verifiedPeriodSales = periodSales.filter(s => s.isVerified !== false && s.verificationStatus !== 'Rejected');

    // My All-Time Stats (Verified Only)
    const myTotalSalesAllTime = verifiedSales.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);
    const myPaidRevenueAllTime = verifiedSales.reduce((acc, s) => acc + (Number(s.paidAmount) || 0), 0);
    const myPendingAmountAllTime = verifiedSales.filter(s => s.status === 'unpaid').reduce((acc, s) => acc + (Number(s.totalAmount) - (Number(s.paidAmount) || 0)), 0);

    // My Period Stats (Verified Only)
    const myTotalSalesPeriod = verifiedPeriodSales.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);
    const myPaidRevenuePeriod = verifiedPeriodSales.reduce((acc, s) => acc + (Number(s.paidAmount) || 0), 0);
    const myPendingAmountPeriod = verifiedPeriodSales.filter(s => s.status === 'unpaid').reduce((acc, s) => acc + (Number(s.totalAmount) - (Number(s.paidAmount) || 0)), 0);

    return [
      {
        label: "My Total Sales",
        value: dateFilter === 'all' ? myTotalSalesAllTime : myTotalSalesPeriod,
        prefix: "₹",
        isCurrency: true,
        icon: <IconReceipt className="size-4" />,
        description: "Gross value (Paid + Unpaid)"
      },
      {
        label: "My Paid Amount",
        value: dateFilter === 'all' ? myPaidRevenueAllTime : myPaidRevenuePeriod,
        prefix: "₹",
        isCurrency: true,
        icon: <IconCash className="size-4" />,
        description: "Only confirmed payments"
      },
      {
        label: "My Pending Amount",
        value: dateFilter === 'all' ? myPendingAmountAllTime : myPendingAmountPeriod,
        prefix: "₹",
        isCurrency: true,
        icon: <IconClock className="size-4" />,
        description: "Outstanding balance"
      },
      {
        label: "Transactions",
        value: periodSales.length,
        icon: <IconListCheck className="size-4" />,
        description: "Orders in current view"
      }
    ];
  }, [salesWithDetails, periodSales, dateFilter]);

  const verifiedPeriodSales = useMemo(() => {
    return periodSales.filter(s => s.isVerified !== false && s.verificationStatus !== 'Rejected');
  }, [periodSales]);

  const chartData = useMemo(() => {
    const data = {};
    const isSingleDay = ['today', 'yesterday', 'specific-day'].includes(dateFilter);

    // Determine target date for single day mode
    let targetDate = new Date();
    if (dateFilter === 'yesterday') {
      targetDate.setDate(targetDate.getDate() - 1);
    } else if (dateFilter === 'specific-day' && fromDate) {
      targetDate = new Date(fromDate);
    }
    targetDate.setHours(0, 0, 0, 0); // Normalize targetDate to start of day

    if (isSingleDay) {
      // Initialize 24 hours
      for (let h = 0; h < 24; h++) {
        const d = new Date(targetDate);
        d.setHours(h, 0, 0, 0);
        const iso = d.toISOString();
        data[iso] = { date: iso, revenue: 0, volume: 0, isHourly: true };
      }

      verifiedPeriodSales.forEach(sale => {
        const d = new Date(sale.createdAtDate);
        // Ensure the sale date matches the target date for single day view
        if (d.getFullYear() === targetDate.getFullYear() &&
          d.getMonth() === targetDate.getMonth() &&
          d.getDate() === targetDate.getDate()) {
          d.setMinutes(0, 0, 0); // Round to the nearest hour
          const iso = d.toISOString();
          if (data[iso]) { // Only add if it falls within the initialized 24 hours
            data[iso].revenue += Number(sale.paidAmount) || 0;
            data[iso].volume += 1;
          }
        }
      });
    } else {
      // Determine the range to fill for multi-day periods
      const now = new Date();
      let fillStart = null;
      let fillEnd = new Date();

      if (dateFilter === 'today') { // This case is handled by isSingleDay, but keeping for robustness if logic changes
        fillStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (dateFilter === 'yesterday') { // This case is handled by isSingleDay
        fillStart = new Date(now.getTime() - 86400000);
        fillStart.setHours(0, 0, 0, 0);
        fillEnd = new Date(fillStart);
        fillEnd.setHours(23, 59, 59, 999);
      } else if (dateFilter === 'week') {
        fillStart = new Date(now);
        const day = fillStart.getDay();
        const diff = fillStart.getDate() - day + (day === 0 ? -6 : 1);
        fillStart.setDate(diff);
        fillStart.setHours(0, 0, 0, 0);
        fillEnd = new Date(fillStart);
        fillEnd.setDate(fillStart.getDate() + 6);
        fillEnd.setHours(23, 59, 59, 999);
      } else if (dateFilter === 'month') {
        fillStart = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (dateFilter === 'year') {
        fillStart = new Date(now.getFullYear(), 0, 1);
        fillEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      } else if (dateFilter === 'last6months') {
        fillStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        fillEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      } else if (dateFilter === 'specific-day' && fromDate) {
        fillStart = new Date(fromDate);
        fillStart.setHours(0, 0, 0, 0);
        fillEnd = new Date(fromDate);
        fillEnd.setHours(23, 59, 59, 999);
      } else if (dateFilter === 'custom') {
        if (fromDate) {
          fillStart = new Date(fromDate);
          fillStart.setHours(0, 0, 0, 0);
        } else {
          fillStart = new Date(2000, 0, 1);
        }
        if (toDate) {
          fillEnd = new Date(toDate);
          fillEnd.setHours(23, 59, 59, 999);
        } else {
          fillEnd = new Date();
        }
      } else {
        fillStart = null;
        fillEnd = null;
      }

      // Initialize daily gaps if a fill range is determined
      if (fillStart && fillEnd) {
        const temp = new Date(fillStart);
        while (temp <= fillEnd) {
          const dStr = temp.toISOString().split('T')[0];
          data[dStr] = { date: dStr, revenue: 0, volume: 0 };
          temp.setDate(temp.getDate() + 1);
        }
      }

      // Populate actual daily data
      verifiedPeriodSales.forEach(sale => {
        const dStr = sale.createdAtDate.toISOString().split('T')[0];
        if (!data[dStr]) data[dStr] = { date: dStr, revenue: 0, volume: 0 };
        data[dStr].revenue += Number(sale.paidAmount) || 0;
        data[dStr].volume += 1;
      });
    }

    const result = Object.values(data).sort((a, b) => new Date(a.date) - new Date(b.date));

    if (result.length === 0) {
      // Return a single point for the current day if no data, to avoid empty chart
      return [{ date: new Date().toISOString().split('T')[0], revenue: 0, volume: 0 }];
    }

    return result;
  }, [verifiedPeriodSales, dateFilter, fromDate]);

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
        const customerName = customers.find(c => c.id === previewSaleData?.customerId)?.name || 'Customer';
        const success = await downloadInvoice('dashboard-invoice-template', `${customerName}'s Invoice.pdf`);
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

    if (!customerFormData.email.trim()) {
      errors.email = "Email Address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerFormData.email)) {
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
      const newCustomers = await getAllCustomers();
      setCustomers(newCustomers);

    } catch (error) {
      console.error("Error creating customer:", error);
      toast.error(error.message || "Failed to add customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSale = async (sale) => {
    try {
      await deleteSale(sale.id);
      toast.success("Record removed successfully");
    } catch (error) {
      toast.error("Failed to remove record");
      console.error(error);
    }
  };



  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-xs font-medium animate-pulse">Loading Sales Data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full transition-all duration-700 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/40">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest font-mono">
              Sales Terminal
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-none bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Sales Dashboard
          </h1>
          <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
            Monitor and manage your business performance
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-card border border-border/50 rounded-xl pl-3 h-10 shadow-sm">
            <span className="text-[11px] font-semibold text-muted-foreground shrink-0 border-r pr-3 h-full flex items-center">Period</span>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="bg-transparent border-none text-xs font-semibold focus:ring-0 cursor-pointer outline-none h-full px-2 w-[130px] shadow-none">
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
                  <SelectItem value="specific-day">Specific Date</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {dateFilter === 'specific-day' && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-10 justify-start text-left font-semibold text-xs bg-card pl-3 pr-4 border border-border/50 shadow-sm rounded-xl hover:bg-muted/50 hover:border-border transition-all",
                      !fromDate && "text-muted-foreground"
                    )}
                  >
                    <span className="text-xs font-semibold text-muted-foreground mr-3">Date</span>
                    {fromDate ? format(fromDate, "dd MMM yyyy") : <span className="opacity-50">Select Date</span>}
                    <IconCalendar className="ml-auto h-3.5 w-3.5 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={fromDate}
                    onSelect={setFromDate}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
              {/* From Date Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-10 justify-start text-left font-semibold text-xs bg-card pl-3 pr-4 border border-border/50 shadow-sm rounded-xl hover:bg-muted/50 hover:border-border transition-all",
                      !fromDate && "text-muted-foreground"
                    )}
                  >
                    <span className="text-xs font-semibold text-muted-foreground mr-3">From</span>
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

              <div className="h-4 w-[1px] bg-border/50" />

              {/* To Date Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-10 justify-start text-left font-semibold text-xs bg-card pl-3 pr-4 border border-border/50 shadow-sm rounded-xl hover:bg-muted/50 hover:border-border transition-all",
                      !toDate && "text-muted-foreground"
                    )}
                  >
                    <span className="text-xs font-semibold text-muted-foreground mr-3">To</span>
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
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm h-10 px-6 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all w-full sm:w-auto"
          >
            <IconPlus className="size-4 mr-2" />
            Create Sale
          </Button>
          <Button
            onClick={() => setIsCustomerModalOpen(true)}
            variant="outline"
            className="font-semibold text-sm h-10 px-6 rounded-xl shadow-sm border-border/50 hover:bg-muted/50 hover:border-border active:scale-95 transition-all w-full sm:w-auto"
          >
            <IconUserPlus className="size-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <SectionCards cards={stats} />


        <ChartAreaInteractive
          data={chartData}
          timeRange={dateFilter === 'month' ? 'this-month' : dateFilter === 'year' ? 'this-year' : dateFilter}
          onTimeRangeChange={(val) => {
            if (val === 'this-month') setDateFilter('month');
            else if (val === 'this-year') setDateFilter('year');
            else setDateFilter(val);
          }}
        />

      </div>

      <div className="space-y-4 pt-4">
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
          onDeleteSale={handleDeleteSale}
          userRole={user?.role}
        />
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
