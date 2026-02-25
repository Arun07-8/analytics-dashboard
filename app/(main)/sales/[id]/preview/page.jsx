'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { IconDownload, IconArrowLeft, IconLayoutDashboard, IconX } from "@tabler/icons-react";
import { InvoiceTemplate } from '@/components/sales/invoice-template';
import { getSale } from '@/lib/firebase/collections/sale';
import { getCustomer } from '@/lib/firebase/collections/customer';
import { getAllAdmins } from '@/lib/firebase/collections/admin';
import { downloadInvoice } from '@/lib/invoice-utils';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';

export default function InvoicePreviewPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const [sale, setSale] = useState(null);
    const [customer, setCustomer] = useState(null);
    const [admins, setAdmins] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);

    const isRejected = sale?.verificationStatus === "Rejected";

    useEffect(() => {
        if (params.id) {
            fetchInvoiceData(params.id);
        }
    }, [params.id]);

    const fetchInvoiceData = async (saleId) => {
        try {
            const [saleData, adminsData] = await Promise.all([
                getSale(saleId),
                getAllAdmins()
            ]);

            if (!saleData) {
                toast.error("Invoice not found");
                router.push('/sales');
                return;
            }

            const customerData = await getCustomer(saleData.customerId);

            setSale(saleData);
            setCustomer(customerData);
            setAdmins(adminsData);
        } catch (error) {
            console.error("Error fetching invoice:", error);
            toast.error("Failed to load invoice details");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!sale) return;

        setIsDownloading(true);
        try {
            const refId = Array.isArray(sale.salesRefId) ? sale.salesRefId[0] : sale.salesRefId;
            const fileName = `Invoice-${refId || sale.id}.pdf`;

            await downloadInvoice('invoice-preview-container', fileName);
            toast.success("Invoice downloaded successfully");
        } catch (error) {
            console.error("Download error:", error);
            toast.error("Failed to download invoice");
        } finally {
            setIsDownloading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <p className="font-bold text-sm text-primary uppercase tracking-[0.2em] animate-pulse">Loading Invoice...</p>
                </div>
            </div>
        );
    }

    if (!sale || !customer) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header / Toolbar */}
            <div className="sticky top-0 z-50 bg-white border-b border-sidebar-border px-8 py-4 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push('/sales')}
                            className="text-slate-500 hover:text-slate-900"
                        >
                            <IconArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Invoice Preview</h1>
                            <p className="text-xs text-slate-500 font-medium">
                                Ref: {Array.isArray(sale.salesRefId) ? sale.salesRefId[0] : sale.salesRefId}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => router.push('/sales')}
                            className="gap-2 font-bold text-slate-600"
                        >
                            <IconLayoutDashboard className="h-4 w-4" />
                            Go to Dashboard
                        </Button>
                        {!isRejected && (
                            <Button
                                onClick={handleDownload}
                                disabled={isDownloading}
                                className="bg-primary hover:bg-primary/90 text-white gap-2 font-bold shadow-lg shadow-primary/20"
                            >
                                {isDownloading ? (
                                    <>Generating PDF...</>
                                ) : (
                                    <>
                                        <IconDownload className="h-4 w-4" />
                                        Download Invoice
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Preview Container */}
            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-[850px] mx-auto space-y-8">
                    {/* REJECTION MESSAGE FOR FULL VIEW */}
                    {isRejected && sale.declineReason && (
                        <div className="bg-red-50 border border-red-100 rounded-[2rem] p-1 overflow-hidden shadow-sm">
                            <div className="bg-red-600 px-6 py-2.5 flex items-center justify-between">
                                <div className="flex items-center gap-3 text-white">
                                    <IconX className="h-3.5 w-3.5 stroke-[3]" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em]">Official Rejection Notice</span>
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/80">Action Required</span>
                            </div>
                            <div className="p-6 bg-white">
                                <div className="relative pl-6">
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-600 rounded-full" />
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 font-sans">Message from Administrator</p>
                                    <h2 className="text-xl font-black text-red-600 tracking-tight leading-snug italic font-sans">
                                        "{sale.declineReason}"
                                    </h2>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white shadow-2xl rounded-xl overflow-hidden ring-1 ring-slate-900/5">
                        <div className="transform origin-top scale-[0.9] sm:scale-100">
                            <div id="invoice-preview-container">
                                <InvoiceTemplate
                                    sale={sale}
                                    customer={customer}
                                    admins={admins}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
