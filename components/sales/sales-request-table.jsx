"use client"

import * as React from "react"
import {
    IconDotsVertical,
    IconUser,
    IconCheck,
    IconX,
    IconEye,
    IconDownload,
    IconPencil,
    IconTrash
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
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

export function SalesRequestTable({
    data = [],
    onAccept,
    onDecline,
    onView,
    onEdit,
    onDelete,
    onDownloadInvoice
}) {
    const [searchTerm, setSearchTerm] = React.useState("");
    const [deletingSale, setDeletingSale] = React.useState(null);

    const filteredData = React.useMemo(() => {
        return data.filter(item => {
            const query = searchTerm.toLowerCase();
            return (
                (item.customerName || "").toLowerCase().includes(query) ||
                (item.salesRefId?.[0] || "").toLowerCase().includes(query) ||
                (item.staffName || "").toLowerCase().includes(query)
            );
        });
    }, [data, searchTerm]);

    const columns = React.useMemo(() => [
        {
            accessorKey: "salesRefId",
            header: "REF ID",
            cell: ({ row }) => (
                <div className="font-mono font-bold text-[10px] text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10 w-fit">
                    {row.original.salesRefId?.[0] || "N/A"}
                </div>
            ),
        },
        {
            accessorKey: "customerName",
            header: "Customer",
            cell: ({ row }) => (
                <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-sm text-foreground">{row.original.customerName || "Unknown"}</span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">Verified Client</span>
                </div>
            ),
        },
        {
            accessorKey: "product",
            header: "Product Detail",
            cell: ({ row }) => {
                const services = row.original.services || [];
                const productNames = services.map(s => s.name).join(", ");
                return (
                    <div className="text-[11px] font-semibold text-muted-foreground truncate max-w-[180px]" title={productNames}>
                        {productNames || "N/A"}
                    </div>
                );
            }
        },
        {
            accessorKey: "totalAmount",
            header: "Total Amount",
            cell: ({ row }) => (
                <div className="font-extrabold text-sm tracking-tight text-foreground">
                    ₹{row.original.totalAmount?.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}
                </div>
            ),
        },
        {
            accessorKey: "staffName",
            header: "Requested By",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
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
            accessorKey: "createdAt",
            header: "Request Date",
            cell: ({ row }) => {
                const date = row.original.createdAt?.toDate ? row.original.createdAt.toDate() : new Date(row.original.createdAt);
                return (
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-foreground">
                            {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                        <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest">
                            {date.toLocaleDateString('en-IN', { year: 'numeric' })}
                        </span>
                    </div>
                );
            },
        },
        {
            id: "actions",
            header: () => <div className="text-right pr-4">Approvals</div>,
            cell: ({ row }) => {
                return (
                    <div className="flex items-center justify-end gap-2 pr-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all font-bold text-[11px] gap-1.5 rounded-lg"
                            onClick={() => onAccept(row.original)}
                        >
                            <IconCheck className="size-3.5" />
                            Accept
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500 hover:text-white transition-all font-bold text-[11px] gap-1.5 rounded-lg"
                            onClick={() => onDecline(row.original)}
                        >
                            <IconX className="size-3.5" />
                            Decline
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="data-[state=open]:bg-muted text-muted-foreground flex size-8 p-0 rounded-lg"
                                    size="sm">
                                    <IconDotsVertical className="size-4" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 rounded-xl border-border/40 shadow-xl p-1.5">
                                <DropdownMenuItem className="text-xs font-bold gap-2 py-2.5 rounded-lg cursor-pointer" onClick={() => onView(row.original)}>
                                    <IconEye className="size-4 text-primary" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-xs font-bold gap-2 py-2.5 rounded-lg cursor-pointer" onClick={() => onEdit(row.original)}>
                                    <IconPencil className="size-4 text-orange-500" /> Edit Manual
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-xs font-bold gap-2 py-2.5 rounded-lg cursor-pointer" onClick={() => onDownloadInvoice(row.original)}>
                                    <IconDownload className="size-4 text-emerald-500" /> Save Invoice
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-xs font-bold gap-2 py-2.5 rounded-lg cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5" onClick={() => setDeletingSale(row.original)}>
                                    <IconTrash className="size-4" /> Delete Request
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            },
        },
    ], [onAccept, onDecline, onView, onEdit, onDelete, onDownloadInvoice]);

    return (
        <>
            <DataTable
                data={filteredData}
                columns={columns}
                enableReordering={false}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Search sale ID, customer or staff..."
            />

            <AlertDialog open={!!deletingSale} onOpenChange={() => setDeletingSale(null)}>
                <AlertDialogContent className="rounded-2xl border-border bg-card">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold tracking-tight text-destructive">Delete Request</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-medium text-muted-foreground pt-2">
                            Are you sure you want to delete this pending sales request? This will permanently remove it from the system.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 gap-3">
                        <AlertDialogCancel className="rounded-xl font-semibold text-xs h-11 border-border">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (deletingSale) {
                                    onDelete?.(deletingSale);
                                    setDeletingSale(null);
                                }
                            }}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-semibold text-xs h-11 px-6 shadow-lg shadow-destructive/20"
                        >
                            Confirm Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
