"use client"

import * as React from "react"
import { Bell, Clock, CheckCircle2, AlertCircle, XCircle, Trash2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import {
    subscribeToNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications
} from "@/lib/firebase/collections"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function NotificationBell() {
    const { user: authUser } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = React.useState([]);
    const [open, setOpen] = React.useState(false);
    const [showAllMobile, setShowAllMobile] = React.useState(false);

    // Reset mobile expansion when closed
    React.useEffect(() => {
        if (!open) setShowAllMobile(false);
    }, [open]);

    // Track processed IDs to avoid duplicate toasts
    const seenIdsRef = React.useRef(new Set());

    React.useEffect(() => {
        if (!authUser) return;

        let isFirstSnapshot = true;

        const unsub = subscribeToNotifications(authUser.uid, (newNotifications) => {
            if (isFirstSnapshot) {
                // Initial load — mark all existing notifications as seen, no toasts
                newNotifications.forEach(n => seenIdsRef.current.add(n.id));
                isFirstSnapshot = false;
            } else {
                // Real-time update — toast only genuinely new unread notifications
                newNotifications.forEach(n => {
                    if (seenIdsRef.current.has(n.id)) return;
                    seenIdsRef.current.add(n.id);
                    if (!n.isRead) {
                        toast(n.title, {
                            description: n.message,
                            action: n.actionUrl ? {
                                label: "View",
                                onClick: () => handleNotificationClick(n),
                            } : undefined,
                            icon: <Bell className="size-4 text-primary" />,
                        });
                    }
                });
            }
            setNotifications(newNotifications);
        });

        return () => unsub();
    }, [authUser]);

    const unreadCount = React.useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

    const handleMarkAllRead = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (authUser) {
            try {
                await markAllNotificationsAsRead(authUser.uid);
            } catch (error) {
                console.error("Error marking all read:", error);
            }
        }
    };

    const handleClearAll = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (authUser) {
            try {
                await clearAllNotifications(authUser.uid);
            } catch (error) {
                console.error("Error clearing all:", error);
            }
        }
    };

    const handleDeleteOne = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await deleteNotification(id);
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    const handleNotificationClick = async (notification) => {
        try {
            if (!notification.isRead) {
                await markNotificationAsRead(notification.id);
            }
            if (notification.actionUrl) {
                router.push(notification.actionUrl);
            }
        } catch (error) {
            console.error("Error handling notification click:", error);
        } finally {
            setOpen(false);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return (
                <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
            );
            case 'error': return (
                <div className="flex size-8 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
                    <XCircle className="h-4 w-4 text-red-500" />
                </div>
            );
            case 'warning': return (
                <div className="flex size-8 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-500/20">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                </div>
            );
            default: return (
                <div className="flex size-8 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-blue-500/20">
                    <Clock className="h-4 w-4 text-blue-500" />
                </div>
            );
        }
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative size-10 rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:bg-muted hover:shadow-lg active:scale-95"
                >
                    <Bell className={cn("h-5 w-5 transition-transform duration-300", open && "rotate-12")} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-red-500 text-[10px] font-bold text-white shadow-lg animate-in zoom-in duration-300">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                sideOffset={12}
                alignOffset={-45}
                className="w-60 sm:w-[380px] p-0 rounded-2xl border-border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-3.5 py-2 bg-muted/30 border-b border-border/50">
                    <div>
                        <h3 className="text-[12px] font-bold text-foreground">Notifications</h3>
                        <p className="text-[8px] font-medium text-muted-foreground mt-0.5">
                            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-[9px] font-bold text-primary hover:text-primary/80 transition-colors"
                            >
                                Mark All Read
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                className="text-[9px] font-bold text-destructive hover:text-destructive/80 transition-colors"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-[350px] sm:max-h-[420px] overflow-y-auto scrollbar-none">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center px-5">
                            <div className="size-10 rounded-full bg-muted/50 flex items-center justify-center mb-2.5 ring-1 ring-border/50">
                                <Bell className="h-5 w-5 text-muted-foreground/30" />
                            </div>
                            <p className="text-[11px] font-bold text-foreground">Empty</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/30">
                            {notifications.map((n, i) => (
                                <div
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={cn(
                                        "group flex gap-2.5 px-3.5 py-2.5 cursor-pointer transition-all relative overflow-hidden",
                                        !n.isRead ? "bg-primary/[0.03] hover:bg-primary/[0.06]" : "bg-card hover:bg-muted/30",
                                        !showAllMobile && i >= 3 ? "hidden sm:flex" : ""
                                    )}
                                >
                                    <div className="shrink-0 mt-0.5 relative z-10">
                                        {getIcon(n.type)}
                                    </div>
                                    <div className="flex-1 space-y-1 relative z-10 overflow-hidden">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={cn("text-xs leading-tight transition-all", !n.isRead ? "font-black text-foreground" : "font-semibold text-muted-foreground")}>
                                                {n.title}
                                            </p>
                                            <span className="text-[9px] font-semibold text-muted-foreground shrink-0 tabular-nums bg-muted px-1.5 py-0.5 rounded leading-none mr-7 sm:mr-0 z-10 relative">
                                                {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                                            </span>
                                        </div>
                                        <p className="text-[11px] leading-relaxed text-muted-foreground font-medium line-clamp-none sm:line-clamp-2 pr-8 sm:pr-4">
                                            {n.message}
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 z-20">
                                        <button
                                            onClick={(e) => handleDeleteOne(e, n.id)}
                                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all bg-background/60 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none shadow-sm sm:shadow-none"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>

                                    {/* Unread Glow */}
                                    {!n.isRead && (
                                        <div className="absolute left-0 top-[20%] bottom-[20%] w-1 bg-primary rounded-r-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                                    )}
                                </div>
                            ))}
                            {notifications.length > 3 && !showAllMobile && (
                                <div className="sm:hidden w-full flex justify-center p-3 bg-muted/10">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setShowAllMobile(true); }}
                                        className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors"
                                    >
                                        View {notifications.length - 3} More
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-border/50 bg-muted/20 text-center">
                    <p className="text-[10px] font-semibold text-muted-foreground/60">
                        {notifications.length > 0 ? `Showing last ${notifications.length} messages` : 'Notification Terminal'}
                    </p>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

