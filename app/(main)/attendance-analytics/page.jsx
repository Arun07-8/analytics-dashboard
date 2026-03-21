'use client';

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useMemo } from "react";
import { subscribeToAllAttendance } from "@/lib/firebase/collections/attendance";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  format,
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isWithinInterval,
  parseISO
} from "date-fns";
import { IconFilter, IconClock, IconUsers, IconCoffee, IconTarget, IconCalendar } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export default function AdminAttendancePage() {
  const { user, loading } = useAuth();
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("today");
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());

  useEffect(() => {
    if (user && user.role === 'admin') {
      const unsubscribe = subscribeToAllAttendance(setData);
      return () => unsubscribe();
    }
  }, [user]);

  const formatDuration = (ms) => {
    if (!ms || ms < 0) return "0h 0m";
    const totalMinutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const determineStatus = (workingMs) => {
    const hours = workingMs / (1000 * 60 * 60);
    if (hours >= 8) return "Present";
    if (hours >= 4) return "Half Day";
    return "Absent";
  };

  const filteredData = useMemo(() => {
    return data.filter(record => {
      // 0. Name Search
      if (searchQuery && !record.staffName?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // 1. Date Filter
      const recordDate = parseISO(record.date);
      let matchesDate = false;
      const now = new Date();

      switch (dateFilter) {
        case "all":
          matchesDate = true;
          break;
        case "today":
          matchesDate = isWithinInterval(recordDate, { start: startOfDay(now), end: endOfDay(now) });
          break;
        case "yesterday":
          const yesterday = subDays(now, 1);
          matchesDate = isWithinInterval(recordDate, { start: startOfDay(yesterday), end: endOfDay(yesterday) });
          break;
        case "this-week":
          matchesDate = isWithinInterval(recordDate, { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) });
          break;
        case "this-month":
          matchesDate = isWithinInterval(recordDate, { start: startOfMonth(now), end: endOfMonth(now) });
          break;
        case "this-year":
          matchesDate = isWithinInterval(recordDate, { start: startOfYear(now), end: endOfYear(now) });
          break;
        case "custom":
          if (fromDate && toDate) {
            matchesDate = isWithinInterval(recordDate, { start: startOfDay(fromDate), end: endOfDay(toDate) });
          } else {
            matchesDate = true;
          }
          break;
        default:
          matchesDate = true;
      }

      if (!matchesDate) return false;

      // 2. Status & Working Duration
      const workingMs = record.clockOut
        ? (record.clockOut.toDate() - record.clockIn.toDate()) - (record.totalBreakDuration || 0)
        : (new Date() - record.clockIn.toDate()) - (record.totalBreakDuration || 0);

      const status = record.clockOut ? record.status : determineStatus(workingMs);
      const hours = workingMs / (1000 * 60 * 60);

      const matchesStatus = statusFilter === "all" || status.toLowerCase() === statusFilter.toLowerCase();

      let matchesDuration = true;
      if (durationFilter === "full") matchesDuration = hours >= 8;
      else if (durationFilter === "half") matchesDuration = hours >= 4 && hours < 8;
      else if (durationFilter === "short") matchesDuration = hours < 4;

      return matchesStatus && matchesDuration;
    });
  }, [data, searchQuery, statusFilter, durationFilter, dateFilter, fromDate, toDate]);

  const stats = useMemo(() => {
    const today = new Date().toLocaleDateString('en-CA');
    const todayRecords = data.filter(r => r.date === today);

    const onDuty = todayRecords.filter(r => r.clockIn && !r.clockOut).length;
    const completed = todayRecords.filter(r => r.clockOut && r.status === "Present").length;
    const onBreak = todayRecords.filter(r => {
      if (r.clockOut) return false;
      const lastBreak = r.breaks?.length > 0 ? r.breaks[r.breaks.length - 1] : null;
      return lastBreak && !lastBreak.end;
    }).length;

    return { onDuty, completed, onBreak, totalToday: todayRecords.length };
  }, [data]);

  const columns = [
    {
      accessorKey: "staffName",
      header: "Staff Member",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black ring-2 ring-background">
            {(row.original.staffName || "??").substring(0, 2).toUpperCase()}
          </div>
          <span className="font-bold text-sm tracking-tight text-foreground">{row.original.staffName || "Unknown Staff"}</span>
        </div>
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <span className="font-bold text-xs text-muted-foreground font-mono">
          {row.original.date ? format(parseISO(row.original.date), "dd MMM yyyy") : "--"}
        </span>
      ),
    },
    {
      id: "clockIn",
      header: "Clock In",
      cell: ({ row }) => (
        <span className="font-mono text-[11px] font-bold bg-muted px-2 py-1 rounded-md">
          {row.original.clockIn ? format(row.original.clockIn.toDate(), "hh:mm a") : "--"}
        </span>
      ),
    },
    {
      id: "clockOut",
      header: "Clock Out",
      cell: ({ row }) => (
        row.original.clockOut ? (
          <span className="font-mono text-[11px] font-bold bg-muted px-2 py-1 rounded-md">
            {format(row.original.clockOut.toDate(), "hh:mm a")}
          </span>
        ) : (
          <div className="flex items-center gap-1.5 text-emerald-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider">On Duty</span>
          </div>
        )
      ),
    },
    {
      id: "breaks",
      header: "Breaks",
      cell: ({ row }) => (
        <span className="text-xs font-bold text-orange-600/80">
          {formatDuration(row.original.totalBreakDuration)}
        </span>
      ),
    },
    {
      id: "workingHours",
      header: "Working Hrs",
      cell: ({ row }) => {
        const workingMs = row.original.clockOut
          ? (row.original.clockOut.toDate() - row.original.clockIn.toDate()) - (row.original.totalBreakDuration || 0)
          : (new Date() - row.original.clockIn.toDate()) - (row.original.totalBreakDuration || 0);
        return <span className="text-sm font-black text-foreground font-mono">{formatDuration(workingMs)}</span>;
      },
    },
    {
      id: "status",
      header: () => <div className="text-right">Status</div>,
      cell: ({ row }) => {
        const workingMs = row.original.clockOut
          ? (row.original.clockOut.toDate() - row.original.clockIn.toDate()) - (row.original.totalBreakDuration || 0)
          : (new Date() - row.original.clockIn.toDate()) - (row.original.totalBreakDuration || 0);
        const status = row.original.clockOut ? row.original.status : determineStatus(workingMs);

        return (
          <div className="text-right">
            <Badge
              variant={status === "Present" ? "default" : status === "Half Day" ? "secondary" : "outline"}
              className={cn(
                "rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-tight",
                status === "Present" ? "bg-emerald-500 text-white border-none shadow-sm shadow-emerald-900/10" :
                  status === "Half Day" ? "bg-orange-500/10 text-orange-600 border-orange-200" : ""
              )}
            >
              {status}
            </Badge>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Access denied. This page is for administrators only.
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-8 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in slide-in-from-bottom-2">
      {/* 1. Page Header with Integrated Date Range */}
      <div className="flex flex-col @4xl/main:flex-row @4xl/main:items-center justify-between gap-6 pb-2 border-b border-border/40">
        <div className="space-y-1.5 text-left">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono">
              Admin Governance
            </span>
          </div>
          <h1 className="text-[28px] md:text-3xl font-bold text-foreground tracking-tight leading-none group flex items-center gap-3">
            Organization Attendance
            <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest bg-muted/30 border-border/40 text-muted-foreground px-2">
              {dateFilter.replace('-', ' ')}
            </Badge>
          </h1>
        </div>

        {/* Date Filter Selection Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center bg-background border border-border/60 rounded-xl shadow-sm p-1.5 gap-2 px-3">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mr-1">Timeline</span>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="bg-muted/50 border-none text-xs font-bold focus:ring-0 cursor-pointer outline-none h-8 px-3 w-[130px] shadow-none rounded-lg hover:bg-muted transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/40 shadow-lg p-1.5">
                <SelectGroup>
                  <SelectItem value="all" className="text-xs font-bold rounded-lg py-2">All Time</SelectItem>
                  <SelectItem value="today" className="text-xs font-bold rounded-lg py-2">Today</SelectItem>
                  <SelectItem value="yesterday" className="text-xs font-bold rounded-lg py-2">Yesterday</SelectItem>
                  <SelectItem value="this-week" className="text-xs font-bold rounded-lg py-2">Weekly</SelectItem>
                  <SelectItem value="this-month" className="text-xs font-bold rounded-lg py-2">Monthly</SelectItem>
                  <SelectItem value="this-year" className="text-xs font-bold rounded-lg py-2">Yearly</SelectItem>
                  <SelectItem value="custom" className="text-xs font-bold rounded-lg py-2">Custom Range</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {dateFilter === 'custom' && (
            <div className="flex items-center bg-background border border-border/60 rounded-xl shadow-sm p-1.5 animate-in fade-in slide-in-from-right-2 duration-300 gap-1.5">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className={cn("h-8 px-3 justify-start text-left font-bold text-xs bg-muted/50 rounded-lg hover:bg-muted transition-all", !fromDate && "text-muted-foreground")}>
                    <span className="text-[10px] text-muted-foreground mr-2 font-extrabold uppercase">From</span>
                    {fromDate ? format(fromDate, "dd MMM") : <span>Start</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar mode="single" selected={fromDate} onSelect={setFromDate} disabled={(date) => date > new Date()} initialFocus />
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
                  <Calendar mode="single" selected={toDate} onSelect={setToDate} disabled={(date) => date > new Date()} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>

      {/* 2. Summary Statistics (Context-Aware) */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-border/50 bg-card/50 overflow-hidden group hover:border-primary/20 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">On Duty Now</p>
              <p className="text-2xl font-bold font-mono text-emerald-600">{stats.onDuty}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
              <IconUsers size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50 bg-card/50 overflow-hidden group hover:border-primary/20 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Currently on Break</p>
              <p className="text-2xl font-bold font-mono text-orange-600">{stats.onBreak}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all">
              <IconCoffee size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50 bg-card/50 overflow-hidden group hover:border-primary/20 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Full Day (8h+)</p>
              <p className="text-2xl font-bold font-mono text-indigo-600">{stats.completed}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all">
              <IconClock size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50 bg-card/50 overflow-hidden group hover:border-primary/20 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Total Filtered Logs</p>
              <p className="text-2xl font-bold font-mono text-primary">{filteredData.length}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
              <IconTarget size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Main Data Area with Unified Control Bar */}
      <DataTable
          key={`${dateFilter}-${statusFilter}-${durationFilter}`}
          data={filteredData}
          columns={columns}
          searchPlaceholder="Search staff name..."
          onSearchChange={setSearchQuery}
          initialPageSize={10}
          leftContent={
            /* UNIFIED STATUS FILTER MENU (LEFT SIDE) */
            <div className="flex flex-wrap items-center gap-3 bg-muted/40 p-1 rounded-xl border border-border/40 w-fit">
              <div className="flex items-center gap-2 px-3 border-r border-border/40">
                <IconFilter size={15} className="text-muted-foreground/60" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Filters</span>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-[120px] border-none bg-card shadow-sm text-xs font-bold rounded-lg focus:ring-0">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/40 shadow-xl">
                  <SelectItem value="all" className="text-xs font-bold">All Status</SelectItem>
                  <SelectItem value="present" className="text-xs font-bold">Present (8h+)</SelectItem>
                  <SelectItem value="half day" className="text-xs font-bold">Half Day</SelectItem>
                  <SelectItem value="absent" className="text-xs font-bold">Absent/Short</SelectItem>
                </SelectContent>
              </Select>

              <Select value={durationFilter} onValueChange={setDurationFilter}>
                <SelectTrigger className="h-9 w-[140px] border-none bg-card shadow-sm text-xs font-bold rounded-lg focus:ring-0">
                  <SelectValue placeholder="Working Hrs" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/40 shadow-xl">
                  <SelectItem value="all" className="text-xs font-bold">All Working Hrs</SelectItem>
                  <SelectItem value="full" className="text-xs font-bold">Full Day (8h+)</SelectItem>
                  <SelectItem value="half" className="text-xs font-bold">Half Day (4h+)</SelectItem>
                  <SelectItem value="short" className="text-xs font-bold">Short Shift (&lt;4h)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
      />
    </div>
  );
}
