"use client"

import * as React from "react"
import { IconEdit, IconTrash } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"

export function ExpensesTable({ data = [], onEdit, onDelete, staffMap = {} }) {
    const [searchTerm, setSearchTerm] = React.useState("");

    const filteredData = React.useMemo(() => {
        return data.filter(item => {
            const query = searchTerm.toLowerCase();
            return (
                (item.title || "").toLowerCase().includes(query) ||
                (item.remarks || "").toLowerCase().includes(query)
            );
        });
    }, [data, searchTerm]);

    const columns = React.useMemo(() => [
        {
            accessorKey: "title",
            header: "Expense Title",
            cell: ({ row }) => (
                <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-sm text-foreground">{row.getValue("title")}</span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">Business Expense</span>
                </div>
            ),
        },
        {
            accessorKey: "amount",
            header: "Total Value",
            cell: ({ row }) => (
                <div className="font-extrabold text-sm tracking-tight text-destructive">
                    ₹{row.getValue("amount").toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
            ),
        },
        {
            accessorKey: "date",
            header: "Record Date",
            cell: ({ row }) => {
                const date = new Date(row.getValue("date"));
                return (
                    <div className="flex flex-col">
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
            accessorKey: "remarks",
            header: "Description / Remarks",
            cell: ({ row }) => (
                <div className="max-w-[250px] truncate text-xs text-muted-foreground font-medium italic">
                    {row.getValue("remarks") || "---"}
                </div>
            ),
        },
        {
            id: "actions",
            header: () => <div className="text-right pr-4">Actions</div>,
            cell: ({ row }) => (
                <div className="flex justify-end gap-2 pr-2">
                    <Button variant="ghost" size="icon" className="size-8 rounded-lg text-primary hover:bg-primary/10 transition-colors" onClick={() => onEdit(row.original)}>
                        <IconEdit size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8 rounded-lg text-destructive hover:bg-destructive/10 transition-colors" onClick={() => onDelete(row.original.id)}>
                        <IconTrash size={16} />
                    </Button>
                </div>
            ),
        },
    ], [onEdit, onDelete])

    return (
        <DataTable
            data={filteredData}
            columns={columns}
            enableReordering={false}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search title or remarks..."
        />
    )
}
