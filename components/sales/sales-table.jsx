"use client"

import * as React from "react"
import {
    IconCircleCheckFilled,
    IconDotsVertical,
    IconLoader,
    IconCreditCard,
    IconUser,
    IconEye,
    IconChevronDown,
    IconTrash
} from "@tabler/icons-react"
import { z } from "zod"
import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/data-table"

export const schema = z.object({
    id: z.string(),
    createdAt: z.any(), // Timestamp
    customerName: z.string().optional(),
    totalAmount: z.number(),
    paidAmount: z.number(),
    excessAmount: z.number().optional(),
    closed: z.boolean(),
})

export function SalesTable({
    data,
    tabs = [],
    activeTab,
    onTabChange,
    onSearchChange,
    searchPlaceholder,
    onAddClick,
    addLabel = "Create Sale",
    onViewDetails,
    onEditSale,
    onDownloadInvoice,
    onDeleteSale,
    onReuseSale,
    userRole = 'staff'
}) {
    const columns = React.useMemo(() => {
        const isAdmin = userRole?.trim().toLowerCase() === 'admin';

        const baseColumns = [
            {
                id: "select",
                header: ({ table }) => (
                    <div className="flex items-center justify-center">
                        <Checkbox
                            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                            aria-label="Select all" />
                    </div>
                ),
                cell: ({ row }) => (
                    <div className="flex items-center justify-center">
                        <Checkbox
                            checked={row.getIsSelected()}
                            onCheckedChange={(value) => row.toggleSelected(!!value)}
                            aria-label="Select row" />
                    </div>
                ),
            },
            {
                accessorKey: "createdAt",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        className="p-0 hover:bg-transparent -ml-2"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Date
                        <IconChevronDown className={cn("ml-2 h-4 w-4 transition-transform", column.getIsSorted() === "asc" && "rotate-180")} />
                    </Button>
                ),
                cell: ({ row }) => {
                    const date = row.original.createdAt?.toDate ? row.original.createdAt.toDate() : new Date(row.original.createdAt);
                    return <div className="text-nowrap">{date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}</div>
                },
            },
            {
                accessorKey: "customerName",
                header: "Customer",
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <IconUser className="size-4 text-muted-foreground" />
                        <span className="font-medium">{row.original.customerName || "Unknown"}</span>
                    </div>
                ),
            },
            {
                accessorKey: "staffName",
                header: "Staff",
                cell: ({ row }) => (
                    <div className="text-muted-foreground">
                        {row.original.staffName || "Unknown"}
                    </div>
                ),
            },
            {
                accessorKey: "totalAmount",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        className="p-0 hover:bg-transparent -ml-2"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Total Amount
                        <IconChevronDown className={cn("ml-2 h-4 w-4 transition-transform", column.getIsSorted() === "asc" && "rotate-180")} />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div className="font-medium">
                        ₹{row.original.totalAmount?.toFixed(2)}
                    </div>
                ),
            },
            {
                accessorKey: "paidAmount",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        className="p-0 hover:bg-transparent -ml-2"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Paid
                        <IconChevronDown className={cn("ml-2 h-4 w-4 transition-transform", column.getIsSorted() === "asc" && "rotate-180")} />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div className="font-medium text-muted-foreground">
                        ₹{row.original.paidAmount?.toFixed(2)}
                    </div>
                ),
            },
            {
                accessorKey: "excessAmount",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        className="p-0 hover:bg-transparent -ml-2"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Balance
                        <IconChevronDown className={cn("ml-2 h-4 w-4 transition-transform", column.getIsSorted() === "asc" && "rotate-180")} />
                    </Button>
                ),
                cell: ({ row }) => {
                    const balance = row.original.excessAmount ?? (row.original.totalAmount - row.original.paidAmount);
                    return (
                        <div className={`font-medium ${balance > 0 ? "text-destructive" : "text-emerald-500"}`}>
                            ₹{balance.toFixed(2)}
                        </div>
                    );
                },
            },
            {
                accessorKey: "status",
                header: "Status",
                cell: ({ row }) => {
                    const status = row.original.status?.toLowerCase() || (row.original.closed ? "paid" : "unpaid");
                    const isPaid = status === "paid" || status === "closed";

                    return (
                        <Badge variant="outline" className="text-muted-foreground px-1.5 gap-1">
                            {isPaid ? (
                                <>
                                    <IconCircleCheckFilled className="size-3 fill-green-500 text-green-500" />
                                    Payment Closed
                                </>
                            ) : (
                                <>
                                    <IconLoader className="size-3 animate-spin" />
                                    Payment Pending
                                </>
                            )}
                        </Badge>
                    )
                },
            }
        ];

        // Non-admin users see their verification status
        if (!isAdmin) {
            baseColumns.push({
                accessorKey: "verificationStatus",
                header: "Verification",
                cell: ({ row }) => {
                    const vStatus = row.original.verificationStatus || (row.original.isVerified ? "Approved" : "Pending");

                    if (vStatus === "Approved") {
                        return (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-2 py-0.5 font-bold uppercase tracking-tighter text-[10px]">
                                Request Approved
                            </Badge>
                        );
                    }
                    if (vStatus === "Rejected") {
                        return (
                            <Badge variant="destructive" className="px-2 py-0.5 font-bold uppercase tracking-tighter text-[10px]">
                                Request Rejected
                            </Badge>
                        );
                    }
                    return (
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 px-2 py-0.5 font-bold uppercase tracking-tighter text-[10px]">
                            Request Pending
                        </Badge>
                    );
                },
            });
        }

        // Add Decline Reason column ONLY for the 'Declined' tab
        if (activeTab === 'declined') {
            baseColumns.push({
                accessorKey: "declineReason",
                header: "Reason",
                cell: ({ row }) => {
                    const sale = row.original;
                    if (!sale.declineReason) return null;

                    return (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewDetails?.(sale)}
                            className="h-7 px-3 text-[9px] font-black uppercase tracking-widest text-destructive border-destructive/20 hover:bg-destructive/5 hover:text-destructive rounded-lg"
                        >
                            View Reason
                        </Button>
                    );
                },
            });
        }

        baseColumns.push({
            id: "actions",
            header: () => <div className="text-right pr-4">Action</div>,
            cell: ({ row }) => {
                const sale = row.original;
                const vStatus = sale.verificationStatus || (sale.isVerified ? "Approved" : "Pending");

                // 1. Specialized logic for Staff Pending Requests
                if (!isAdmin && vStatus === "Pending") {
                    return (
                        <div className="flex justify-end pr-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onViewDetails?.(sale)}
                                className="h-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground"
                            >
                                <IconEye className="size-3.5 mr-1" />
                                View Details
                            </Button>
                        </div>
                    );
                }

                // 2. Hide actions for admin requests tab (handled by SalesRequestTable)
                if (activeTab === 'requests') {
                    return <div className="size-8" />;
                }

                // 2. Specialized actions for Declined items
                if (activeTab === 'declined') {
                    return (
                        <div className="flex items-center justify-end gap-2 px-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDeleteSale?.(sale)}
                                className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                                title="Delete Record"
                            >
                                <IconTrash className="size-4" />
                            </Button>
                        </div>
                    );
                }

                // 3. Standard actions for approved/verified sales
                return (
                    <div className="flex items-center justify-end gap-2">
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
                            <DropdownMenuContent align="end" className="w-40 font-bold">
                                <DropdownMenuItem onClick={() => onViewDetails?.(sale)}>View Details</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onEditSale?.(sale)}>Edit Sale</DropdownMenuItem>
                                <DropdownMenuItem className="text-primary" onClick={() => onDownloadInvoice?.(sale)}>Download Invoice</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            },
        });

        return baseColumns;
    }, [onViewDetails, onEditSale, onDownloadInvoice, onDeleteSale, userRole, activeTab]);


    return (
        <DataTable
            data={data}
            columns={columns}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
            onSearchChange={onSearchChange}
            searchPlaceholder={searchPlaceholder}
            enableReordering={false}
            addLabel={addLabel}
            onAddClick={onAddClick}
        />
    );
}
