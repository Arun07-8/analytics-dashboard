"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { IconCircleCheckFilled, IconLoader, IconReceipt2 } from "@tabler/icons-react"

export function CustomerOrdersModal({
    isOpen,
    onOpenChange,
    customer,
    orders = [],
    isLoading = false
}) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                            <IconReceipt2 className="size-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Purchase History</DialogTitle>
                            <DialogDescription>
                                Sales records for {customer?.name}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-auto mt-6 rounded-lg border">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <IconLoader className="size-8 animate-spin text-primary" />
                            <p className="text-muted-foreground text-sm">Fetching orders...</p>
                        </div>
                    ) : orders.length > 0 ? (
                        <Table>
                            <TableHeader className="bg-muted/50 sticky top-0">
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Sales Ref</TableHead>
                                    <TableHead>Staff</TableHead>
                                    <TableHead>Services</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-right">Paid</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => {
                                    const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
                                    const isClosed = order.status === "Closed" || order.closed;
                                    const balance = (Number(order.totalAmount) || 0) - (Number(order.paidAmount) || 0);

                                    return (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium whitespace-nowrap">
                                                {date.toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="font-mono text-[10px] text-muted-foreground">
                                                {order.salesRefId?.[0] || order.id.substring(0, 8).toUpperCase()}
                                            </TableCell>
                                            <TableCell className="text-sm font-medium">
                                             {order.staffName || "N/A"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    {order.services?.slice(0, 2).map((s, idx) => (
                                                        <span key={idx} className="text-xs truncate max-w-[150px]">
                                                            {s.name}
                                                        </span>
                                                    ))}
                                                    {order.services?.length > 2 && (
                                                        <span className="text-[10px] text-muted-foreground font-bold">
                                                            + {order.services.length - 2} more items
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold tabular-nums">
                                                ₹{(Number(order.totalAmount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground tabular-nums font-medium">
                                                ₹{(Number(order.paidAmount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className={`text-right font-black tabular-nums ${balance > 0 ? "text-destructive" : "text-emerald-500"}`}>
                                                ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className={`gap-1 font-normal ${isClosed ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/20" : "bg-orange-500/5 text-orange-600 border-orange-500/20"}`}>
                                                    {isClosed ? (
                                                        <>
                                                            <IconCircleCheckFilled className="size-3 fill-emerald-500 text-emerald-500" />
                                                            Paid
                                                        </>
                                                    ) : (
                                                        <>
                                                            <IconLoader className="size-3 animate-spin" />
                                                            Pending
                                                        </>
                                                    )}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-20">
                            <p className="text-muted-foreground">No orders found for this customer.</p>
                        </div>
                    )}
                </div>

                {orders.length > 0 && (
                    <div className="mt-4 pt-4 border-t flex justify-between items-center text-sm font-medium">
                        <span className="text-muted-foreground">Total Sales to Customer:</span>
                        <span className="text-lg font-bold text-primary">
                            ₹{orders.reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
