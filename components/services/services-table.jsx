"use client"

import * as React from "react"
import {
    IconPencil,
    IconTrash,
    IconCircleCheckFilled,
    IconCircleXFilled,
    IconPackage,
} from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { ChartBarMixed } from "@/components/ui/Bar Chart "
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { IconCalendar } from "@tabler/icons-react"
import { toast } from "sonner"
export function ServicesTable({
    data,
    usageData,
    usagePeriod,
    onUsagePeriodChange,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    onEdit,
    onDelete,
    onAdd,
    searchTerm,
    onSearchChange,
    activeTab,
    onTabChange,
    servicesCount = {},
    pageSize = 5
}) {
    const columns = [
        {
            accessorKey: "name",
            header: "Service Name",
            cell: ({ row }) => <span className="font-semibold text-foreground">{row.original.name}</span>,
        },
        {
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => (
                <div className="max-w-xs truncate text-muted-foreground">
                    {row.original.description || <span className="text-muted-foreground/40 italic">No description</span>}
                </div>
            ),
        },
        {
            accessorKey: "isActive",
            header: "Status",
            cell: ({ row }) => {
                const isActive = row.original.isActive;
                return (
                    <Badge
                        variant="outline"
                        className={`px-2 py-0.5 font-medium ${isActive
                            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800'
                            : 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800'
                            }`}
                    >
                        <div className="flex items-center gap-1.5">
                            {isActive ? <IconCircleCheckFilled className="size-3.5" /> : <IconCircleXFilled className="size-3.5" />}
                            {isActive ? 'Active' : 'Inactive'}
                        </div>
                    </Badge>
                );
            },
        },
        {
            accessorKey: "createdAt",
            header: "Created At",
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground font-medium">
                    {new Date(row.original.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    })}
                </span>
            ),
        },
        {
            id: "actions",
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="flex justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(row.original)}
                        className="size-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                    >
                        <IconPencil className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(row.original.id)}
                        className="size-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                        <IconTrash className="size-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const tabs = [
        { label: "All Services", value: "all" },
        { label: "Active", value: "active", badge: servicesCount.active },
        { label: "Inactive", value: "inactive", badge: servicesCount.inactive },
    ];

    return (
        <div className="space-y-6 px-4 lg:px-6 mt-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/80">Live Performance</h3>
                    </div>
                    <p className="text-xl font-bold tracking-tight text-foreground">Service Analytics</p>
                </div>
                <div className="flex items-center gap-3 bg-muted/50 p-1.5 rounded-2xl border border-border/50">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-2">Period</span>
                    <Select value={usagePeriod} onValueChange={onUsagePeriodChange}>
                        <SelectTrigger className="w-[130px] h-8 rounded-xl border-none bg-background shadow-sm text-[10px] font-bold uppercase tracking-wider focus:ring-1 focus:ring-primary/20">
                            <SelectValue placeholder="Select Period" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border shadow-2xl">
                            <SelectItem value="today" className="text-[10px] font-bold uppercase">Today</SelectItem>
                            <SelectItem value="yesterday" className="text-[10px] font-bold uppercase">Yesterday</SelectItem>
                            <SelectItem value="this-week" className="text-[10px] font-bold uppercase">This Week</SelectItem>
                            <SelectItem value="this-month" className="text-[10px] font-bold uppercase">This Month</SelectItem>
                            <SelectItem value="this-year" className="text-[10px] font-bold uppercase">This Year</SelectItem>
                            <SelectItem value="all" className="text-[10px] font-bold uppercase">All Time</SelectItem>
                            <SelectItem value="specific-day" className="text-[10px] font-bold uppercase">Specific Date</SelectItem>
                            <SelectItem value="custom" className="text-[10px] font-bold uppercase italic">Custom Range</SelectItem>
                        </SelectContent>
                    </Select>

                    {usagePeriod === 'specific-day' && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "h-8 justify-start text-left font-bold text-[9px] uppercase bg-background px-3 border-none shadow-sm rounded-xl",
                                        !fromDate && "text-muted-foreground"
                                    )}
                                >
                                    {fromDate ? format(fromDate, "dd MMM yyyy") : <span>Date</span>}
                                    <IconCalendar className="ml-2 h-3 w-3 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-2xl border-border shadow-2xl" align="end">
                                <CalendarComponent
                                    mode="single"
                                    selected={fromDate}
                                    onSelect={setFromDate}
                                    disabled={(date) => date > new Date()}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    )}

                    {usagePeriod === 'custom' && (
                        <div className="flex items-center gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "h-8 justify-start text-left font-bold text-[9px] uppercase bg-background px-3 border-none shadow-sm rounded-xl",
                                            !fromDate && "text-muted-foreground"
                                        )}
                                    >
                                        {fromDate ? format(fromDate, "dd/MM") : <span>From</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 rounded-2xl border-border shadow-2xl" align="end">
                                    <CalendarComponent
                                        mode="single"
                                        selected={fromDate}
                                        onSelect={(date) => {
                                            setFromDate(date);
                                            if (date && toDate && date > toDate) {
                                                setToDate(date);
                                                toast.info("Adjusted 'To' date");
                                            }
                                        }}
                                        disabled={(date) => date > new Date()}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>

                            <span className="text-[10px] text-muted-foreground">-</span>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "h-8 justify-start text-left font-bold text-[9px] uppercase bg-background px-3 border-none shadow-sm rounded-xl",
                                            !toDate && "text-muted-foreground"
                                        )}
                                    >
                                        {toDate ? format(toDate, "dd/MM") : <span>To</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 rounded-2xl border-border shadow-2xl" align="end">
                                    <CalendarComponent
                                        mode="single"
                                        selected={toDate}
                                        onSelect={(date) => {
                                            setToDate(date);
                                            if (date && fromDate && date < fromDate) {
                                                setFromDate(date);
                                                toast.info("Adjusted 'From' date");
                                            }
                                        }}
                                        disabled={(date) => date > new Date()}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}
                </div>
            </div>

            <ChartBarMixed data={usageData} />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-widest text-primary/60">Active Inventory (Top 5)</h3>
                </div>
                <DataTable
                    data={data}
                    columns={columns}
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={onTabChange}
                    onAddClick={onAdd}
                    addLabel="Add Service"
                    searchPlaceholder="Search services..."
                    onSearchChange={onSearchChange}
                    initialPageSize={pageSize}
                />
            </div>
        </div>
    );
}
