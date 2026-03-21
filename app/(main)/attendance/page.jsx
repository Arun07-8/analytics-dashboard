'use client';

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useMemo } from "react";
import { 
  clockIn, 
  clockOut, 
  startBreak,
  endBreak,
  getTodayAttendance, 
  subscribeToStaffAttendance 
} from "@/lib/firebase/collections/attendance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  IconClock, 
  IconLogin, 
  IconLogout, 
  IconCoffee, 
  IconCoffeeOff,
  IconBriefcase
} from "@tabler/icons-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/data-table";

export default function AttendancePage() {
  const { user, loading } = useAuth();
  const [todayRecord, setTodayRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time for live calculations
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user) {
      const fetchToday = async () => {
        const record = await getTodayAttendance(user.uid);
        setTodayRecord(record);
      };
      fetchToday();

      const unsubscribe = subscribeToStaffAttendance(user.uid, (data) => {
        setHistory(data);
        const today = new Date().toLocaleDateString('en-CA');
        const found = data.find(r => r.date === today);
        setTodayRecord(found || null);
      });

      return () => unsubscribe();
    }
  }, [user]);

  const liveStatus = useMemo(() => {
    if (!todayRecord) return "Not Clocked In";
    if (todayRecord.clockOut) return "Completed";
    const lastBreak = todayRecord.breaks?.length > 0 ? todayRecord.breaks[todayRecord.breaks.length - 1] : null;
    if (lastBreak && !lastBreak.end) return "On Break";
    return "Working";
  }, [todayRecord]);

  const formatDuration = (ms) => {
    if (!ms || ms < 0) return "0h 0m";
    const totalMinutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const calculateHours = (record) => {
    if (!record || !record.clockIn) return { working: 0, breaks: record?.totalBreakDuration || 0 };
    const start = record.clockIn.toDate();
    const end = record.clockOut ? record.clockOut.toDate() : currentTime;
    let totalMs = end - start;
    let breakMs = record.totalBreakDuration || 0;
    const lastBreak = record.breaks?.length > 0 ? record.breaks[record.breaks.length - 1] : null;
    if (lastBreak && !lastBreak.end) {
      breakMs += (currentTime - lastBreak.start.toDate());
    }
    const workingMs = totalMs - breakMs;
    return { working: Math.max(0, workingMs), breaks: breakMs };
  };

  const determineStatus = (workingMs) => {
    const hours = workingMs / (1000 * 60 * 60);
    if (hours >= 8) return "Present";
    if (hours >= 4) return "Half Day";
    return "Absent";
  };

  const handleClockIn = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      await clockIn(user.uid, user.name);
      toast.success("Shift started!");
    } catch (error) {
      toast.error("Failed to start shift");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartBreak = async () => {
    if (!todayRecord) return;
    setIsProcessing(true);
    try {
      await startBreak(todayRecord.id);
      toast.success("Break started");
    } catch (error) {
      toast.error("Failed to start break");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEndBreak = async () => {
    if (!todayRecord) return;
    setIsProcessing(true);
    try {
      await endBreak(todayRecord.id);
      toast.success("Break ended");
    } catch (error) {
      toast.error("Failed to end break");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClockOut = async () => {
    if (!todayRecord) return;
    const lastBreak = todayRecord.breaks?.length > 0 ? todayRecord.breaks[todayRecord.breaks.length - 1] : null;
    if (lastBreak && !lastBreak.end) {
      toast.error("Please end your break before clocking out.");
      return;
    }
    setIsProcessing(true);
    try {
      const { working } = calculateHours(todayRecord);
      const finalStatus = determineStatus(working);
      await clockOut(todayRecord.id, finalStatus);
      toast.success(`Shift ended. Status: ${finalStatus}`);
    } catch (error) {
      toast.error("Failed to end shift");
    } finally {
      setIsProcessing(false);
    }
  };

  const columns = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => <div className="font-bold text-sm">{format(new Date(row.original.date), "dd MMM yyyy")}</div>,
    },
    {
      id: "clockIn",
      header: "Clock In",
      cell: ({ row }) => (
        <div className="font-mono text-[11px] font-bold">
          {row.original.clockIn ? format(row.original.clockIn.toDate(), "hh:mm a") : "--"}
        </div>
      ),
    },
    {
      id: "clockOut",
      header: "Clock Out",
      cell: ({ row }) => (
        <div className="font-mono text-[11px] font-bold text-muted-foreground">
          {row.original.clockOut ? format(row.original.clockOut.toDate(), "hh:mm a") : (row.original.date === new Date().toLocaleDateString('en-CA') ? "Active" : "Missed")}
        </div>
      ),
    },
    {
      id: "breaks",
      header: "Breaks",
      cell: ({ row }) => {
        const stats = row.original.clockOut ? { breaks: row.original.totalBreakDuration || 0 } : calculateHours(row.original);
        return <div className="text-xs font-bold text-orange-600/70">{formatDuration(stats.breaks)}</div>;
      },
    },
    {
      id: "workHours",
      header: "Work Hours",
      cell: ({ row }) => {
        const stats = row.original.clockOut 
          ? { working: (row.original.clockOut.toDate() - row.original.clockIn.toDate()) - (row.original.totalBreakDuration || 0) } 
          : calculateHours(row.original);
        return <div className="text-sm font-bold text-foreground font-mono">{formatDuration(stats.working)}</div>;
      },
    },
    {
      id: "status",
      header: () => <div className="text-right">Status</div>,
      cell: ({ row }) => {
        const stats = row.original.clockOut 
          ? { working: (row.original.clockOut.toDate() - row.original.clockIn.toDate()) - (row.original.totalBreakDuration || 0) } 
          : calculateHours(row.original);
        const status = row.original.clockOut ? row.original.status : determineStatus(stats.working);
        return (
          <div className="text-right">
            <Badge 
              variant={status === "Present" ? "default" : status === "Half Day" ? "secondary" : "outline"}
              className={cn(
                "rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-tight",
                status === "Present" ? "bg-emerald-500 text-white hover:bg-emerald-600 border-none" : 
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

  if (!user) return null;

  const currentStats = calculateHours(todayRecord);

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full overflow-x-hidden animate-in fade-in slide-in-from-bottom-2">
      {/* Consistent Header Style */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-border/40">
        <div className="space-y-1 md:space-y-2 text-left">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </div>
            <span className="text-[10px] md:text-[11px] font-bold text-muted-foreground uppercase tracking-widest font-mono">
              Staff Portal
            </span>
          </div>
          <h1 className="text-[22px] md:text-4xl font-bold text-foreground tracking-tight leading-none">
            Attendance Dashboard
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground font-medium flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 md:py-1 text-[10px] md:text-xs font-bold text-muted-foreground ring-1 ring-inset ring-muted-foreground/10">
              Personal Record
            </span>
            <span className="h-0.5 w-0.5 rounded-full bg-border" />
            <span>{format(currentTime, "EEEE, MMMM do, yyyy")}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-background border border-border/60 rounded-xl shadow-sm p-1.5 gap-3 px-4 h-11">
             <div className={cn(
               "h-2 w-2 rounded-full",
               liveStatus === "Working" ? "bg-emerald-500" : liveStatus === "On Break" ? "bg-orange-500" : "bg-muted"
             )} />
             <span className="text-xs font-black uppercase tracking-widest text-foreground">{liveStatus}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        <Card className="lg:col-span-12 shadow-sm border-border/50 bg-card overflow-hidden">
          <CardHeader className="pb-4">
             <CardTitle className="text-xl font-bold">Shift Controls</CardTitle>
             <CardDescription>Manage your working hours and breaks for today.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-muted/30 rounded-2xl p-6 border border-border/40 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Time Elapsed</p>
                    <h2 className="text-4xl font-bold tracking-tighter text-foreground font-mono">
                      {formatDuration(currentStats.working)}
                    </h2>
                  </div>
                  <div className="flex items-center gap-4 mt-6 pt-6 border-t border-border/40">
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Clock In</p>
                        <p className="font-bold text-sm">{todayRecord?.clockIn ? format(todayRecord.clockIn.toDate(), "hh:mm a") : "--:--"}</p>
                    </div>
                    <div className="h-6 w-px bg-border/60" />
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Break Time</p>
                        <p className="font-bold text-sm text-orange-600">{formatDuration(currentStats.breaks)}</p>
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 gap-3">
                  {!todayRecord ? (
                    <Button 
                      onClick={handleClockIn} 
                      disabled={isProcessing}
                      className="h-full rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-sm hover:opacity-90 transition-all flex-col gap-2 py-6"
                    >
                      <IconLogin size={28} />
                      <span>Start Shift</span>
                    </Button>
                  ) : !todayRecord.clockOut ? (
                    <>
                      {liveStatus === "On Break" ? (
                        <Button 
                          onClick={handleEndBreak} 
                          disabled={isProcessing}
                          className="h-1/2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
                        >
                          <IconCoffeeOff size={20} /> End Break
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleStartBreak} 
                          disabled={isProcessing}
                          variant="secondary"
                          className="h-1/2 rounded-xl bg-muted hover:bg-muted/80 font-bold gap-2"
                        >
                          <IconCoffee size={20} /> Take a Break
                        </Button>
                      )}
                      <Button 
                        onClick={handleClockOut} 
                        disabled={isProcessing}
                        variant="destructive"
                        className="h-1/2 rounded-xl font-bold gap-2"
                      >
                        <IconLogout size={20} /> End Shift
                      </Button>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-sm font-bold p-8 text-center italic">
                      Shifts for today have been completed. Enjoy your rest!
                    </div>
                  )}
               </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Table with Pagination using DataTable */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Attendance History</h2>
        </div>
        <DataTable
            data={history}
            columns={columns}
            searchPlaceholder="Search dates..."
            onSearchChange={(val) => {
              // History is already synced, search provided by DataTable internal model
            }}
            initialPageSize={10}
        />
      </div>
    </div>
  );
}
