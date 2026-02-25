"use client"

import * as React from "react"
import {
    IconCircleCheckFilled,
    IconDotsVertical,
    IconLoader,
    IconSearch,
    IconFilter,
    IconLayoutColumns,
    IconChevronDown,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
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
        label: "Invoice ID",
        header: () => <div className="text-[11px] font-extrabold text-foreground">Invoice ID</div>,
        cell: ({ row }) => (
            <div className="font-mono font-bold text-xs uppercase tracking-tighter">
                {row.original.salesRefId?.[0] || "N/A"}
            </div>
        ),
    },
    {
        accessorKey: "customerName",
        label: "Customer Name",
        header: () => <div className="text-[11px] font-extrabold text-foreground">Customer Name</div>,
        cell: ({ row }) => (
            <div className="font-bold text-sm">
                {row.original.customerName || "Unknown"}
            </div>
        ),
    },
    {
        accessorKey: "services",
        label: "Services",
        header: () => <div className="text-[11px] font-extrabold text-foreground">Services</div>,
        cell: ({ row }) => (
            <div className="max-w-[200px] truncate text-xs text-muted-foreground font-medium">
                {row.original.services?.map(s => s.name).join(', ')}
            </div>
        ),
    },
    {
        accessorKey: "staffName",
        label: "Staff Member",
        header: () => <div className="text-[11px] font-extrabold text-foreground">Staff Name</div>,
        cell: ({ row }) => (
            <div className="text-xs font-semibold">
                {row.original.staffName || "System"}
            </div>
        ),
    },
    {
        accessorKey: "totalAmount",
        label: "Total Amount",
        header: () => <div className="text-[11px] font-extrabold text-foreground">Total</div>,
        cell: ({ row }) => (
            <div className="font-bold text-sm tracking-tight text-foreground">
                ₹{row.original.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
            </div>
        ),
    },
    {
        accessorKey: "paidAmount",
        label: "Paid Amount",
        header: () => <div className="text-[11px] font-extrabold text-foreground">Paid</div>,
        cell: ({ row }) => (
            <div className="font-bold text-sm tracking-tight text-emerald-600">
                ₹{row.original.paidAmount?.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
            </div>
        ),
    },
    {
        id: "balance",
        label: "Balance",
        header: () => <div className="text-[11px] font-extrabold text-foreground">Balance</div>,
        cell: ({ row }) => {
            const balance = (Number(row.original.totalAmount) || 0) - (Number(row.original.paidAmount) || 0);
            return (
                <div className={cn(
                    "font-black text-sm tracking-tight",
                    balance > 0 ? "text-destructive" : "text-emerald-600"
                )}>
                    ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
                </div>
            );
        },
    },
    {
        accessorKey: "status",
        label: "Payment Status",
        header: () => <div className="text-[11px] font-extrabold text-foreground">Status</div>,
        cell: ({ row }) => {
            const status = row.original.status?.toLowerCase() || (row.original.closed ? "paid" : "unpaid");
            const isPaid = status === "paid" || status === "closed";
            return (
                <Badge variant="outline" className={`gap-1.5 px-2 py-0.5 ${isPaid ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/20" : "bg-orange-500/5 text-orange-500 border-orange-500/20"}`}>
                    {isPaid ? <IconCircleCheckFilled className="size-3" /> : <IconLoader className="size-3 animate-spin" />}
                    <span className="text-[10px] font-bold">
                        {isPaid ? "Payment Closed" : "Payment Pending"}
                    </span>
                </Badge>
            );
        },
    },
    {
        accessorKey: "createdAt",
        label: "Recording Date",
        header: () => <div className="text-[11px] font-extrabold text-foreground">Date</div>,
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
        header: () => <div className="text-right text-[11px] font-extrabold text-foreground pr-2">Actions</div>,
        cell: function ActionCell({ row, table }) {
            const sale = row.original;
            const meta = table.options.meta;

            return (
                <div className="flex justify-end pr-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="data-[state=open]:bg-muted hover:bg-muted/50 text-muted-foreground transition-colors flex size-8"
                                size="icon">
                                <IconDotsVertical className="size-4" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-border/40 p-1.5">
                            <DropdownMenuItem className="text-sm font-medium cursor-pointer rounded-md focus:bg-primary/5 focus:text-primary transition-colors py-2" onClick={() => meta?.onViewDetails?.(sale)}>View Details</DropdownMenuItem>
                            <DropdownMenuItem className="text-sm font-medium cursor-pointer rounded-md focus:bg-primary/5 focus:text-primary transition-colors py-2" onClick={() => meta?.onEditSale?.(sale)}>Edit Entry</DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border/40 my-1" />
                            <DropdownMenuItem className="text-sm font-semibold text-primary cursor-pointer rounded-md focus:bg-primary/5 focus:text-primary transition-colors py-2" onClick={() => meta?.onDownloadInvoice?.(sale)}>Download Invoice</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        },
    },
];

export function DashboardTable({ data = [], admins = [], onViewDetails, onEditSale, onDownloadInvoice }) {
    const [searchTerm, setSearchTerm] = React.useState("");
    const [staffFilter, setStaffFilter] = React.useState("all");
    const [statusFilter, setStatusFilter] = React.useState("all");
    const [columnVisibility, setColumnVisibility] = React.useState({});

    const filteredData = React.useMemo(() => {
        return data.filter(item => {
            const matchesSearch = (item.customerName || "").toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStaff = staffFilter === "all" ||
                staffFilter === "admin" ||
                staffFilter === "staff"
                ? (staffFilter === "all" || (item.staffRole || "admin").toLowerCase() === staffFilter)
                : item.createdBy === staffFilter;

            const matchesStatus = statusFilter === "all" ||
                ((item.status?.toLowerCase() === statusFilter.toLowerCase()) ||
                    (statusFilter === "paid" && item.status === "Closed") ||
                    (statusFilter === "unpaid" && item.status === "Pending"));
            return matchesSearch && matchesStaff && matchesStatus;
        });
    }, [data, searchTerm, staffFilter, statusFilter]);

    const statusCounts = React.useMemo(() => {
        return {
            all: data.length,
            paid: data.filter(item => item.status?.toLowerCase() === 'paid' || item.status === 'Closed').length,
            unpaid: data.filter(item => item.status?.toLowerCase() === 'unpaid' || item.status === 'Pending').length
        };
    }, [data]);

    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center py-1">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center p-1 bg-muted/40 rounded-xl border border-border/40 w-fit">
                        {[
                            { label: "All Sales", value: "all" },
                            { label: "Payment Closed", value: "paid" },
                            { label: "Payment Pending", value: "unpaid" }
                        ].map((status) => (
                            <button
                                key={status.value}
                                onClick={() => setStatusFilter(status.value)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap",
                                    statusFilter === status.value
                                        ? "bg-card text-foreground shadow-sm ring-1 ring-border/10"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {status.label}
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded-full text-[9px] tracking-tight",
                                    statusFilter === status.value ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"
                                )}>
                                    {statusCounts[status.value]}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto items-center ml-auto">
                    <Select value={staffFilter} onValueChange={setStaffFilter}>
                        <SelectTrigger className="h-10 w-full sm:w-[170px] text-xs font-bold bg-card border-border/60 hover:border-primary/30 focus:ring-1 focus:ring-primary/20 rounded-xl transition-all shadow-sm">
                            <SelectValue placeholder="All Team" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/50 shadow-2xl p-1.5">
                            <SelectItem value="all" className="text-[10px] font-bold uppercase tracking-tight text-primary py-2 rounded-lg">
                                All Team Members
                            </SelectItem>

                            <DropdownMenuSeparator className="my-1 border-border/40" />
                            <div className="px-3 py-1.5 text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                                Admins
                            </div>
                            {admins.filter(a => a.role?.toLowerCase() === 'admin').map(admin => (
                                <SelectItem key={admin.id} value={admin.id} className="text-xs font-semibold py-2 rounded-lg pl-8">
                                    {admin.name}
                                </SelectItem>
                            ))}

                            <DropdownMenuSeparator className="my-1 border-border/40" />
                            <div className="px-3 py-1.5 text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                                Staff Members
                            </div>
                            {admins.filter(a => a.role?.toLowerCase() !== 'admin').map(staff => (
                                <SelectItem key={staff.id} value={staff.id} className="text-xs font-semibold py-2 rounded-lg pl-8">
                                    {staff.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="relative w-full sm:w-72">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" strokeWidth={2.5} />
                        <Input
                            placeholder="Search customer name..."
                            className="pl-10 h-10 text-xs font-bold bg-card border-border/60 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20 transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-10 text-xs font-bold gap-2 px-4 bg-card border-border/60 hover:border-primary/30 rounded-xl shadow-sm hover:bg-muted/30 transition-all text-muted-foreground">
                                <IconLayoutColumns className="size-4" />
                                <span className="hidden sm:inline">Columns</span>
                                <IconChevronDown className="size-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-2xl border-border/40 p-1.5">
                            {columns.filter(c => c.accessorKey && c.label).map((column) => (
                                <DropdownMenuCheckboxItem
                                    key={column.accessorKey}
                                    className="text-xs font-semibold py-2 rounded-lg cursor-pointer"
                                    checked={columnVisibility[column.accessorKey] !== false}
                                    onCheckedChange={(value) =>
                                        setColumnVisibility(prev => ({
                                            ...prev,
                                            [column.accessorKey]: !!value
                                        }))
                                    }>
                                    {column.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <DataTable
                data={filteredData}
                columns={columns}
                enableReordering={false}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                showColumnsButton={false}
                tableMeta={{
                    onViewDetails,
                    onEditSale,
                    onDownloadInvoice,
                }}
            />
        </div>
    );
}
