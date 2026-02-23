"use client"

import * as React from "react"
import {
    IconDotsVertical,
    IconUser,
    IconCheck,
    IconX,
    IconEye,
    IconDownload,
    IconPencil
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

export function SalesRequestTable({
    data,
    onAccept,
    onDecline,
    onView,
    onEdit,
    onDownloadInvoice
}) {
    const columns = React.useMemo(() => [
        {
            accessorKey: "salesRefId",
            header: "Sale ID",
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
                <div className="flex items-center gap-2">
                    <IconUser className="size-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{row.original.customerName || "Unknown"}</span>
                </div>
            ),
        },
        {
            accessorKey: "product",
            header: "Product",
            cell: ({ row }) => {
                const services = row.original.services || [];
                const productNames = services.map(s => s.name).join(", ");
                return (
                    <div className="text-xs font-semibold truncate max-w-[200px]" title={productNames}>
                        {productNames || "N/A"}
                    </div>
                );
            }
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
            accessorKey: "staffName",
            header: "Staff Name",
            cell: ({ row }) => (
                <div className="text-xs font-semibold">
                    {row.original.staffName || "Staff"}
                </div>
            ),
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
            header: () => <div className="text-right pr-4">Action</div>,
            cell: ({ row }) => {
                return (
                    <div className="flex items-center justify-end gap-2 px-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all font-bold uppercase text-[10px] tracking-widest gap-1"
                            onClick={() => onAccept(row.original)}
                        >
                            <IconCheck className="size-3" />
                            Accept
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500 hover:text-white transition-all font-bold uppercase text-[10px] tracking-widest gap-1"
                            onClick={() => onDecline(row.original)}
                        >
                            <IconX className="size-3" />
                            Decline
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="data-[state=open]:bg-muted text-muted-foreground flex size-8 p-0"
                                    size="sm">
                                    <IconDotsVertical className="size-4" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                <DropdownMenuItem className="text-xs font-bold uppercase tracking-widest gap-2 py-2" onClick={() => onView(row.original)}>
                                    <IconEye className="size-3.5" /> View Sale
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-xs font-bold uppercase tracking-widest gap-2 py-2" onClick={() => onEdit(row.original)}>
                                    <IconPencil className="size-3.5" /> Edit Sale
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-xs font-bold uppercase tracking-widest gap-2 py-2" onClick={() => onDownloadInvoice(row.original)}>
                                    <IconDownload className="size-3.5" /> Download Invoice
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            },
        },
    ], [onAccept, onDecline, onView, onEdit, onDownloadInvoice]);

    return (
        <DataTable
            data={data}
            columns={columns}
            enableReordering={false}
            searchPlaceholder="Search invoice or customer..."
        />
    );
}
