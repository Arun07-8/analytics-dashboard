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
    IconTrash,
    IconPencil,
    IconDownload
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
    const [deletingSale, setDeletingSale] = React.useState(null);

    const columns = React.useMemo(() => {
        const isAdmin = userRole?.trim().toLowerCase() === 'admin';

        const baseColumns = [
            {
                accessorKey: "salesRefId",
                header: "Invoice ID",
                cell: ({ row }) => {
                    const refId = Array.isArray(row.original.salesRefId)
                        ? row.original.salesRefId[0]
                        : row.original.salesRefId;

                    return (
                        <div className="font-mono font-bold text-[10px] text-primary">
                            {refId || "N/A"}
                        </div>
                    );
                },
            },
            {
                accessorKey: "createdAt",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        className="p-0 hover:bg-transparent -ml-2 hidden md:flex"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Date
                        <IconChevronDown className={cn("ml-2 h-4 w-4 transition-transform", column.getIsSorted() === "asc" && "rotate-180")} />
                    </Button>
                ),
                cell: ({ row }) => {
                    const date = row.original.createdAt?.toDate ? row.original.createdAt.toDate() : new Date(row.original.createdAt);
                    return (
                        <div className="flex flex-col hidden md:flex">
                            <span className="text-[11px] font-bold text-foreground">
                                {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </span>
                            <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest leading-none">
                                {date.toLocaleDateString('en-IN', { year: 'numeric' })}
                            </span>
                        </div>
                    );
                },
            },
            {
                accessorKey: "customerName",
                header: "Customer",
                cell: ({ row }) => (
                    <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-sm text-foreground">{row.original.customerName || "Unknown"}</span>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">Client Registry</span>
                    </div>
                ),
            },
            {
                accessorKey: "staffName",
                header: () => <div className="hidden lg:block">Staff</div>,
                cell: ({ row }) => (
                    <div className="flex items-center gap-2 hidden lg:flex">
                        <div className="size-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase">
                            {(row.original.staffName || "S")[0]}
                        </div>
                        <span className="text-xs font-bold text-muted-foreground/80">
                            {row.original.staffName || "Staff"}
                        </span>
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
                    <div className="font-bold text-sm tracking-tight text-foreground">
                        ₹{row.original.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                ),
            },
            {
                accessorKey: "paidAmount",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        className="p-0 hover:bg-transparent -ml-2 hidden sm:flex"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Paid
                        <IconChevronDown className={cn("ml-2 h-4 w-4 transition-transform", column.getIsSorted() === "asc" && "rotate-180")} />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div className="font-bold text-sm tracking-tight text-muted-foreground/80 hidden sm:block">
                        ₹{row.original.paidAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                header: () => <div className="hidden md:block">Status</div>,
                cell: ({ row }) => {
                    const status = row.original.status?.toLowerCase() || (row.original.closed ? "paid" : "unpaid");
                    const isPaid = status === "paid" || status === "closed";

                    return (
                        <Badge variant="outline" className="text-muted-foreground px-1.5 gap-1 hidden md:flex w-fit">
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
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-2 py-0.5 font-semibold text-[10px]">
                                Request Approved
                            </Badge>
                        );
                    }
                    if (vStatus === "Rejected") {
                        return (
                            <Badge variant="destructive" className="px-2 py-0.5 font-semibold text-[10px]">
                                Request Rejected
                            </Badge>
                        );
                    }
                    return (
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 px-2 py-0.5 font-semibold text-[10px]">
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
                            className="h-7 px-3 text-[10px] font-semibold text-destructive border-destructive/20 hover:bg-destructive/5 hover:text-destructive rounded-lg"
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
                        <div className="flex items-center justify-end gap-2 pr-2">
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
                                <DropdownMenuContent align="end" className="w-[160px] font-semibold text-xs">
                                    <DropdownMenuItem onClick={() => onViewDetails?.(sale)} className="gap-2">
                                        <IconEye className="size-3.5 text-muted-foreground" />
                                        View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onEditSale?.(sale)} className="gap-2">
                                        <IconPencil className="size-3.5 text-muted-foreground" />
                                        Edit Request
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive font-bold gap-2"
                                        onClick={() => setDeletingSale(sale)}
                                    >
                                        <IconTrash className="size-3.5" />
                                        Delete Request
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
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
                                onClick={() => setDeletingSale(sale)}
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
                            <DropdownMenuContent align="end" className="w-[160px] font-semibold text-xs">
                                <DropdownMenuItem onClick={() => onViewDetails?.(sale)} className="gap-2">
                                    <IconEye className="size-3.5 text-muted-foreground" />
                                    View Details
                                </DropdownMenuItem>
                                {isAdmin && (
                                    <DropdownMenuItem onClick={() => onEditSale?.(sale)} className="gap-2">
                                        <IconPencil className="size-3.5 text-muted-foreground" />
                                        Edit Sale
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem className="text-primary gap-2" onClick={() => onDownloadInvoice?.(sale)}>
                                    <IconDownload className="size-3.5" />
                                    Download Invoice
                                </DropdownMenuItem>
                                {isAdmin && (
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive font-bold gap-2"
                                        onClick={() => setDeletingSale(sale)}
                                    >
                                        <IconTrash className="size-3.5" />
                                        Delete
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            },
        });

        return baseColumns;
    }, [onViewDetails, onEditSale, onDownloadInvoice, onDeleteSale, userRole, activeTab]);


    return (
        <>
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

            <AlertDialog open={!!deletingSale} onOpenChange={() => setDeletingSale(null)}>
                <AlertDialogContent className="rounded-2xl border-border bg-card">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold tracking-tight">Confirm Deletion</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-medium text-muted-foreground pt-2">
                            Are you sure you want to remove this sale record? This action cannot be undone and will permanently delete the transaction data from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 gap-3">
                        <AlertDialogCancel className="rounded-xl font-semibold text-xs h-11 border-border">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (deletingSale) {
                                    onDeleteSale?.(deletingSale);
                                    setDeletingSale(null);
                                }
                            }}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-semibold text-xs h-11 px-6"
                        >
                            Delete Record
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
