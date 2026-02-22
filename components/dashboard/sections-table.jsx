"use client"

import * as React from "react"
import {
    IconCircleCheckFilled,
    IconDotsVertical,
    IconLoader,
    IconSearch,
    IconFilter,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/data-table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const columns = [
    {
        accessorKey: "salesRefId",
        header: "Invoice ID",
        cell: ({ row }) => (
            <div className="font-mono font-bold text-xs uppercase tracking-tighter">
                {row.original.salesRefId?.[0] || "N/A"}
            </div>
        ),
    },
    {
        accessorKey: "customerName",
        header: "Customer Name",
        cell: ({ row }) => (
            <div className="font-bold text-sm">
                {row.original.customerName || "Unknown"}
            </div>
        ),
    },
    {
        accessorKey: "services",
        header: "Service Name",
        cell: ({ row }) => (
            <div className="max-w-[200px] truncate text-xs text-muted-foreground font-medium">
                {row.original.services?.map(s => s.name).join(', ')}
            </div>
        ),
    },
    {
        accessorKey: "staffName",
        header: "Staff Name",
        cell: ({ row }) => (
            <div className="text-xs font-semibold">
                {row.original.staffName || "System"}
            </div>
        ),
    },
    {
        accessorKey: "totalAmount",
        header: "Amount",
        cell: ({ row }) => (
            <div className="font-black text-sm tracking-tighter">
                ₹{row.original.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
        ),
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.original.status || "Pending";
            const isClosed = status === "Closed";
            return (
                <Badge variant="outline" className={`gap-1.5 px-2 py-0.5 ${isClosed ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/20" : "bg-orange-500/5 text-orange-500 border-orange-500/20"}`}>
                    {isClosed ? <IconCircleCheckFilled className="size-3" /> : <IconLoader className="size-3 animate-spin" />}
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        {isClosed ? "Payment Closed" : "Payment Pending"}
                    </span>
                </Badge>
            );
        },
    },
    {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }) => {
            const date = row.original.createdAt?.toDate ? row.original.createdAt.toDate() : new Date(row.original.createdAt);
            return (
                <div className="text-[10px] font-bold text-muted-foreground uppercase">
                    {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
            );
        },
    },
    {
        id: "actions",
        cell: () => (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                        size="icon">
                        <IconDotsVertical className="size-4" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem className="text-xs font-bold uppercase tracking-widest">View PDF</DropdownMenuItem>
                    <DropdownMenuItem className="text-xs font-bold uppercase tracking-widest">Edit Entry</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" className="text-xs font-bold uppercase tracking-widest">Delete</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        ),
    },
]

export function DashboardTable({ data = [] }) {
    const [searchTerm, setSearchTerm] = React.useState("");
    const [staffSearchTerm, setStaffSearchTerm] = React.useState("");
    const [roleFilter, setRoleFilter] = React.useState("all");
    const [statusFilter, setStatusFilter] = React.useState("all");

    const filteredData = React.useMemo(() => {
        return data.filter(item => {
            const matchesSearch = (item.customerName || "").toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStaffSearch = (item.staffName || "").toLowerCase().includes(staffSearchTerm.toLowerCase());
            const matchesRole = roleFilter === "all" || (item.staffRole || "admin") === roleFilter;
            const matchesStatus = statusFilter === "all" || (item.status || "Pending") === statusFilter;
            return matchesSearch && matchesStaffSearch && matchesRole && matchesStatus;
        });
    }, [data, searchTerm, staffSearchTerm, roleFilter, statusFilter]);

    return (
        <div className="flex flex-col gap-4 px-4 lg:px-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-card p-4 rounded-xl border border-border/50">
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-72">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search customer name..."
                            className="pl-9 h-10 text-xs font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative w-full md:w-72">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search staff or admin name..."
                            className="pl-9 h-10 text-xs font-medium"
                            value={staffSearchTerm}
                            onChange={(e) => setStaffSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="h-8 w-[100px] text-[10px] font-black uppercase tracking-widest bg-background border-border/50 focus:ring-0 rounded-lg shadow-sm">
                            <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="text-xs font-bold uppercase tracking-tighter">All</SelectItem>
                            <SelectItem value="admin" className="text-xs font-bold uppercase tracking-tighter">Admin</SelectItem>
                            <SelectItem value="staff" className="text-xs font-bold uppercase tracking-tighter">Staff</SelectItem>
                        </SelectContent>
                    </Select>

                    <IconFilter className="size-4 text-muted-foreground" />
                    <div className="flex gap-1">
                        {[
                            { label: "all", value: "all" },
                            { label: "Payment Closed", value: "Closed" },
                            { label: "Payment Pending", value: "Pending" }
                        ].map((status) => (
                            <Button
                                key={status.value}
                                variant={statusFilter === status.value ? "default" : "outline"}
                                size="sm"
                                className="h-8 text-[10px] font-black uppercase tracking-widest px-3"
                                onClick={() => setStatusFilter(status.value)}
                            >
                                {status.label}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
            <DataTable
                data={filteredData}
                columns={columns}
                enableReordering={false}
            />
        </div>
    );
}
