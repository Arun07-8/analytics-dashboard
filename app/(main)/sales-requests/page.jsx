'use client';

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { SalesRequestTable } from "@/components/sales/sales-request-table";
import { SaleDetailsModal } from "@/components/sales/sale-details-modal";
import { InvoicePreviewModal } from "@/components/sales/invoice-preview-modal";
import {
    subscribeToSales,
    approveSale,
    declineSale,
    createNotification,
    getAllAdmins,
    getAllCustomers
} from "@/lib/firebase/collections";
import { toast } from "sonner";
import { IconAlertCircle, IconCheck, IconX } from "@tabler/icons-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { downloadInvoice } from "@/lib/invoice-utils";
import { InvoiceTemplate } from "@/components/sales/invoice-template";

export default function SalesRequestsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const isAdmin = user?.role?.trim().toLowerCase() === 'admin';

    const [sales, setSales] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const [selectedSale, setSelectedSale] = useState(null);
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showDeclineDialog, setShowDeclineDialog] = useState(false);

    // Modal states
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState(false);
    const [isInvoiceGenerating, setIsInvoiceGenerating] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (!isAdmin) {
                router.push('/dashboard');
                toast.error("Access denied. Admins only.");
            }
        }
    }, [user, loading, isAdmin, router]);

    useEffect(() => {
        if (!user || !isAdmin) return;

        // Subscribing only to pending sales requests
        const unsubSales = subscribeToSales({ verificationStatus: 'Pending' }, setSales);

        const fetchContext = async () => {
            try {
                const [adminsData, customersData] = await Promise.all([
                    getAllAdmins(),
                    getAllCustomers()
                ]);
                setAdmins(adminsData);
                setCustomers(customersData);
            } catch (error) {
                console.error("Error fetching context:", error);
            }
        };
        fetchContext();

        return () => unsubSales();
    }, [user, isAdmin]);

    const customerMap = useMemo(() => {
        return customers.reduce((acc, curr) => {
            acc[curr.id] = curr.name;
            return acc;
        }, {});
    }, [customers]);

    const staffMap = useMemo(() => {
        return admins.reduce((acc, curr) => {
            acc[curr.id] = curr.name;
            return acc;
        }, {});
    }, [admins]);

    const processedSales = useMemo(() => {
        return sales.map(sale => ({
            ...sale,
            customerName: customerMap[sale.customerId] || "Unknown",
            staffName: staffMap[sale.createdBy] || sale.staffName || "Unknown Staff",
        })).sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
        });
    }, [sales, customerMap]);

    const handleAccept = (sale) => {
        setSelectedSale(sale);
        setShowApproveDialog(true);
    };

    const handleDecline = (sale) => {
        setSelectedSale(sale);
        setShowDeclineDialog(true);
    };

    const confirmApprove = async () => {
        if (!selectedSale) return;
        setIsProcessing(true);
        try {
            await approveSale(selectedSale.id);

            // Notification to staff
            await createNotification({
                userId: selectedSale.createdBy,
                title: "Sale Approved",
                message: "Your sales request has been approved.",
                type: "success",
                actionUrl: "/sales"
            });

            toast.success("Sales request approved");
        } catch (error) {
            toast.error("Approval failed: " + error.message);
        } finally {
            setIsProcessing(false);
            setShowApproveDialog(false);
            setSelectedSale(null);
        }
    };

    const confirmDecline = async () => {
        if (!selectedSale) return;
        setIsProcessing(true);
        try {
            await declineSale(selectedSale.id);

            // Notification to staff
            await createNotification({
                userId: selectedSale.createdBy,
                title: "Sale Declined",
                message: "Your sales request has been declined by the admin.",
                type: "error",
                actionUrl: "/sales"
            });

            toast.info("Sales request declined");
        } catch (error) {
            toast.error("Decline failed: " + error.message);
        } finally {
            setIsProcessing(false);
            setShowDeclineDialog(false);
            setSelectedSale(null);
        }
    };

    const handleView = (sale) => {
        setSelectedSale(sale);
        setIsDetailsModalOpen(true);
    };

    const handleEdit = (sale) => {
        router.push(`/sales/edit/${sale.id}`);
    };

    const handleDownload = (sale) => {
        setSelectedSale(sale);
        setIsInvoicePreviewOpen(true);
    };

    const handleConfirmDownload = async () => {
        if (!selectedSale) return;

        setIsInvoicePreviewOpen(false);
        setIsInvoiceGenerating(true);
        toast.info("Generating invoice PDF...");

        setTimeout(async () => {
            try {
                const success = await downloadInvoice('hidden-invoice-template', `Sale-Request-${selectedSale.salesRefId?.[0] || selectedSale.id}.pdf`);
                if (success) {
                    toast.success("Invoice downloaded successfully");
                } else {
                    toast.error("Failed to generate PDF");
                }
            } catch (error) {
                console.error("Download failed:", error);
                toast.error("Download failed");
            } finally {
                setIsInvoiceGenerating(false);
            }
        }, 500);
    };

    if (loading || !isAdmin) return null;

    return (
        <div className="flex flex-1 flex-col gap-8 py-8 animate-in fade-in duration-700">
            <div className="px-4 lg:px-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] font-mono">
                            Admin Approval Queue
                        </span>
                    </div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight leading-none">
                        Sales <span className="text-primary italic">Requests</span>
                    </h1>
                    <p className="text-xs text-muted-foreground font-medium">
                        Manage and verify staff submissions before they affect revenue.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-card border border-border/50 px-4 py-2 rounded-xl flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                            <IconAlertCircle className="size-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Unverified</p>
                            <p className="text-lg font-black leading-none">{processedSales.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 lg:px-6">
                <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                    <SalesRequestTable
                        data={processedSales}
                        onAccept={handleAccept}
                        onDecline={handleDecline}
                        onView={handleView}
                        onEdit={handleEdit}
                        onDownloadInvoice={handleDownload}
                    />
                </div>
            </div>

            {/* Hidden Template for PDF */}
            {selectedSale && (
                <div className="absolute -top-[10000px] left-0 opacity-0 pointer-events-none z-[-100]">
                    <div id="hidden-invoice-template">
                        <InvoiceTemplate
                            sale={selectedSale}
                            customer={customers.find(c => c.id === selectedSale.customerId)}
                            admins={admins}
                        />
                    </div>
                </div>
            )}

            {/* Approve Dialog */}
            <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                <AlertDialogContent className="rounded-2xl border-border bg-card">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <IconCheck className="size-6" />
                            </div>
                            Confirm Approval
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-medium text-muted-foreground pt-4">
                            You are about to approve this sales request.
                            This will verify the transaction and update company revenue.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 gap-3">
                        <AlertDialogCancel className="rounded-xl font-bold uppercase tracking-widest text-[10px] h-11 border-border">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmApprove}
                            disabled={isProcessing}
                            className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] h-11 px-8"
                        >
                            {isProcessing ? "Processing..." : "Approve Sale"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Decline Dialog */}
            <AlertDialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
                <AlertDialogContent className="rounded-2xl border-border bg-card">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                <IconX className="size-6" />
                            </div>
                            Confirm Decline
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-medium text-muted-foreground pt-4">
                            Are you sure you want to decline this sales request?
                            The request will NOT be added to company revenue and staff will be notified.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 gap-3">
                        <AlertDialogCancel className="rounded-xl font-bold uppercase tracking-widest text-[10px] h-11 border-border">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDecline}
                            disabled={isProcessing}
                            className="rounded-xl bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest text-[10px] h-11 px-8"
                        >
                            {isProcessing ? "Processing..." : "Decline Sale"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* View Details Modal */}
            <SaleDetailsModal
                isOpen={isDetailsModalOpen}
                onOpenChange={setIsDetailsModalOpen}
                sale={selectedSale}
                customer={customers.find(c => c.id === selectedSale?.customerId)}
                onDownloadInvoice={handleDownload}
            />

            {/* Invoice Preview Modal */}
            <InvoicePreviewModal
                isOpen={isInvoicePreviewOpen}
                onClose={() => {
                    setIsInvoicePreviewOpen(false);
                }}
                sale={selectedSale}
                customer={customers.find(c => c.id === selectedSale?.customerId)}
                admins={admins}
                onConfirmDownload={handleConfirmDownload}
            />
        </div>
    );
}
