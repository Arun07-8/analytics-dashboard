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
  const [selectedStaffId, setSelectedStaffId] = useState('all');

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
      currentEnd = new Date(startOfToday);
      currentEnd.setHours(23, 59, 59, 999);
    } else if (dateFilter === "yesterday") {
      currentStart = startOfYesterday;
      currentEnd = new Date(startOfYesterday);
      currentEnd.setHours(23, 59, 59, 999);
    } else if (dateFilter === "this-week") {
      currentStart = startOfThisWeek;
      currentEnd = new Date(startOfThisWeek.getTime() + 7 * 86400000 - 1);
      currentEnd.setHours(23, 59, 59, 999);
    } else if (dateFilter === "this-month") {
      currentStart = startOfThisMonth;
      currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (dateFilter === "this-year") {
      currentStart = startOfThisYear;
      currentEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (dateFilter === "specific-day") {
      if (fromDate) {
        currentStart = new Date(fromDate);
        currentStart.setHours(0, 0, 0, 0);
        currentEnd = new Date(fromDate);
        currentEnd.setHours(23, 59, 59, 999);
      } else {
        currentStart = startOfToday;
        currentEnd = new Date(startOfToday);
        currentEnd.setHours(23, 59, 59, 999);
      }
    } else if (dateFilter === "custom") {
      currentStart = fromDate ? new Date(fromDate) : new Date(0);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd = toDate ? new Date(toDate) : new Date(now.getFullYear() + 10, 0, 1);
      currentEnd.setHours(23, 59, 59, 999);
    } else {
      currentStart = startOfThisMonth;
      currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
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

    // Filter for verified sales
    let verifiedSales = allSalesWithDate.filter(s => s.isVerified === true);

    // Filter by selected staff if admin and not 'all'
    if (user.role === 'admin' && selectedStaffId !== 'all') {
      verifiedSales = verifiedSales.filter(s => s.createdBy === selectedStaffId);
    }

    // Global Revenue Calculations (Respects staff filter if applied)
    const allTimeCompanyRevenue = verifiedSales
      .filter(s => s.status === 'paid')
      .reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);

    const allTimeCompanyPending = verifiedSales
      .filter(s => s.status === 'unpaid')
      .reduce((sum, s) => sum + (Number(s.totalAmount) - (Number(s.paidAmount) || 0)), 0);

    const allTimeCompanySales = verifiedSales
      .reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);

    // Period-based stats (Respected context)
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

      if (user.role === 'admin') {
        if (selectedStaffId !== 'all') {
          return s.createdBy === selectedStaffId;
        }
        return true;
      }
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
  }, [sales, dateFilter, fromDate, toDate, customerMap, staffMap, customers, user, selectedStaffId]);

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
      const isStaffSelected = selectedStaffId !== 'all';
      const suffix = isStaffSelected ? " (Member)" : "";

      if (dateFilter === 'today') return "Today's Revenue" + suffix;
      if (dateFilter === 'yesterday') return "Yesterday's Revenue" + suffix;
      if (dateFilter === 'this-week') return "Weekly Revenue" + suffix;
      if (dateFilter === 'this-month') return "Monthly Revenue" + suffix;
      if (dateFilter === 'this-year') return "Yearly Revenue" + suffix;
      if (dateFilter === 'all') return "Total Revenue" + suffix;
      return "Selected Revenue" + suffix;
    };

    const isStaffSelected = selectedStaffId !== 'all';

    const coreCards = [
      {
        label: isStaffSelected ? "Member Revenue" : "Total Revenue",
        value: allTimeCompanyRevenue,
        prefix: "₹",
        isCurrency: true,
        icon: <IconReceipt className="size-3.5" />,
        description: isStaffSelected ? "Paid revenue by selection" : "Cumulative paid revenue"
      },
      {
        label: isStaffSelected ? "Member Sales" : "Total Sales",
        value: allTimeCompanySales,
        prefix: "₹",
        isCurrency: true,
        icon: <IconChartBar className="size-3.5" />,
        description: isStaffSelected ? "Gross sales by selection" : "Company-wide gross sales"
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
        label: "Transactions",
        value: currentStats.count,
        icon: <IconListCheck className="size-3.5" />,
        description: isStaffSelected ? "Orders by selection" : "Orders in this period"
      },
      {
        label: isStaffSelected ? "Member Pending" : "Total Pending",
        value: allTimeCompanyPending,
        prefix: "₹",
        isCurrency: true,
        icon: <IconClock className="size-3.5" />,
        description: isStaffSelected ? "Pending by selection" : "Pending collections"
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
            <p className="text-xs font-medium animate-pulse">Initializing Data Stream...</p>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full transition-all duration-700 animate-in fade-in slide-in-from-bottom-2">
      {/* Premium Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/40">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest font-mono">
              Overview
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-none bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            FoxonHub Dashboard
          </h1>
          <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-muted-foreground/10">
              {user?.role === 'admin' ? 'Master Administrator' : 'Staff Member'}
            </span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-background border border-border/60 rounded-xl shadow-sm p-1.5 gap-1.5">
            {user?.role?.trim().toLowerCase() === 'admin' && (
              <>
                <div className="flex items-center pl-3 pr-1">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mr-3">Member</span>
                  <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                    <SelectTrigger className="bg-muted/50 border-none text-xs font-bold focus:ring-0 cursor-pointer outline-none h-8 px-3 w-[140px] shadow-none rounded-lg hover:bg-muted transition-colors">
                      <SelectValue placeholder="All Members" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/40 shadow-2xl p-1.5">
                      <SelectItem value="all" className="text-xs font-bold focus:bg-primary/5 focus:text-primary rounded-lg py-2.5">
                        Global Performance
                      </SelectItem>
                      {admins.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id} className="text-xs font-bold focus:bg-primary/5 focus:text-primary rounded-lg py-2.5">
                          {staff.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="h-4 w-[1px] bg-border/60 mx-1" />
              </>
            )}

            <div className="flex items-center pl-3 pr-1">
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mr-3">Timeline</span>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="bg-muted/50 border-none text-xs font-bold focus:ring-0 cursor-pointer outline-none h-8 px-3 w-[130px] shadow-none rounded-lg hover:bg-muted transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/40 shadow-lg p-1.5">
                  <SelectGroup>
                    <SelectItem value="today" className="text-xs font-bold rounded-lg py-2">Today</SelectItem>
                    <SelectItem value="yesterday" className="text-xs font-bold rounded-lg py-2">Yesterday</SelectItem>
                    <SelectItem value="this-week" className="text-xs font-bold rounded-lg py-2">This Week</SelectItem>
                    <SelectItem value="this-month" className="text-xs font-bold rounded-lg py-2">This Month</SelectItem>
                    <SelectItem value="this-year" className="text-xs font-bold rounded-lg py-2">This Year</SelectItem>
                    <SelectItem value="specific-day" className="text-xs font-bold rounded-lg py-2">Specific Date</SelectItem>
                    <SelectItem value="custom" className="text-xs font-bold rounded-lg py-2">Custom Range</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(dateFilter === 'specific-day' || dateFilter === 'custom') && (
            <div className="flex items-center bg-background border border-border/60 rounded-xl shadow-sm p-1.5 animate-in fade-in slide-in-from-right-2 duration-300">
              {dateFilter === 'specific-day' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className={cn("h-8 justify-start text-left font-bold text-xs bg-muted/50 px-3 hover:bg-muted rounded-lg transition-all", !fromDate && "text-muted-foreground")}>
                      <IconCalendar className="mr-2 h-3.5 w-3.5 opacity-70" />
                      {fromDate ? format(fromDate, "dd MMM yyyy") : <span>Pick Date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent mode="single" selected={fromDate} onSelect={setFromDate} disabled={(date) => date > new Date()} initialFocus />
                  </PopoverContent>
                </Popover>
              )}

              {dateFilter === 'custom' && (
                <div className="flex items-center gap-1.5">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" className={cn("h-8 px-3 justify-start text-left font-bold text-xs bg-muted/50 rounded-lg hover:bg-muted transition-all", !fromDate && "text-muted-foreground")}>
                        <span className="text-[10px] text-muted-foreground mr-2 font-extrabold uppercase">From</span>
                        {fromDate ? format(fromDate, "dd MMM") : <span>Start</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <CalendarComponent mode="single" selected={fromDate} onSelect={setFromDate} disabled={(date) => date > new Date()} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <div className="h-3 w-[1px] bg-border/40" />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" className={cn("h-8 px-3 justify-start text-left font-bold text-xs bg-muted/50 rounded-lg hover:bg-muted transition-all", !toDate && "text-muted-foreground")}>
                        <span className="text-[10px] text-muted-foreground mr-2 font-extrabold uppercase">To</span>
                        {toDate ? format(toDate, "dd MMM") : <span>End</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <CalendarComponent mode="single" selected={toDate} onSelect={setToDate} disabled={(date) => date > new Date()} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <SectionCards cards={stats} />

        <ChartAreaInteractive
          data={chartData}
          timeRange={dateFilter === 'this-month' ? 'this-month' : dateFilter === 'this-year' ? 'this-year' : dateFilter}
          onTimeRangeChange={handleTimeRangeChange}
        />
      </div>

      <div className="space-y-4 pt-4">

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
