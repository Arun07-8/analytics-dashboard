"use client"

import * as React from "react"
import {
    IconCircleCheckFilled,
    IconDotsVertical,
    IconLoader,
    IconCreditCard,
    IconUser,
    IconEye,
    IconChevronDown
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
    onDownloadInvoice
}) {
    const columns = React.useMemo(() => [
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
                const status = row.original.status || (row.original.closed ? "Closed" : "Pending");
                const isClosed = status === "Closed";

                return (
                    <Badge variant="outline" className="text-muted-foreground px-1.5 gap-1">
                        {isClosed ? (
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
        },
        {
            id: "actions",
            header: () => <div className="text-right pr-4">Action</div>,
            cell: ({ row }) => {
                const sale = row.original;
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
        },
    ], [onViewDetails, onEditSale, onDownloadInvoice]);


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
