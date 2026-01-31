"use client"

import * as React from "react"
import {
    IconPencil,
    IconTrash,
    IconCircleCheckFilled,
    IconCircleXFilled,
    IconPackage,
} from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"

export function ServicesTable({
    data,
    onEdit,
    onDelete,
    onAdd,
    searchTerm,
    onSearchChange,
    activeTab,
    onTabChange,
    servicesCount = {}
}) {
    const columns = [
        {
            accessorKey: "name",
            header: "Service Name",
            cell: ({ row }) => <span className="font-semibold text-foreground">{row.original.name}</span>,
        },
        {
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => (
                <div className="max-w-xs truncate text-muted-foreground">
                    {row.original.description || <span className="text-muted-foreground/40 italic">No description</span>}
                </div>
            ),
        },
        {
            accessorKey: "isActive",
            header: "Status",
            cell: ({ row }) => {
                const isActive = row.original.isActive;
                return (
                    <Badge
                        variant="outline"
                        className={`px-2 py-0.5 font-medium ${isActive
                            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800'
                            : 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800'
                            }`}
                    >
                        <div className="flex items-center gap-1.5">
                            {isActive ? <IconCircleCheckFilled className="size-3.5" /> : <IconCircleXFilled className="size-3.5" />}
                            {isActive ? 'Active' : 'Inactive'}
                        </div>
                    </Badge>
                );
            },
        },
        {
            accessorKey: "createdAt",
            header: "Created At",
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground font-medium">
                    {new Date(row.original.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    })}
                </span>
            ),
        },
        {
            id: "actions",
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="flex justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(row.original)}
                        className="size-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                    >
                        <IconPencil className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(row.original.id)}
                        className="size-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                        <IconTrash className="size-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const tabs = [
        { label: "All Services", value: "all" },
        { label: "Active", value: "active", badge: servicesCount.active },
        { label: "Inactive", value: "inactive", badge: servicesCount.inactive },
    ];

    return (
        <DataTable
            data={data}
            columns={columns}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
            onAddClick={onAdd}
            addLabel="Add Service"
            searchPlaceholder="Search services..."
            onSearchChange={onSearchChange}
        />
    );
}
