"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconLayoutColumns,
  IconPlus,
} from "@tabler/icons-react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

// Generic Draggable Row component
function DraggableRow({
  row
}) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}>
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id} className="mobile-card-row py-3 px-4 sm:py-4 sm:px-3 md:px-6 w-full sm:w-auto overflow-hidden">
          <span className="mobile-label-view sm:hidden font-extrabold text-[10px] uppercase tracking-widest text-muted-foreground mr-2 sm:mr-4 text-left whitespace-nowrap flex items-center flex-shrink-0 w-[110px] sm:w-[140px]">
            {(() => {
              const header = cell.getContext().table.getFlatHeaders().find(h => h.column.id === cell.column.id);
              if (!header) return null;
              return flexRender(header.column.columnDef.header, header.getContext());
            })()}
          </span>
          <div className="text-right sm:text-left flex-1 flex justify-end sm:block overflow-hidden relative z-10">
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </div>
        </TableCell>
      ))}
    </TableRow>
  );
}

export function DataTable({
  data: initialData,
  columns,
  tabs = [],
  onAddClick,
  addLabel = "Add",
  searchPlaceholder = "Search...",
  onSearchChange,
  activeTab,
  onTabChange,
  enableReordering = false,
  rowIdField = "id",
  tableMeta,
  columnVisibility: externalColumnVisibility,
  onColumnVisibilityChange: externalOnColumnVisibilityChange,
  showColumnsButton = true,
  initialPageSize = 10,
  children,
  leftContent,
}) {
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [internalColumnVisibility, setInternalColumnVisibility] = React.useState({})

  const columnVisibility = externalColumnVisibility !== undefined ? externalColumnVisibility : internalColumnVisibility
  const setColumnVisibility = externalOnColumnVisibilityChange !== undefined ? externalOnColumnVisibilityChange : setInternalColumnVisibility
  const [columnFilters, setColumnFilters] = React.useState([])
  const [sorting, setSorting] = React.useState([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  })

  // Update internal data when initialData changes
  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo(() => data?.map((item) => item[rowIdField]) || [], [data, rowIdField])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    meta: tableMeta,
    getRowId: (row) => row[rowIdField].toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event) {
    if (!enableReordering) return;
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex);
      })
    }
  }

  const currentTab = activeTab || tabs[0]?.value || "all";

  return (
    <Tabs value={currentTab} onValueChange={onTabChange} className="w-full flex flex-col gap-6">
      <div className="flex flex-col @4xl/main:flex-row @4xl/main:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {tabs.length > 0 && (
            <div className="overflow-x-auto max-w-full no-scrollbar pb-1">
              <div className="inline-flex items-center p-1 bg-muted/40 rounded-xl border border-border/40 w-fit">
                {tabs.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => onTabChange?.(tab.value)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap",
                      currentTab === tab.value
                        ? "bg-card text-foreground shadow-sm ring-1 ring-border/10"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab.label}
                    {tab.badge > 0 && (
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded-full text-[10px] tracking-tight",
                          currentTab === tab.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted-foreground/20 text-muted-foreground"
                        )}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
          {leftContent}
        </div>

        <div className="flex items-center gap-3 ml-auto w-full @4xl/main:w-auto">
          {onSearchChange && (
            <div className="relative flex-1 @4xl/main:w-72">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
              </div>
              <Input
                placeholder={searchPlaceholder}
                onChange={(e) => onSearchChange(e.target.value)}
                className="h-10 w-full bg-card border-border/60 pl-10 text-xs font-semibold rounded-xl focus:ring-1 focus:ring-primary/20 transition-all shadow-sm"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            {showColumnsButton && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10 text-xs font-bold gap-2 px-4 border-border/60 rounded-xl bg-card hover:bg-muted/30 shadow-sm transition-all text-muted-foreground">
                    <IconLayoutColumns className="size-4" />
                    <span className="hidden @xl/main:inline capitalize">Columns</span>
                    <IconChevronDown className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl border-border/40 shadow-2xl p-1.5">
                  {table
                    .getAllColumns()
                    .filter((column) =>
                      typeof column.accessorFn !== "undefined" &&
                      column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize text-xs font-semibold py-2 rounded-lg"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }>
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      <TabsContent
        value={currentTab}
        className="relative flex flex-col gap-6 p-0 outline-none">

        {/* Mobile ONLY Styles to guarantee desktop remains absolutely untouched */}
        <style dangerouslySetInnerHTML={{
          __html: `
          @media (max-width: 639px) {
            /* Unhide all missing data in mobile cards */
            .mobile-card-row .hidden {
              display: flex !important;
            }
            .mobile-card-row .md\\:block, 
            .mobile-card-row .lg\\:block {
              display: flex !important;
              align-items: center;
              flex-wrap: wrap;
            }
            .mobile-card-row .lg\\:flex, 
            .mobile-card-row .md\\:flex {
              display: flex !important;
            }
            
            /* Clean up the mapped mobile header label (strip icons and buttons) */
            .mobile-label-view button,
            .mobile-label-view .hover\\:bg-transparent {
              pointer-events: none !important;
              background: transparent !important;
              padding: 0 !important;
              height: auto !important;
              font-weight: 800 !important;
              text-transform: uppercase !important;
              font-size: 10px !important;
              color: inherit !important;
            }
            .mobile-label-view svg {
              display: none !important;
            }
            
            /* Make pagination rows per page visible & structured */
            .mobile-pagination {
              flex-direction: column !important;
              gap: 16px !important;
              margin-top: 8px !important;
              width: 100% !important;
            }
            .mobile-pagination > .hidden,
            .mobile-pagination > .lg\\:flex {
              display: flex !important;
              width: 100% !important;
              justify-content: space-between !important;
            }
            .mobile-pagination .ml-auto {
              width: 100% !important;
              justify-content: space-between !important;
              margin: 0 !important;
            }
          }
        `}} />

        <div className="overflow-x-auto no-scrollbar rounded-2xl border border-border/50 bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_1px_2px_0_rgba(0,0,0,0.04)]">
          {enableReordering ? (
            <DndContext
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
              sensors={sensors}
              id={sortableId}>
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10 border-b border-border">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="hover:bg-transparent border-0">
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="h-11 text-[11px] font-extrabold text-foreground uppercase tracking-widest px-3 md:px-6" colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="**:data-[slot=table-cell]:first:w-8">
                  {table.getRowModel().rows?.length ? (
                    <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                      {table.getRowModel().rows.map((row) => (
                        <DraggableRow key={row.id} row={row} />
                      ))}
                    </SortableContext>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground font-medium text-sm">
                        No results found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </DndContext>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10 border-b border-border">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent border-0">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="h-11 text-[11px] font-extrabold text-foreground uppercase tracking-widest px-3 md:px-6" colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="group border-border/40 hover:bg-muted/20">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="mobile-card-row py-3 px-4 sm:py-4 sm:px-3 md:px-6 w-full sm:w-auto overflow-hidden">
                          <span className="mobile-label-view sm:hidden font-extrabold text-[10px] uppercase tracking-widest text-muted-foreground mr-2 sm:mr-4 text-left whitespace-nowrap flex items-center flex-shrink-0 w-[110px] sm:w-[140px]">
                            {(() => {
                              const header = cell.getContext().table.getFlatHeaders().find(h => h.column.id === cell.column.id);
                              if (!header) return null;
                              return flexRender(header.column.columnDef.header, header.getContext());
                            })()}
                          </span>
                          <div className="text-right sm:text-left flex-1 flex justify-end sm:block overflow-hidden relative z-10">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground font-medium text-sm">
                      No results found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="mobile-pagination flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}>
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}>
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}>
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}>
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}>
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
