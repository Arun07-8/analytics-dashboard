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
        header: () => <div className="text-[10px] font-black uppercase tracking-widest text-foreground">Invoice ID</div>,
        cell: ({ row }) => (
            <div className="font-mono font-bold text-xs uppercase tracking-tighter">
                {row.original.salesRefId?.[0] || "N/A"}
            </div>
        ),
    },
    {
        accessorKey: "customerName",
        label: "Customer Name",
        header: () => <div className="text-[10px] font-black uppercase tracking-widest text-foreground">Customer Name</div>,
        cell: ({ row }) => (
            <div className="font-bold text-sm">
                {row.original.customerName || "Unknown"}
            </div>
        ),
    },
    {
        accessorKey: "services",
        label: "Services",
        header: () => <div className="text-[10px] font-black uppercase tracking-widest text-foreground">Service Name</div>,
        cell: ({ row }) => (
            <div className="max-w-[200px] truncate text-xs text-muted-foreground font-medium">
                {row.original.services?.map(s => s.name).join(', ')}
            </div>
        ),
    },
    {
        accessorKey: "staffName",
        label: "Staff Member",
        header: () => <div className="text-[10px] font-black uppercase tracking-widest text-foreground">Staff Name</div>,
        cell: ({ row }) => (
            <div className="text-xs font-semibold">
                {row.original.staffName || "System"}
            </div>
        ),
    },
    {
        accessorKey: "totalAmount",
        label: "Total Amount",
        header: () => <div className="text-[10px] font-black uppercase tracking-widest text-foreground">Amount</div>,
        cell: ({ row }) => (
            <div className="font-black text-sm tracking-tighter">
                ₹{row.original.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
        ),
    },
    {
        accessorKey: "status",
        label: "Payment Status",
        header: () => <div className="text-[10px] font-black uppercase tracking-widest text-foreground">Status</div>,
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
        label: "Recording Date",
        header: () => <div className="text-[10px] font-black uppercase tracking-widest text-foreground">Date</div>,
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
        header: () => <div className="text-right text-[10px] font-black uppercase tracking-widest text-foreground pr-2">Actions</div>,
        cell: function ActionCell({ row, table }) {
            const sale = row.original;
            const meta = table.options.meta;

            return (
                <div className="flex justify-end pr-2">
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
                        <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-2xl border-border/50">
                            <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest cursor-pointer py-2" onClick={() => meta?.onViewDetails?.(sale)}>View Details</DropdownMenuItem>
                            <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest cursor-pointer py-2" onClick={() => meta?.onEditSale?.(sale)}>Edit Entry</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest text-primary cursor-pointer py-2" onClick={() => meta?.onDownloadInvoice?.(sale)}>Download Invoice</DropdownMenuItem>
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
                : (item.staffName || "").toLowerCase() === staffFilter.toLowerCase();

            const matchesStatus = statusFilter === "all" || (item.status || "Pending") === statusFilter;
            return matchesSearch && matchesStaff && matchesStatus;
        });
    }, [data, searchTerm, staffFilter, statusFilter]);

    return (
        <div className="flex flex-col gap-4 px-4 lg:px-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-card p-4 rounded-xl border border-border/50">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex gap-1 bg-muted/50 p-1 rounded-lg border border-border/40">
                        {[
                            { label: "All Sales", value: "all" },
                            { label: "Payment Closed", value: "Closed" },
                            { label: "Payment Pending", value: "Pending" }
                        ].map((status) => (
                            <Button
                                key={status.value}
                                variant={statusFilter === status.value ? "secondary" : "ghost"}
                                size="sm"
                                className={`h-8 text-[10px] font-black uppercase tracking-widest px-4 rounded-md transition-all ${statusFilter === status.value ? "bg-background shadow-sm text-foreground hover:bg-background" : "text-muted-foreground hover:text-foreground"}`}
                                onClick={() => setStatusFilter(status.value)}
                            >
                                {status.label}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
                    <Select value={staffFilter} onValueChange={setStaffFilter}>
                        <SelectTrigger className="h-10 w-full md:w-[220px] text-xs font-bold uppercase tracking-widest bg-background border-border/50 focus:ring-0 rounded-lg shadow-sm">
                            <SelectValue placeholder="Select Staff/Admin" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/50 shadow-2xl">
                            <SelectItem value="all" className="text-xs font-bold uppercase tracking-tighter text-primary group">
                                <span className="flex items-center gap-2">All Team Members</span>
                            </SelectItem>

                            <DropdownMenuSeparator />
                            <SelectItem value="admin" className="text-xs font-extrabold uppercase tracking-tighter bg-muted/30">
                                👑 All Admins
                            </SelectItem>
                            {admins.filter(a => a.role?.toLowerCase() === 'admin').map(admin => (
                                <SelectItem key={admin.id} value={admin.name} className="text-xs font-medium uppercase tracking-tighter pl-8">
                                    {admin.name}
                                </SelectItem>
                            ))}

                            <DropdownMenuSeparator />
                            <SelectItem value="staff" className="text-xs font-extrabold uppercase tracking-tighter bg-muted/30">
                                👨‍💼 All Staff Members
                            </SelectItem>
                            {admins.filter(a => a.role?.toLowerCase() !== 'admin').map(staff => (
                                <SelectItem key={staff.id} value={staff.name} className="text-xs font-medium uppercase tracking-tighter pl-8">
                                    {staff.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="relative w-full md:w-72">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search customer name..."
                            className="pl-9 h-10 text-xs font-semibold bg-background border-border/50 rounded-lg focus-visible:ring-primary/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-10 text-[10px] font-black uppercase tracking-widest gap-2 bg-background border-border/50 rounded-lg shadow-sm hover:bg-muted/50">
                                <IconLayoutColumns className="size-3.5" />
                                <span className="hidden sm:inline">Customize Columns</span>
                                <IconChevronDown className="size-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-2xl border-border/50">
                            {columns.filter(c => c.accessorKey).map((column) => (
                                <DropdownMenuCheckboxItem
                                    key={column.accessorKey}
                                    className="text-xs font-bold uppercase tracking-tighter"
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
