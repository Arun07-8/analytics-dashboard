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
    deleteSale,
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
    const [loadingData, setLoadingData] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    const [selectedSale, setSelectedSale] = useState(null);
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showDeclineDialog, setShowDeclineDialog] = useState(false);
    const [declineReason, setDeclineReason] = useState("");

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
        const unsubSales = subscribeToSales({ verificationStatus: 'Pending' }, (data) => {
            setSales(data);
            setLoadingData(false);
        });

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
        setDeclineReason("");
        setShowDeclineDialog(true);
    };

    const confirmApprove = async () => {
        if (!selectedSale) return;
        setIsProcessing(true);

        const currentTime = new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        const currentDate = new Date().toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        try {
            await approveSale(selectedSale.id);

            // Notification to staff
            await createNotification({
                userId: selectedSale.createdBy,
                title: "Sales Request Approved",
                message: `Your sales request (Amount: ₹${selectedSale.totalAmount.toLocaleString('en-IN')}) has been Accepted on ${currentDate} at ${currentTime}.`,
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

        if (!declineReason.trim()) {
            toast.error("Please enter a reason for declining");
            return;
        }

        const currentTime = new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        const currentDate = new Date().toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        setIsProcessing(true);
        try {
            await declineSale(selectedSale.id, declineReason);

            // Notification to staff
            await createNotification({
                userId: selectedSale.createdBy,
                title: "Sales Request Rejected",
                message: `Your sales request has been Rejected on ${currentDate} at ${currentTime}. Reason: ${declineReason}`,
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
            setDeclineReason("");
        }
    };

    const handleView = (sale) => {
        setSelectedSale(sale);
        setIsDetailsModalOpen(true);
    };

    const handleEdit = (sale) => {
        router.push(`/sales/edit/${sale.id}`);
    };

    const handleDelete = async (sale) => {
        try {
            await deleteSale(sale.id);
            toast.success("Record removed successfully");
        } catch (error) {
            toast.error("Failed to remove record");
            console.error(error);
        }
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
                const customerName = selectedSale.customerName || customers.find(c => c.id === selectedSale.customerId)?.name || 'Customer';
                const success = await downloadInvoice('hidden-invoice-template', `${customerName}'s Invoice.pdf`);
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

    if (loading || loadingData || !isAdmin) {
        return (
            <div className="flex items-center justify-center h-screen bg-background text-foreground">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-xs font-medium animate-pulse uppercase tracking-widest text-muted-foreground font-bold">Loading Admin Verification Data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full transition-all duration-700 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-border/40">
                <div className="space-y-1 md:space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                        </div>
                        <span className="text-[10px] md:text-[11px] font-bold text-muted-foreground uppercase tracking-widest font-mono">
                            Admin Approval Queue
                        </span>
                    </div>
                    <h1 className="text-[22px] md:text-4xl font-bold tracking-tight leading-none bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Sales Requests
                    </h1>
                    <p className="text-xs md:text-sm text-muted-foreground font-medium flex items-center gap-2">
                        Manage and verify staff submissions before they affect revenue.
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="bg-card border border-border/50 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm w-full sm:w-auto">
                        <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                            <IconAlertCircle className="size-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] md:text-[11px] font-semibold text-muted-foreground leading-none mb-1">Unverified Requests</p>
                            <p className="text-base md:text-lg font-bold leading-none">{processedSales.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-4">
                <SalesRequestTable
                    data={processedSales}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDownloadInvoice={handleDownload}
                />
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
                <AlertDialogContent className="w-[95vw] sm:w-full max-w-md rounded-2xl border-border bg-card p-4 sm:p-6 mx-auto overflow-hidden">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg sm:text-xl font-bold tracking-tight flex items-center gap-3">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <IconCheck className="size-5 sm:size-6" />
                            </div>
                            Confirm Approval
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs sm:text-sm font-medium text-muted-foreground pt-3 sm:pt-4">
                            You are about to approve this sales request.
                            This will verify the transaction and update company revenue.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <AlertDialogCancel className="w-full sm:w-auto rounded-xl font-semibold text-xs h-11 border-border mt-0 bg-background hover:bg-muted">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmApprove}
                            disabled={isProcessing}
                            className="w-full sm:w-auto rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs h-11 px-8"
                        >
                            {isProcessing ? "Processing..." : "Approve Sale"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Decline Dialog */}
            <AlertDialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
                <AlertDialogContent className="w-[95vw] sm:w-full max-w-md rounded-2xl border-border bg-card p-4 sm:p-6 mx-auto overflow-hidden">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg sm:text-xl font-bold tracking-tight flex items-center gap-3 text-red-500">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 rounded-full bg-red-500/10 flex items-center justify-center">
                                <IconX className="size-5 sm:size-6" />
                            </div>
                            Decline Request
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs sm:text-sm font-medium text-muted-foreground pt-3 sm:pt-4">
                            Please provide a reason for declining this request. This message will be sent to the staff member.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="py-4 sm:py-6">
                        <label className="text-xs font-bold tracking-tight text-foreground uppercase mb-2 block">Decline Reason</label>
                        <textarea
                            className="w-full min-h-[100px] sm:min-h-[120px] bg-background border border-border/50 rounded-xl p-3 sm:p-4 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 outline-none transition-all resize-none placeholder:text-muted-foreground/40"
                            placeholder="Type the reason here (e.g., Incorrect amount, missing details...)"
                            value={declineReason}
                            onChange={(e) => setDeclineReason(e.target.value)}
                        />
                    </div>

                    <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 mt-2 sm:mt-0 w-full">
                        <AlertDialogCancel
                            onClick={() => setDeclineReason("")}
                            className="w-full sm:flex-1 rounded-xl font-bold text-xs h-11 border-border mt-0 bg-background hover:bg-muted"
                        >
                            Back
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                confirmDecline();
                            }}
                            disabled={isProcessing || !declineReason.trim()}
                            className="w-full sm:flex-1 rounded-xl bg-red-500 hover:bg-red-600 focus:ring-2 focus:ring-red-500/20 text-white font-bold text-xs h-11"
                        >
                            {isProcessing ? "Processing..." : "Confirm Decline"}
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
