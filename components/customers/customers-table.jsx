"use client"

import * as React from "react"
import {
    IconDotsVertical,
    IconUser,
    IconPhone,
    IconMail,
    IconEye,
    IconTrash,
    IconPencil
} from "@tabler/icons-react"
import { z } from "zod"

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
    onTabChange,
    onDeleteCustomer,
    onEditCustomer
}) {
    const [deletingCustomer, setDeletingCustomer] = React.useState(null);

    const columns = [

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
                return <div className="text-muted-foreground text-sm">{date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}</div>
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
                        <DropdownMenuContent align="end" className="w-[160px] font-semibold text-xs">
                            <DropdownMenuItem onClick={() => onViewOrders(row.original)} className="gap-2">
                                <IconEye className="size-3.5 text-muted-foreground" />
                                View Orders
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEditCustomer?.(row.original)} className="gap-2">
                                <IconPencil className="size-3.5 text-muted-foreground" />
                                Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setDeletingCustomer(row.original)}
                                className="text-destructive focus:text-destructive font-bold gap-2"
                            >
                                <IconTrash className="size-3.5 focus:text-destructive" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ]

    return (
        <>
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

            <AlertDialog open={!!deletingCustomer} onOpenChange={() => setDeletingCustomer(null)}>
                <AlertDialogContent className="rounded-2xl border-border bg-card text-foreground">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold tracking-tight">Remove Customer?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-medium text-muted-foreground pt-2">
                            Are you sure you want to remove <span className="text-foreground font-bold">{deletingCustomer?.name}</span>? This will archive the customer record and hide them from the registry. Past sales history will be preserved.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 gap-3">
                        <AlertDialogCancel className="rounded-xl font-semibold text-xs h-11 border-border">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (deletingCustomer) {
                                    onDeleteCustomer?.(deletingCustomer);
                                    setDeletingCustomer(null);
                                }
                            }}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-semibold text-xs h-11 px-6"
                        >
                            Delete Customer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
