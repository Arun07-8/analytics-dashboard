"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    IconReceipt2,
    IconUser,
    IconCalendarEvent,
    IconUserCheck,
    IconCircleCheckFilled,
    IconLoader,
    IconCurrencyRupee,
    IconMapPin,
    IconDeviceMobile,
    IconMail,
    IconDownload,
    IconX
} from "@tabler/icons-react"

export function SaleDetailsModal({
    isOpen,
    onOpenChange,
    sale,
    customer,
    onDownloadInvoice
}) {

    if (!sale) return null;

    const date = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt);
    const balance = (Number(sale.totalAmount) || 0) - (Number(sale.paidAmount) || 0);
    const isClosed = sale.status === "Closed" || sale.closed;
    const isRejected = sale.verificationStatus === "Rejected";

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-none rounded-3xl overflow-hidden shadow-2xl">
                {/* Fixed Close Button - HIGH VISIBILITY */}
                <div className="absolute right-6 top-6 z-[100]">
                    <DialogClose asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-full bg-white shadow-xl border border-border/50 text-black hover:bg-slate-100 hover:scale-110 active:scale-95 transition-all duration-200"
                        >
                            <IconX className="h-5 w-5 stroke-[2.5]" />
                            <span className="sr-only">Close</span>
                        </Button>
                    </DialogClose>
                </div>

                {/* Modern Header Section */}
                <div className="bg-foreground text-background p-8 relative overflow-hidden">
                    {!isRejected && (
                        <div className="absolute right-8 top-8 z-20">
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-background/10 border-background/20 text-background hover:bg-background/20 hover:text-background font-black uppercase text-[10px] tracking-widest gap-2 h-9 px-4 rounded-xl backdrop-blur-md"
                                onClick={() => onDownloadInvoice?.(sale)}
                            >
                                <IconDownload className="h-4 w-4" />
                                Download Invoice
                            </Button>
                        </div>
                    )}
                    <div className="absolute right-0 top-0 p-8 opacity-10 -mr-12 -mt-12">
                        <IconReceipt2 className="h-48 w-48" />
                    </div>
                    <div className="relative z-10">
                        <DialogHeader className="space-y-1">
                            <div className="flex items-center gap-2 opacity-60 mb-2">
                                <IconReceipt2 className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Transaction Receipt</span>
                            </div>
                            <DialogTitle className="text-3xl font-black tracking-tighter">
                                {sale.salesRefId?.[0] || sale.id.substring(0, 12).toUpperCase()}
                            </DialogTitle>
                            <DialogDescription className="text-background/60 font-medium">
                                Processed on {date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                </div>

                <div className="p-8 space-y-10 bg-background">
                    {/* CRITICAL DECLINE BANNER */}
                    {/* CLEAR DECLINE BANNER */}
                    {sale.verificationStatus === "Rejected" && sale.declineReason && (
                        <div className="bg-red-50 border border-red-100 rounded-[2rem] p-1 mb-8 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700 shadow-md">
                            <div className="bg-red-600 px-8 py-3.5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center">
                                        <IconX className="h-4 w-4 text-white stroke-[3]" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Official Rejection Notice</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Action Required</span>
                                </div>
                            </div>

                            <div className="p-6 bg-white">
                                <div className="relative">
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-600 rounded-full" />
                                    <div className="pl-6">
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Message from Administrator</p>
                                        <h2 className="text-xl font-black text-red-600 tracking-tight leading-snug italic">
                                            "{sale.declineReason}"
                                        </h2>
                                        <div className="mt-4 flex items-center gap-4">
                                            <div className="h-[1px] flex-1 bg-red-50" />
                                            <p className="text-[9px] font-bold text-red-600/40 uppercase tracking-[0.3em]">Ref: {sale.salesRefId?.[0] || "SALE_OBJ"}</p>
                                            <div className="h-[1px] flex-1 bg-red-50" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Top Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Customer Info */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                <IconUser className="h-3 w-3" />
                                <span>Customer Profile</span>
                            </div>
                            <div className="bg-muted/50 p-6 rounded-2xl border border-border/50">
                                <h4 className="font-black text-xl mb-3">{customer?.name || sale.customerName}</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <IconDeviceMobile className="h-4 w-4 opacity-50" />
                                        <span className="font-medium tracking-tight">{customer?.mobile || "N/A"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <IconMail className="h-4 w-4 opacity-50" />
                                        <span className="font-medium truncate">{customer?.email || "N/A"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <IconMapPin className="h-4 w-4 opacity-50" />
                                        <span className="font-medium">{customer?.place || customer?.city || "Address not specified"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Status & Staff */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                <IconUserCheck className="h-3 w-3" />
                                <span>Transaction Audit</span>
                            </div>
                            <div className="bg-muted/50 p-6 rounded-2xl border border-border/50 flex flex-col justify-between h-[calc(100%-24px)]">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Status</p>
                                        <Badge variant="outline" className={`gap-1.5 font-bold py-1 px-3 ${isClosed ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/20" : "bg-orange-500/5 text-orange-600 border-orange-500/20"}`}>
                                            {isClosed ? (
                                                <><IconCircleCheckFilled className="size-3.5" /> Settled</>
                                            ) : (
                                                <><IconLoader className="size-3.5 animate-spin" /> Pending</>
                                            )}
                                        </Badge>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Staff Member</p>
                                        <p className="font-bold text-sm">{sale.staffName}</p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-border/50">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Timestamp</span>
                                        <span className="text-xs font-mono font-bold tracking-tighter">
                                            {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Services Ledger */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            <IconReceipt2 className="h-3 w-3" />
                            <span>Service Ledger</span>
                        </div>
                        <div className="rounded-2xl border border-border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="py-4 px-6 text-[10px] font-black uppercase tracking-widest">Description</TableHead>
                                        <TableHead className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-widest">Rate</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sale.services?.map((service, index) => (
                                        <TableRow key={index} className="hover:bg-transparent border-b border-border/50 last:border-0">
                                            <TableCell className="py-5 px-6 font-bold text-foreground">
                                                {service.name}
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 font-mono">{service.serviceId.substring(0, 8).toUpperCase()}</p>
                                            </TableCell>
                                            <TableCell className="text-right py-5 px-6 font-black tabular-nums">
                                                ₹{(Number(service.price) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="bg-muted/30 p-8 rounded-3xl space-y-4 border border-border/50">
                        <div className="flex justify-between text-muted-foreground">
                            <span className="text-[10px] font-black uppercase tracking-widest">Subtotal Amount</span>
                            <span className="font-bold tabular-nums italic">₹{(Number(sale.totalAmount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-emerald-600">
                            <span className="text-[10px] font-black uppercase tracking-widest">Payment Received</span>
                            <span className="font-bold tabular-nums italic">₹{(Number(sale.paidAmount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <Separator className="bg-border" />
                        <div className="flex justify-between items-center pt-2">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Financial Balance</span>
                                <Badge variant="secondary" className={`text-[9px] font-black uppercase tracking-widest w-fit rounded-full px-2 py-0 ${balance > 0 ? "text-destructive bg-destructive/5" : "text-emerald-500 bg-emerald-500/5"}`}>
                                    {balance > 0 ? "Debit Balance" : "Account Cleared"}
                                </Badge>
                            </div>
                            <div className={`text-3xl font-black tracking-tighter tabular-nums ${balance > 0 ? "text-destructive" : "text-emerald-500"}`}>
                                ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
