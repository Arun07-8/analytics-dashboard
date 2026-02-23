"use client"

import * as React from "react"
import { Bell, Check, Clock, CheckCircle2, AlertCircle, XCircle, Trash2 } from "lucide-react"
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

export function NotificationBell() {
    const { user: authUser } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = React.useState([]);
    const [open, setOpen] = React.useState(false);

    React.useEffect(() => {
        if (!authUser) return;
        const unsub = subscribeToNotifications(authUser.uid, setNotifications);
        return () => unsub();
    }, [authUser]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleMarkAllRead = async (e) => {
        e.stopPropagation();
        if (authUser) await markAllNotificationsAsRead(authUser.uid);
    };

    const handleClearAll = async (e) => {
        e.stopPropagation();
        if (authUser) {
            await clearAllNotifications(authUser.uid);
        }
    };

    const handleDeleteOne = async (e, id) => {
        e.stopPropagation();
        await deleteNotification(id);
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            await markNotificationAsRead(notification.id);
        }
        if (notification.actionUrl) {
            router.push(notification.actionUrl);
        }
        setOpen(false);
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
            case 'warning': return <AlertCircle className="h-4 w-4 text-amber-500" />;
            default: return <Clock className="h-4 w-4 text-blue-500" />;
        }
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9 rounded-full border border-border shadow-sm transition-all duration-300 hover:shadow-md"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white animate-in zoom-in">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[340px] p-0 rounded-2xl border-border shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-card border-b">
                    <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Notifications</h3>
                    <div className="flex gap-3">
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-[9px] font-black uppercase text-primary hover:underline"
                            >
                                Mark Read
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                className="text-[9px] font-black uppercase text-red-500 hover:underline"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                </div>
                <div className="max-h-[400px] overflow-y-auto overflow-x-hidden scrollbar-none">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Bell className="h-10 w-10 text-muted-foreground/20 mb-3" />
                            <p className="text-xs font-medium text-muted-foreground italic">No notifications yet</p>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div
                                key={n.id}
                                onClick={() => handleNotificationClick(n)}
                                className={cn(
                                    "group px-4 py-4 cursor-pointer transition-colors border-b last:border-0 relative",
                                    !n.isRead ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50"
                                )}
                            >
                                <div className="flex gap-3 pr-6">
                                    <div className="mt-0.5 shrink-0">
                                        {getIcon(n.type)}
                                    </div>
                                    <div className="space-y-1 overflow-hidden">
                                        <div className="flex items-center justify-between gap-1">
                                            <p className={cn("text-xs leading-none transition-all", !n.isRead ? "font-black" : "font-semibold text-muted-foreground")}>
                                                {n.title}
                                            </p>
                                            <span className="text-[9px] font-black uppercase text-muted-foreground shrink-0 tabular-nums">
                                                {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                                            </span>
                                        </div>
                                        <p className="text-[11px] leading-relaxed text-muted-foreground font-medium line-clamp-2">
                                            {n.message}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => handleDeleteOne(e, n.id)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>

                                {!n.isRead && (
                                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-primary rounded-full" />
                                )}
                            </div>
                        ))
                    )}
                </div>
                {notifications.length > 0 && (
                    <div className="px-4 py-2 border-t bg-muted/20 text-center">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">End of messages</p>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
