"use client"

import * as React from "react"
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { IconEdit, IconTrash, IconChevronLeft, IconChevronRight, IconSearch } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export function ExpensesTable({ data, onEdit, onDelete, staffMap = {} }) {
    const [sorting, setSorting] = React.useState([])
    const [columnFilters, setColumnFilters] = React.useState([])

    const columns = React.useMemo(() => [
        {
            accessorKey: "title",
            header: "Title",
            cell: ({ row }) => <div className="text-base font-bold text-foreground">{row.getValue("title")}</div>,
        },
        {
            accessorKey: "amount",
            header: "Amount",
            cell: ({ row }) => (
                <div className="text-base font-black text-destructive">₹{row.getValue("amount").toLocaleString()}</div>
            ),
        },
        {
            accessorKey: "date",
            header: "Date",
            cell: ({ row }) => {
                const date = new Date(row.getValue("date"));
                return <div className="text-sm text-foreground/90 font-bold">{date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>;
            },
        },
        {
            accessorKey: "remarks",
            header: "Remarks",
            cell: ({ row }) => (
                <div className="max-w-[200px] truncate text-sm text-foreground/80 font-medium italic">
                    {row.getValue("remarks") || "---"}
                </div>
            ),
        },
        {
            id: "actions",
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => onEdit(row.original)}>
                        <IconEdit size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(row.original.id)}>
                        <IconTrash size={16} />
                    </Button>
                </div>
            ),
        },
    ], [onEdit, onDelete])

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
        },
    })

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="relative w-full max-w-sm">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Search expenses..."
                        value={(table.getColumn("title")?.getFilterValue()) ?? ""}
                        onChange={(event) =>
                            table.getColumn("title")?.setFilterValue(event.target.value)
                        }
                        className="pl-9 bg-muted/50 border-none shadow-none focus-visible:ring-1 ring-primary/20 h-10 font-medium"
                    />
                </div>
            </div>
            <div className="rounded-2xl border border-border/50 overflow-hidden bg-card/50">
                <Table>
                    <TableHeader className="bg-muted/30">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="text-[11px] font-black uppercase tracking-widest h-11">
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} className="hover:bg-muted/30 border-border/30">
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-4">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground font-bold">
                                    No expenses recorded.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-between px-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </p>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="size-8 rounded-lg border-border/50"
                    >
                        <IconChevronLeft size={16} />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="size-8 rounded-lg border-border/50"
                    >
                        <IconChevronRight size={16} />
                    </Button>
                </div>
            </div>
        </div>
    )
}
