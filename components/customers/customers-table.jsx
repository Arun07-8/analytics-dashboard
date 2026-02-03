"use client"

import * as React from "react"
import {
    IconDotsVertical,
    IconUser,
    IconPhone,
    IconMail,
    IconEye
} from "@tabler/icons-react"
import { z } from "zod"

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
    name: z.string(),
    mobile: z.string(),
    email: z.string().optional(),
    place: z.string().optional(),
    createdAt: z.any(),
})

export function CustomersTable({
    data,
    onViewOrders,
    onAddClick,
    addLabel = "Add Customer",
    onSearchChange,
    searchPlaceholder = "Search customers...",
    tabs = [],
    activeTab,
    onTabChange
}) {
    const columns = [
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
            accessorKey: "name",
            header: "Customer Name",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <IconUser className="size-4 text-muted-foreground" />
                    <span className="font-medium">{row.original.name}</span>
                </div>
            ),
        },
        {
            accessorKey: "mobile",
            header: "Mobile",
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <IconPhone className="size-3.5" />
                    <span>{row.original.mobile}</span>
                </div>
            ),
        },
        {
            accessorKey: "email",
            header: "Email",
            cell: ({ row }) => (
                row.original.email ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <IconMail className="size-3.5" />
                        <span>{row.original.email}</span>
                    </div>
                ) : <span className="text-muted-foreground/40 italic">N/A</span>
            ),
        },
        {
            accessorKey: "place",
            header: "Location",
            cell: ({ row }) => <span className="text-muted-foreground">{row.original.place || row.original.city || "N/A"}</span>,
        },
        {
            accessorKey: "createdAt",
            header: "Joined Date",
            cell: ({ row }) => {
                const date = row.original.createdAt?.toDate ? row.original.createdAt.toDate() : new Date(row.original.createdAt);
                return <div className="text-muted-foreground text-sm">{date.toLocaleDateString()}</div>
            },
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => onViewOrders(row.original)}
                    >
                        <IconEye className="size-4" />
                        <span className="sr-only">View Orders</span>
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
                            <DropdownMenuItem onClick={() => onViewOrders(row.original)}>View Orders</DropdownMenuItem>
                            <DropdownMenuItem>Edit Profile</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ]

    return (
        <DataTable
            data={data}
            columns={columns}
            enableReordering={false}
            addLabel={addLabel}
            onAddClick={onAddClick}
            onSearchChange={onSearchChange}
            searchPlaceholder={searchPlaceholder}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
        />
    )
}
