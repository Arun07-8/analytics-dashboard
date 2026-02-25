"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconPlus, IconReportMoney, IconCalendarStats, IconTimeline, IconCalendar, IconChartBar, IconTrendingUp, IconReceipt, IconListCheck, IconActivity } from "@tabler/icons-react"
import { useAuth } from "@/contexts/AuthContext"
import { SectionCards } from "@/components/section-cards"
import { ExpensesTable } from "@/components/expenses/expenses-table"
import { ExpenseModal } from "@/components/expenses/expense-modal"
import { subscribeToExpenses, deleteExpense } from "@/lib/firebase/collections"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ExpensesPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const isAdmin = user?.role?.trim().toLowerCase() === 'admin'

    const [expenses, setExpenses] = React.useState([])
    const [isModalOpen, setIsModalOpen] = React.useState(false)
    const [editingExpense, setEditingExpense] = React.useState(null)
    const [deletingExpenseId, setDeletingExpenseId] = React.useState(null)
    const [dateFilter, setDateFilter] = React.useState('this-month')
    const [fromDate, setFromDate] = React.useState(null)
    const [toDate, setToDate] = React.useState(null)

    React.useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login")
            } else if (!isAdmin) {
                router.push("/dashboard")
                toast.error("Access denied. Admins only.")
            }
        }
    }, [user, loading, isAdmin, router])

    React.useEffect(() => {
        if (!user || !isAdmin) return
        const unsubExpenses = subscribeToExpenses(setExpenses)
        return () => {
            unsubExpenses()
        }
    }, [user, isAdmin])


    const dataPack = React.useMemo(() => {
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

        const filtered = expenses.filter(e => e.date >= currentStart && e.date <= currentEnd);
        const previous = expenses.filter(e => e.date >= prevStart && e.date < currentStart);

        const currentTotal = filtered.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const prevTotal = previous.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

        const allTimeTotal = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const allTimeCount = expenses.length;

        const highest = filtered.length > 0 ? Math.max(...filtered.map(e => Number(e.amount) || 0)) : 0;
        const average = filtered.length > 0 ? currentTotal / filtered.length : 0;

        return {
            filtered,
            currentTotal,
            prevTotal,
            allTimeTotal,
            allTimeCount,
            highest,
            average,
            currentCount: filtered.length,
            prevCount: previous.length
        };
    }, [expenses, dateFilter, fromDate, toDate]);

    const stats = React.useMemo(() => {
        const { currentTotal, prevTotal, allTimeTotal, allTimeCount, highest, currentCount } = dataPack;

        const calcGrowth = (curr, prev) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            return Math.round(((curr - prev) / prev) * 100);
        };

        const getDynamicLabel = () => {
            if (dateFilter === 'today') return "Today's Expenses";
            if (dateFilter === 'yesterday') return "Yesterday's Expenses";
            if (dateFilter === 'this-week') return "Weekly Expenses";
            if (dateFilter === 'this-month') return "Monthly Expenses";
            if (dateFilter === 'this-year') return "Yearly Expenses";
            return "Filtered Expenses";
        };

        return [
            {
                label: "Total Expense",
                value: allTimeTotal,
                prefix: "₹",
                isCurrency: true,
                icon: <IconReportMoney className="size-4" />,
                description: "Cumulative business spending"
            },
            {
                label: getDynamicLabel(),
                value: currentTotal,
                prefix: "₹",
                isCurrency: true,
                icon: <IconTrendingUp className="size-4" />,
                growth: calcGrowth(currentTotal, prevTotal),
                description: `Spending for the selected period`
            },
            {
                label: "Total Expense Records",
                value: allTimeCount,
                icon: <IconListCheck className="size-4" />,
                description: "All-time transaction count"
            }
        ]
    }, [dataPack, dateFilter])

    const chartData = React.useMemo(() => {
        const data = {};
        const now = new Date();
        let fillStart = null;
        let fillEnd = new Date();
        const isHourly = ['today', 'yesterday', 'specific-day'].includes(dateFilter);

        // Determine range to pre-fill
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

        // Resolution-based pre-fill
        if (fillStart && fillEnd) {
            if (isHourly) {
                for (let h = 0; h < 24; h++) {
                    const d = new Date(fillStart);
                    d.setHours(h, 0, 0, 0);
                    const iso = d.toISOString();
                    data[iso] = { date: iso, expense: 0, volume: 0, revenue: 0 };
                }
            } else {
                let temp = new Date(fillStart);
                while (temp <= fillEnd) {
                    const dStr = temp.toISOString().split('T')[0];
                    data[dStr] = { date: dStr, expense: 0, volume: 0, revenue: 0 };
                    temp.setDate(temp.getDate() + 1);
                }
            }
        }

        // Populate actual data
        dataPack.filtered.forEach(exp => {
            let key;
            if (isHourly) {
                const d = new Date(exp.date);
                d.setMinutes(0, 0, 0);
                key = d.toISOString();
            } else {
                key = exp.date.toISOString().split('T')[0];
            }
            if (!data[key]) data[key] = { date: key, expense: 0, volume: 0, revenue: 0 };
            data[key].expense += Number(exp.amount) || 0;
            data[key].volume += 1;
        });

        return Object.values(data).sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [dataPack.filtered, dateFilter, fromDate, toDate]);

    const handleTimeRangeChange = React.useCallback((val) => {
        setDateFilter(val);
    }, []);

    const handleAdd = () => {
        setEditingExpense(null)
        setIsModalOpen(true)
    }

    const handleEdit = (expense) => {
        setEditingExpense(expense)
        setIsModalOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!deletingExpenseId) return
        try {
            await deleteExpense(deletingExpenseId)
            toast.success("Expense deleted")
        } catch (error) {
            toast.error(error.message)
        } finally {
            setDeletingExpenseId(null)
        }
    }

    if (loading || !user || !isAdmin) return null

    return (
        <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full transition-all duration-700 animate-in fade-in slide-in-from-bottom-2">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/40">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                        </div>
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest font-mono">
                            Expenditure Terminal
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-none bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Business Expenses
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                        Monitor and audit all operational outflows and overheads
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
                                    <Button variant="outline" className={cn("h-10 justify-start text-left font-semibold text-xs bg-card pl-3 pr-4 border border-border/50 shadow-sm rounded-xl hover:bg-muted/50 hover:border-border transition-all", !fromDate && "text-muted-foreground")}>
                                        <span className="text-xs font-semibold text-muted-foreground mr-3">Date</span>
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
                                    <Button variant="outline" className={cn("h-10 justify-start text-left font-semibold text-xs bg-card pl-3 pr-4 border border-border/50 shadow-sm rounded-xl hover:bg-muted/50 hover:border-border transition-all", !fromDate && "text-muted-foreground")}>
                                        <span className="text-xs font-semibold text-muted-foreground mr-3">From</span>
                                        {fromDate ? format(fromDate, "dd/MM/yy") : <span className="opacity-50">Select</span>}
                                        <IconCalendar className="ml-auto h-3.5 w-3.5 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <CalendarComponent mode="single" selected={fromDate} onSelect={setFromDate} disabled={(date) => date > new Date()} initialFocus />
                                </PopoverContent>
                            </Popover>
                            <div className="h-4 w-[1px] bg-border/50" />
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("h-10 justify-start text-left font-semibold text-xs bg-card pl-3 pr-4 border border-border/50 shadow-sm rounded-xl hover:bg-muted/50 hover:border-border transition-all", !toDate && "text-muted-foreground")}>
                                        <span className="text-xs font-semibold text-muted-foreground mr-3">To</span>
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

                    <Button
                        onClick={handleAdd}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm h-10 px-6 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
                    >
                        <IconPlus className="size-4 mr-2" />
                        Add Expense
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                <SectionCards cards={stats} />

                <div className="rounded-xl border border-border/40 bg-card p-1 shadow-sm">
                    <ChartAreaInteractive
                        data={chartData}
                        timeRange={dateFilter === 'this-month' ? 'this-month' : dateFilter === 'this-year' ? 'this-year' : dateFilter}
                        onTimeRangeChange={handleTimeRangeChange}
                    />
                </div>
            </div>

            {/* Expenses Table Section */}
            <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive shadow-inner">
                        <span className="font-bold text-xs">EX</span>
                    </div>
                    <h2 className="text-sm font-semibold text-muted-foreground">Expense Records</h2>
                </div>
                <div className="bg-card/50 rounded-2xl border border-border/50 p-6 shadow-sm">
                    <ExpensesTable
                        data={dataPack.filtered}
                        onEdit={handleEdit}
                        onDelete={setDeletingExpenseId}
                    />
                </div>
            </div>

            {/* Modal */}
            <ExpenseModal
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
                expense={editingExpense}
            />

            {/* Delete Dialog */}
            <AlertDialog open={!!deletingExpenseId} onOpenChange={() => setDeletingExpenseId(null)}>
                <AlertDialogContent className="rounded-2xl border-border bg-card">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold tracking-tight">Confirm Deletion</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-medium text-muted-foreground pt-2">
                            Are you sure you want to remove this expense record? This action cannot be undone and will affect your net profit logic instantly.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 gap-3">
                        <AlertDialogCancel className="rounded-xl font-semibold text-xs h-11 border-border">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-semibold text-xs h-11 px-6"
                        >
                            Delete Expense
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
