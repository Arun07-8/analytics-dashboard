"use client"

import * as React from "react"
import {
    IconCircleCheckFilled,
    IconDotsVertical,
    IconLoader,
    IconCreditCard,
    IconUser,
    IconEye
} from "@tabler/icons-react"
import { z } from "zod"

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
    onEditSale
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
            header: "Date",
            cell: ({ row }) => {
                const date = row.original.createdAt?.toDate ? row.original.createdAt.toDate() : new Date(row.original.createdAt);
                return <div className="text-nowrap">{date.toLocaleDateString()}</div>
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
            header: "Total Amount",
            cell: ({ row }) => (
                <div className="font-medium">
                    ₹{row.original.totalAmount?.toFixed(2)}
                </div>
            ),
        },
        {
            accessorKey: "paidAmount",
            header: "Paid",
            cell: ({ row }) => (
                <div className="font-medium text-muted-foreground">
                    ₹{row.original.paidAmount?.toFixed(2)}
                </div>
            ),
        },
        {
            accessorKey: "excessAmount",
            header: "Balance",
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
                                Closed
                            </>
                        ) : (
                            <>
                                <IconLoader className="size-3 animate-spin" />
                                Pending
                            </>
                        )}
                    </Badge>
                )
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const sale = row.original;
                return (
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => onViewDetails?.(sale)}
                        >
                            <IconEye className="size-4" />
                            <span className="sr-only">View Details</span>
                        </Button>
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
                                <DropdownMenuItem onClick={() => onViewDetails?.(sale)}>View Details</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onEditSale?.(sale)}>Edit Sale</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            },
        },
    ], [onViewDetails, onEditSale]);

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
