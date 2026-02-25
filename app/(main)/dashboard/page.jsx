'use client';

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DashboardTable } from "@/components/dashboard/sections-table"
import { SectionCards } from "@/components/section-cards"
import { Button } from "@/components/ui/button"
import { subscribeToSales } from "@/lib/firebase/collections/sale"
import { subscribeToAdmins } from "@/lib/firebase/collections/admin"
import { subscribeToCustomers } from "@/lib/firebase/collections/customer"
import { format } from "date-fns";
import { IconCalendar, IconReceipt, IconChartBar, IconCalendarStats, IconUsers, IconClock, IconListCheck } from "@tabler/icons-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SaleDetailsModal } from "@/components/sales/sale-details-modal";
import { InvoicePreviewModal } from "@/components/sales/invoice-preview-modal";
import { InvoiceTemplate } from "@/components/sales/invoice-template";
import { toast } from "sonner";
import { downloadInvoice } from "@/lib/invoice-utils";

export default function Page() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [sales, setSales] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [dateFilter, setDateFilter] = useState('this-month'); // match chart default
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  // Sale Modal States
  const [selectedSale, setSelectedSale] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isInvoiceGenerating, setIsInvoiceGenerating] = useState(false);
  const [invoiceSaleData, setInvoiceSaleData] = useState(null);
  const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState(false);
  const [previewSaleData, setPreviewSaleData] = useState(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user?.role?.trim().toLowerCase() !== 'admin') {
        router.push('/sales');
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    // We fetch ALL sales to calculate company-wide monthly revenue,
    // but we will filter the local processed data based on role.
    const unsubSales = subscribeToSales({}, (data) => setSales(data));
    const unsubAdmins = subscribeToAdmins((data) => setAdmins(data));
    const unsubCustomers = subscribeToCustomers((data) => setCustomers(data));

    return () => {
      unsubSales();
      unsubAdmins();
      unsubCustomers();
    };
  }, [user]);

  const customerMap = useMemo(() => {
    return customers.reduce((acc, curr) => {
      acc[curr.id] = curr.name;
      return acc;
    }, {});
  }, [customers]);

  const staffMap = useMemo(() => {
    return admins.reduce((acc, curr) => {
      acc[curr.id] = { name: curr.name, role: curr.role };
      return acc;
    }, {});
  }, [admins]);

  const dataPack = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfThisYear = new Date(now.getFullYear(), 0, 1);

    const startOfThisWeek = new Date(now);
    const day = startOfThisWeek.getDay();
    const diff = startOfThisWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfThisWeek.setDate(diff);
    startOfThisWeek.setHours(0, 0, 0, 0);

    const getPrevStart = (range) => {
      if (range === "today") return new Date(startOfToday.getTime() - 86400000);
      if (range === "yesterday") return new Date(startOfYesterday.getTime() - 86400000);
      if (range === "this-week") return new Date(startOfThisWeek.getTime() - 7 * 86400000);
      if (range === "this-month") return new Date(now.getFullYear(), now.getMonth() - 1, 1);
      if (range === "this-year") return new Date(now.getFullYear() - 1, 0, 1);
      return new Date(0);
    };

    const prevStart = getPrevStart(dateFilter);
    let currentStart;
    let currentEnd = new Date(now.getFullYear() + 10, 0, 1);

    if (dateFilter === "today") {
      currentStart = startOfToday;
      currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (dateFilter === "yesterday") {
      currentStart = startOfYesterday;
      currentEnd = new Date(startOfYesterday.getFullYear(), startOfYesterday.getMonth(), startOfYesterday.getDate(), 23, 59, 59, 999);
    } else if (dateFilter === "this-week") {
      currentStart = startOfThisWeek;
      currentEnd = new Date(startOfThisWeek.getTime() + 7 * 86400000 - 1);
    } else if (dateFilter === "this-month") {
      currentStart = startOfThisMonth;
    } else if (dateFilter === "this-year") {
      currentStart = startOfThisYear;
    } else if (dateFilter === "specific-day") {
      if (fromDate) {
        currentStart = new Date(fromDate);
        currentStart.setHours(0, 0, 0, 0);
        currentEnd = new Date(fromDate);
        currentEnd.setHours(23, 59, 59, 999);
      } else {
        currentStart = startOfToday;
        currentEnd = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), startOfToday.getDate(), 23, 59, 59, 999);
      }
    } else if (dateFilter === "custom") {
      currentStart = fromDate ? new Date(fromDate) : new Date(0);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd = toDate ? new Date(toDate) : new Date(now.getFullYear() + 10, 0, 1);
      currentEnd.setHours(23, 59, 59, 999);
    } else {
      currentStart = startOfThisMonth;
    }

    const allSalesWithDate = sales.map(sale => {
      const creator = staffMap[sale.createdBy] || { name: "System", role: "admin" };
      // Ensure status is correctly mapped for consistent calculation logic
      const mappedStatus = (sale.status === 'paid' || sale.status === 'Closed' || sale.closed) ? 'paid' : 'unpaid';

      return {
        ...sale,
        customerName: customerMap[sale.customerId] || "Unknown",
        staffName: creator.name,
        staffRole: creator.role,
        date: sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt),
        status: mappedStatus
      };
    });

    // Filter for verified sales for global revenue
    const verifiedSales = allSalesWithDate.filter(s => s.isVerified === true);

    // Global Revenue Calculations (Independent of filter)
    // "Total Revenue" for Dashboard (Admin Only) should show company-wide paid amounts or totals of paid sales
    const allTimeCompanyRevenue = verifiedSales
      .filter(s => s.status === 'paid')
      .reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);

    const allTimeCompanyPending = verifiedSales
      .filter(s => s.status === 'unpaid')
      .reduce((sum, s) => sum + (Number(s.totalAmount) - (Number(s.paidAmount) || 0)), 0);

    const allTimeCompanySales = verifiedSales
      .reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);

    // Period-based company stats (Verified Only)
    const companyPeriodRevenue = verifiedSales
      .filter(s => s.date >= currentStart && s.date <= currentEnd && s.status === 'paid')
      .reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);

    const companyPeriodPending = verifiedSales
      .filter(s => s.date >= currentStart && s.date <= currentEnd && s.status === 'unpaid')
      .reduce((sum, s) => sum + (Number(s.totalAmount) - (Number(s.paidAmount) || 0)), 0);

    const companyPeriodSales = verifiedSales
      .filter(s => s.date >= currentStart && s.date <= currentEnd)
      .reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);



    // Role-based visibility for Table and personal stats
    const filteredByRole = allSalesWithDate.filter(s => {
      // ONLY show verified sales on the main dashboard
      if (s.isVerified !== true) return false;
      if (!user) return false;

      if (user.role === 'admin') return true;
      return s.createdBy === user.uid;
    });

    const processed = filteredByRole
      .filter(s => s.date >= currentStart && s.date <= currentEnd)
      .sort((a, b) => b.date - a.date);

    const previous = filteredByRole
      .filter(s => s.date >= prevStart && s.date < currentStart);

    const newCusts = customers.filter(c => {
      const cDate = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
      return cDate >= currentStart && cDate <= currentEnd;
    }).length;

    const previousRevenue = previous
      .filter(s => s.status === 'paid')
      .reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);

    return {
      processedSales: processed,
      previousSales: previous,
      newCustomersCount: newCusts,
      allTimeCompanyRevenue,
      allTimeCompanyPending,
      allTimeCompanySales,
      companyPeriodRevenue,
      companyPeriodPending,
      companyPeriodSales,
      previousRevenue
    };
  }, [sales, dateFilter, fromDate, toDate, customerMap, staffMap, customers, user]);

  const stats = useMemo(() => {
    const {
      processedSales: processed,
      previousSales: previous,
      allTimeCompanyRevenue,
      allTimeCompanyPending,
      allTimeCompanySales,
      companyPeriodRevenue,
      previousRevenue,
      newCustomersCount
    } = dataPack;

    const calculateStats = (data) => ({
      revenue: data.filter(s => s.status === 'paid').reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0),
      count: data.length
    });

    const currentStats = calculateStats(processed);
    const prevStats = calculateStats(previous);

    const calcGrowth = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    const getDynamicLabel = () => {
      if (dateFilter === 'today') return "Today's Revenue";
      if (dateFilter === 'yesterday') return "Yesterday's Revenue";
      if (dateFilter === 'this-week') return "Weekly Revenue";
      if (dateFilter === 'this-month') return "Monthly Revenue";
      if (dateFilter === 'this-year') return "Yearly Revenue";
      if (dateFilter === 'all') return "Total Revenue";
      return "Selected Revenue";
    };

    const coreCards = [
      {
        label: "Total Revenue",
        value: allTimeCompanyRevenue,
        prefix: "₹",
        isCurrency: true,
        icon: <IconReceipt className="size-3.5" />,
        description: "Cumulative paid revenue"
      },
      {
        label: "Total Sales",
        value: allTimeCompanySales,
        prefix: "₹",
        isCurrency: true,
        icon: <IconChartBar className="size-3.5" />,
        description: "Company-wide gross sales"
      },
      {
        label: getDynamicLabel(),
        value: companyPeriodRevenue,
        prefix: "₹",
        isCurrency: true,
        icon: <IconCalendarStats className="size-3.5" />,
        growth: calcGrowth(currentStats.revenue, prevStats.revenue),
        description: `Revenue this ${dateFilter.replace('this-', '')}`
      },
      {
        label: "Transaction Count",
        value: currentStats.count,
        icon: <IconListCheck className="size-3.5" />,
        description: "Orders in this period"
      },
      {
        label: "Total Pending",
        value: allTimeCompanyPending,
        prefix: "₹",
        isCurrency: true,
        icon: <IconClock className="size-3.5" />,
        description: "Pending collections"
      },
    ];

    return coreCards;
  }, [dataPack, customers, user, dateFilter]);

  const chartData = useMemo(() => {
    const data = {};
    const now = new Date();
    let fillStart = null;
    let fillEnd = new Date();

    // Determine range to pre-fill with zeros
    if (dateFilter === 'today') {
      fillStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      fillEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (dateFilter === 'yesterday') {
      fillStart = new Date(now.getTime() - 86400000);
      fillStart.setHours(0, 0, 0, 0);
      fillEnd = new Date(fillStart);
      fillEnd.setHours(23, 59, 59, 999);
    } else if (dateFilter === 'this-week') {
      fillStart = new Date(now);
      const day = fillStart.getDay();
      const diff = fillStart.getDate() - day + (day === 0 ? -6 : 1);
      fillStart.setDate(diff);
      fillStart.setHours(0, 0, 0, 0);
      fillEnd = new Date(fillStart.getTime() + 7 * 86400000 - 1);
    } else if (dateFilter === 'this-month') {
      fillStart = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (dateFilter === 'this-year') {
      fillStart = new Date(now.getFullYear(), 0, 1);
      fillEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (dateFilter === 'specific-day' && fromDate) {
      fillStart = new Date(fromDate);
      fillStart.setHours(0, 0, 0, 0);
      fillEnd = new Date(fromDate);
      fillEnd.setHours(23, 59, 59, 999);
    } else if (dateFilter === 'custom') {
      if (fromDate) {
        fillStart = new Date(fromDate);
        fillStart.setHours(0, 0, 0, 0);
      }
      if (toDate) {
        fillEnd = new Date(toDate);
        fillEnd.setHours(23, 59, 59, 999);
      }
    }

    // Daily Resolution pre-fill
    if (fillStart && fillEnd) {
      let temp = new Date(fillStart);
      while (temp <= fillEnd) {
        const dStr = temp.toISOString().split('T')[0];
        data[dStr] = { date: dStr, revenue: 0, volume: 0 };
        temp.setDate(temp.getDate() + 1);
      }
    }

    // Populate actual data
    dataPack.processedSales.forEach(sale => {
      const dStr = sale.date.toISOString().split('T')[0];
      if (!data[dStr]) data[dStr] = { date: dStr, revenue: 0, volume: 0 };
      data[dStr].revenue += Number(sale.totalAmount) || 0;
      data[dStr].volume += 1;
    });

    return Object.values(data).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [dataPack.processedSales, dateFilter, fromDate, toDate]);

  const handleViewDetails = useCallback((sale) => {
    setSelectedSale(sale);
    setIsDetailsModalOpen(true);
  }, []);

  const handleEditSale = useCallback((sale) => {
    router.push(`/sales/edit/${sale.id}?from=dashboard`);
  }, [router]);

  const handleDownloadInvoice = useCallback((sale) => {
    // Show preview modal first
    setPreviewSaleData(sale);
    setIsInvoicePreviewOpen(true);
  }, []);

  const handleTimeRangeChange = useCallback((val) => {
    if (val === 'this-month') setDateFilter('this-month');
    else if (val === 'this-year') setDateFilter('this-year');
    else setDateFilter(val);
  }, []);

  const handleConfirmDownload = useCallback(async () => {
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
  }, [previewSaleData]);

  if (loading || !user || user?.role?.trim().toLowerCase() !== 'admin') {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-screen bg-background text-foreground">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-xs font-black uppercase tracking-[0.2em] animate-pulse">Initializing Data Stream...</p>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-8 py-8 transition-all duration-700 animate-in fade-in slide-in-from-bottom-2">
      {/* Premium Dashboard Header */}
      <div className="px-4 lg:px-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] font-mono">
              Intelligence Dashboard
            </span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight leading-none">
            Hello, <span className="text-primary italic">{user?.name?.split(' ')[0] || 'Admin'}</span>
          </h1>
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
            <span>{user?.role === 'admin' ? 'Master Administrator' : 'Staff Member'}</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-card border border-border/50 rounded-xl pl-3 h-10 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground shrink-0 border-r pr-2 h-full flex items-center">Period</span>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest focus:ring-0 cursor-pointer outline-none h-full px-2 w-[120px] shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
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
                  <Button variant="outline" className={cn("h-10 justify-start text-left font-black text-[10px] uppercase tracking-widest bg-muted/20 pl-3 pr-4 border border-border/50 shadow-sm rounded-xl", !fromDate && "text-muted-foreground")}>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-3">Date</span>
                    {fromDate ? format(fromDate, "dd MMM yyyy") : <span className="opacity-50">Select Date</span>}
                    <IconCalendar className="ml-auto h-3.5 w-3.5 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent mode="single" selected={fromDate} onSelect={setFromDate} disabled={(date) => date > new Date()} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("h-10 justify-start text-left font-black text-[10px] uppercase tracking-widest bg-muted/20 pl-3 pr-4 border border-border/50 shadow-sm rounded-xl", !fromDate && "text-muted-foreground")}>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-3">From</span>
                    {fromDate ? format(fromDate, "dd/MM/yy") : <span className="opacity-50">Select</span>}
                    <IconCalendar className="ml-auto h-3.5 w-3.5 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent mode="single" selected={fromDate} onSelect={setFromDate} disabled={(date) => date > new Date()} initialFocus />
                </PopoverContent>
              </Popover>
              <div className="h-4 w-[1px] bg-border" />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("h-10 justify-start text-left font-black text-[10px] uppercase tracking-widest bg-muted/20 pl-3 pr-4 border border-border/50 shadow-sm rounded-xl", !toDate && "text-muted-foreground")}>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-3">To</span>
                    {toDate ? format(toDate, "dd/MM/yy") : <span className="opacity-50">Select</span>}
                    <IconCalendar className="ml-auto h-3.5 w-3.5 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent mode="single" selected={toDate} onSelect={setToDate} disabled={(date) => date > new Date()} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>

      <SectionCards cards={stats} />

      <div className="px-4 lg:px-6">
        <ChartAreaInteractive
          data={chartData}
          timeRange={dateFilter === 'this-month' ? 'this-month' : dateFilter === 'this-year' ? 'this-year' : dateFilter}
          onTimeRangeChange={handleTimeRangeChange}
        />
      </div>

      <div className="space-y-4">
        <div className="px-4 lg:px-6 flex items-center gap-3 mt-4">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <span className="font-black text-[10px]">DB</span>
          </div>
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Detailed Sales Records</h2>
        </div>
        <DashboardTable
          data={dataPack.processedSales}
          admins={admins}
          onViewDetails={handleViewDetails}
          onEditSale={handleEditSale}
          onDownloadInvoice={handleDownloadInvoice}
        />
      </div>

      <SaleDetailsModal
        isOpen={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        sale={selectedSale}
        customer={selectedSale ? customers.find(c => c.id === selectedSale.customerId) : null}
        onDownloadInvoice={handleDownloadInvoice}
      />

      <InvoicePreviewModal
        isOpen={isInvoicePreviewOpen}
        onClose={() => setIsInvoicePreviewOpen(false)}
        sale={previewSaleData}
        customer={previewSaleData ? customers.find(c => c.id === previewSaleData.customerId) : null}
        admins={admins}
        onConfirmDownload={handleConfirmDownload}
      />

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
    </div>
  )
}
