'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
    IconPlus,
    IconTrash,
    IconUserPlus,
    IconDownload,
    IconSearch,
    IconClipboardList,
    IconArrowLeft,
    IconUserCheck,
    IconX,
    IconCurrencyRupee,
    IconCalendarEvent,
    IconReceipt2,
    IconCreditCard,
    IconChevronRight,
    IconLayoutDashboard,
    IconPencil
} from "@tabler/icons-react";

import {
    createCustomer,
    getAllCustomers,
    createService,
    getActiveServices,
    getAllAdmins,
    createSale,
    createNotification
} from '@/lib/firebase/collections';
import { CustomerModal } from '@/components/customers/customer-modal';
import { ServiceModal } from '@/components/services/service-modal';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from "@/lib/utils";
import { InvoiceTemplate } from '@/components/sales/invoice-template';
import { InvoicePreviewModal } from '@/components/sales/invoice-preview-modal';
import { downloadInvoice } from '@/lib/invoice-utils';

export default function CreateSalePage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    // Data states
    const [customers, setCustomers] = useState([]);
    const [services, setServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [selectedServices, setSelectedServices] = useState([]);
    const [currentServiceId, setCurrentServiceId] = useState('');
    const [customPrice, setCustomPrice] = useState('');
    const [editingIndex, setEditingIndex] = useState(null);

    const [paidAmount, setPaidAmount] = useState('');
    const [salesRefId, setSalesRefId] = useState('');
    const [errors, setErrors] = useState({});

    // Modals states
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [customerFormData, setCustomerFormData] = useState({});
    const [serviceFormData, setServiceFormData] = useState({ isActive: true });
    const [customerErrors, setCustomerErrors] = useState({});
    const [serviceErrors, setServiceErrors] = useState({});
    const [admins, setAdmins] = useState([]);

    const [completedSale, setCompletedSale] = useState(null);
    const [isInvoiceGenerating, setIsInvoiceGenerating] = useState(false);
    const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState(false);

    // Refs for focus handling
    const customerSearchRef = useRef(null);
    const salesRefIdRef = useRef(null);
    const serviceSelectRef = useRef(null);
    const priceInputRef = useRef(null);
    const paidAmountRef = useRef(null);
    const cartCardRef = useRef(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [customersData, servicesData, adminsData] = await Promise.all([
                getAllCustomers(),
                getActiveServices(),
                getAllAdmins()
            ]);
            setCustomers(customersData);
            setServices(servicesData);
            setAdmins(adminsData);

            const date = new Date();
            const year = date.getFullYear();
            const random = Math.floor(1000 + Math.random() * 9000);
            setSalesRefId(`INV-${year}-${random}`);
        } catch (error) {
            toast.error("Failed to load data");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCustomers = useMemo(() => {
        if (!customerSearch) return [];
        const term = customerSearch.toLowerCase();
        return customers.filter(c =>
            (c.name?.toLowerCase().includes(term)) ||
            (c.email?.toLowerCase().includes(term)) ||
            (c.mobile?.includes(term))
        ).slice(0, 5);
    }, [customers, customerSearch]);

    useEffect(() => {
        if (currentServiceId) {
            const service = services.find(s => s.id === currentServiceId);
            if (service) {
                setCustomPrice(service.price?.toString() || '0');
            }
        } else {
            setCustomPrice('');
        }
    }, [currentServiceId, services]);

    const totalAmount = useMemo(() => {
        return selectedServices.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
    }, [selectedServices]);

    const handleAddService = () => {
        const newErrors = {};

        if (!currentServiceId) {
            newErrors.service = "Asset selection is required";
        }

        const priceNum = Number(customPrice);
        if (!customPrice || isNaN(priceNum) || priceNum <= 0) {
            newErrors.price = "Price must be greater than 0";
        } else if (customPrice.length > 1 && customPrice.startsWith('0') && !customPrice.startsWith('0.')) {
            newErrors.price = "Invalid format: leading zero";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(prev => ({ ...prev, ...newErrors }));
            // Focus first error
            if (newErrors.service) serviceSelectRef.current?.focus();
            else if (newErrors.price) priceInputRef.current?.focus();
            return;
        }

        const service = services.find(s => s.id === currentServiceId);
        if (service) {
            if (editingIndex !== null) {
                const updated = [...selectedServices];
                updated[editingIndex] = {
                    serviceId: service.id,
                    name: service.name,
                    price: Number(customPrice) || 0
                };
                setSelectedServices(updated);
                setEditingIndex(null);
                toast.success("Item updated in cart");
            } else {
                setSelectedServices([...selectedServices, {
                    serviceId: service.id,
                    name: service.name,
                    price: Number(customPrice) || 0
                }]);
            }
            setCurrentServiceId('');
            setCustomPrice('');
            // Clear current entry errors
            setErrors(prev => {
                const { service: s, price: p, ...rest } = prev;
                return rest;
            });
        }
    };

    const handleEditService = (index) => {
        const item = selectedServices[index];
        setCurrentServiceId(item.serviceId);
        setCustomPrice(item.price.toString());
        setEditingIndex(index);
        // Scroll to form if needed
        window.scrollTo({ top: 300, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setCurrentServiceId('');
        setCustomPrice('');
    };

    const handleRemoveService = (index) => {
        setSelectedServices(selectedServices.filter((_, i) => i !== index));
        if (editingIndex === index) cancelEdit();
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        const newErrors = {};
        if (!selectedCustomer) {
            newErrors.customer = "Select a customer to continue";
        }
        if (!salesRefId.trim()) {
            newErrors.refId = "Reference number is required";
        }
        if (selectedServices.length === 0) {
            newErrors.cart = "Add at least one item to cart";
        }

        const pAmount = Number(paidAmount);
        if (paidAmount !== '' && (isNaN(pAmount) || pAmount < 0)) {
            newErrors.paidAmount = "Enter a valid amount";
        } else if (paidAmount.length > 1 && paidAmount.startsWith('0') && !paidAmount.startsWith('0.')) {
            newErrors.paidAmount = "Invalid format: leading zero";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            // Intelligent Focus
            if (newErrors.customer) customerSearchRef.current?.focus();
            else if (newErrors.refId) salesRefIdRef.current?.focus();
            else if (newErrors.cart) cartCardRef.current?.scrollIntoView({ behavior: 'smooth' });
            else if (newErrors.paidAmount) paidAmountRef.current?.focus();
            return;
        }

        setIsSubmitting(true);
        try {
            const staffId = user?.uid;

            if (!staffId) {
                toast.error("Auth session expired. Please login again.");
                setIsSubmitting(false);
                return;
            }

            const matchedAdmin = admins.find(a => a.email === user?.email);
            const staffName = matchedAdmin?.name || user?.displayName || 'Staff';
            const staffEmail = user?.email || '';

            const saleData = {
                customerId: selectedCustomer.id,
                staffId: staffId,
                staffName: staffName,
                staffEmail: staffEmail,
                services: selectedServices,
                totalAmount: Number(totalAmount),
                paidAmount: Number(paidAmount) || 0,
                excessAmount: Number(totalAmount) - (Number(paidAmount) || 0),
                salesRefId: [salesRefId],
                createdByRole: user?.role?.trim().toLowerCase() === 'admin' ? 'admin' : 'staff',
            };

            const docId = await createSale(saleData);
            setCompletedSale({ ...saleData, id: docId });
            setErrors({});

            if (user?.role?.trim().toLowerCase() === 'admin') {
                toast.success("Sale synchronized successfully");
            } else {
                // Send notification only to users with 'admin' role
                const allUsers = await getAllAdmins();
                const actualAdmins = allUsers.filter(acc =>
                    acc.role?.trim().toLowerCase() === 'admin' &&
                    acc.id !== user.uid
                );

                const notificationPromises = actualAdmins.map(admin => createNotification({
                    userId: admin.id,
                    title: "New Sales Request",
                    message: `${staffName} has submitted a new sales request for ₹${Number(totalAmount).toLocaleString('en-IN')} for ${selectedCustomer?.name}.`,
                    type: "warning",
                    actionUrl: "/sales-requests"
                }));
                await Promise.all(notificationPromises);

                toast.success("Sales request has been sent to Admin for approval.");
            }
        } catch (error) {
            toast.error("Sync error: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGenerateInvoice = () => {
        if (!completedSale) return;
        setIsInvoicePreviewOpen(true);
    };

    const handleConfirmDownload = async () => {
        if (!completedSale) return;

        setIsInvoicePreviewOpen(false);
        setIsInvoiceGenerating(true);

        setTimeout(async () => {
            try {
                await downloadInvoice('invoice-template', `Invoice-${completedSale.salesRefId[0]}.pdf`);
                toast.success("Invoice downloaded successfully");
                router.push('/sales');
            } catch (error) {
                toast.error("Failed to generate invoice");
            } finally {
                setIsInvoiceGenerating(false);
            }
        }, 500);
    };

    const handleCustomerSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};

        if (!customerFormData.name?.trim()) newErrors.name = "Full name is required";
        else if (customerFormData.name.trim().length < 3) newErrors.name = "Name must be at least 3 characters";

        const mobileRegex = /^[0-9+() -]{7,15}$/;
        if (!customerFormData.mobile?.trim()) newErrors.mobile = "Mobile number is required";
        else if (!mobileRegex.test(customerFormData.mobile)) newErrors.mobile = "Invalid mobile number format";

        if (customerFormData.email?.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(customerFormData.email)) newErrors.email = "Invalid email format";
        }

        if (!customerFormData.country?.trim()) newErrors.country = "Country is required";
        if (!customerFormData.state?.trim()) newErrors.state = "State is required";
        if (!customerFormData.city?.trim()) newErrors.city = "City is required";
        if (!customerFormData.place?.trim()) newErrors.place = "Place/Area is required";
        if (!customerFormData.pincode?.trim()) newErrors.pincode = "Pincode is required";
        if (!customerFormData.address?.trim()) newErrors.address = "Full address is required";

        if (Object.keys(newErrors).length > 0) {
            setCustomerErrors(newErrors);
            return;
        }

        try {
            const id = await createCustomer(customerFormData);
            toast.success("Customer created");
            const updatedCustomers = await getAllCustomers();
            setCustomers(updatedCustomers);
            const newCustomer = updatedCustomers.find(c => c.id === id);
            setSelectedCustomer(newCustomer);
            setIsCustomerModalOpen(false);
            setCustomerFormData({});
            setCustomerErrors({});
            setCustomerSearch('');
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleServiceSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!serviceFormData.name?.trim()) newErrors.name = "Service name is required";
        if (!serviceFormData.description?.trim()) newErrors.description = "Description is required";

        if (Object.keys(newErrors).length > 0) {
            setServiceErrors(newErrors);
            return;
        }

        try {
            await createService(serviceFormData);
            toast.success("Service created");
            const updatedServices = await getActiveServices();
            setServices(updatedServices);
            setIsServiceModalOpen(false);
            setServiceFormData({ isActive: true });
            setServiceErrors({});
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleDownloadInvoice = () => {
        window.print();
    };

    if (authLoading || !user) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <p className="font-bold text-sm text-primary uppercase tracking-[0.2em] animate-pulse">
                        {authLoading ? "Initializing Auth..." : "Redirecting..."}
                    </p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <p className="font-bold text-sm text-primary uppercase tracking-[0.2em] animate-pulse">Loading Terminal...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background transition-colors duration-300">
            {/* Professional Navigation - Theme Aware */}
            <div className="sticky top-0 z-40 bg-card border-b border-border shadow-sm px-4 py-4 sm:px-10">
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.back()}
                            className="h-10 w-10 border-border hover:bg-accent transition-colors shrink-0"
                        >
                            <IconArrowLeft className="h-5 w-5 text-muted-foreground" />
                        </Button>
                        <div className="h-10 w-[1px] bg-border hidden md:block" />
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <IconLayoutDashboard className="h-4 w-4 text-primary" />
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Sales Terminal</span>
                            </div>
                            <h1 className="text-2xl font-black text-foreground tracking-tight leading-none">Create Sale</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden lg:flex flex-col items-end px-4 py-1 border-r border-border">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Session</span>
                            <span className="text-sm font-bold text-foreground">{user?.displayName || user?.email?.split('@')[0] || 'Operator'}</span>
                        </div>
                        <Button variant="ghost" onClick={handleDownloadInvoice} className="h-11 px-5 text-muted-foreground hover:text-foreground font-semibold gap-2 transition-colors">
                            <IconDownload className="h-4 w-4" />
                            Draft
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            className="h-11 px-10 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-wider gap-2 shadow-lg shadow-primary/20 transition-all rounded-lg active:scale-95"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Syncing..." : "Finish Sale"}
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-4 py-8 sm:px-10">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-4 gap-10">

                    {/* Primary Content Area */}
                    <div className="xl:col-span-3 space-y-10">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* 1. Customer Section */}
                            <Card className="border-border shadow-md bg-card rounded-2xl hover:shadow-lg transition-all duration-300 relative z-10">
                                <CardHeader className="bg-muted/30 border-b border-border pb-6 pt-6 rounded-t-2xl">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <IconUserPlus className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold">Customer Account</CardTitle>
                                            <CardDescription className="text-xs">Identify the billing target</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-8">
                                    {!selectedCustomer ? (
                                        <div className="space-y-6">
                                            <div className="relative group">
                                                <div className="relative">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                                                        <IconSearch className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                    </div>
                                                    <Input
                                                        ref={customerSearchRef}
                                                        placeholder="Search Name, Email or Phone..."
                                                        className={cn(
                                                            "pl-12 h-14 text-base border-border focus-visible:ring-primary/20 rounded-xl transition-all bg-background",
                                                            errors.customer && "border-destructive ring-destructive/20 shadow-[0_0_10px_rgba(239,68,68,0.05)]"
                                                        )}
                                                        value={customerSearch}
                                                        onChange={(e) => {
                                                            setCustomerSearch(e.target.value);
                                                            if (errors.customer) setErrors(prev => ({ ...prev, customer: null }));
                                                        }}
                                                    />
                                                </div>
                                                {errors.customer && (
                                                    <p className="text-[10px] text-destructive font-black uppercase tracking-widest mt-2 ml-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                                        {errors.customer}
                                                    </p>
                                                )}
                                                {customerSearch && (
                                                    <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border shadow-2xl z-[100] rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                        {filteredCustomers.length > 0 ? (
                                                            <div className="divide-y divide-border">
                                                                {filteredCustomers.map(customer => (
                                                                    <div
                                                                        key={customer.id}
                                                                        className="p-4 hover:bg-accent cursor-pointer flex justify-between items-center transition-all group/item"
                                                                        onClick={() => {
                                                                            setSelectedCustomer(customer);
                                                                            setCustomerSearch('');
                                                                        }}
                                                                    >
                                                                        <div className="flex items-center gap-4">
                                                                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-black uppercase text-xs group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-colors">
                                                                                {customer.name?.charAt(0) || '?'}
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <p className="font-bold text-sm text-foreground">{customer.name}</p>
                                                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{customer.mobile}</p>
                                                                            </div>
                                                                        </div>
                                                                        <IconPlus className="h-4 w-4 text-primary opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="p-10 text-center flex flex-col items-center gap-3">
                                                                <IconUserPlus className="h-10 w-10 text-muted-foreground/30" />
                                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Identity Not Found</p>
                                                                <Button
                                                                    type="button"
                                                                    variant="link"
                                                                    size="sm"
                                                                    className="text-primary h-auto p-0 font-black uppercase text-[10px] tracking-widest"
                                                                    onClick={() => setIsCustomerModalOpen(true)}
                                                                >
                                                                    Create Profile +
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center px-1">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Validated Search</span>
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    className="h-8 px-4 rounded-full text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-primary-foreground transition-all flex items-center gap-1.5"
                                                    onClick={() => setIsCustomerModalOpen(true)}
                                                >
                                                    <IconPlus className="h-3 w-3" />
                                                    New Customer
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 relative animate-in zoom-in-95 duration-500 overflow-hidden">
                                            <div className="absolute right-0 top-0 p-8 opacity-5 -mr-10 -mt-10">
                                                <IconUserCheck className="h-32 w-32" />
                                            </div>
                                            <div className="flex items-center justify-between relative z-10">
                                                <div className="flex items-center gap-5">
                                                    <div className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                                                        <IconUserCheck className="h-7 w-7" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <h4 className="font-black text-xl text-foreground leading-none mb-1.5">{selectedCustomer.name}</h4>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="bg-background text-[10px] font-mono border-border uppercase">{selectedCustomer.mobile}</Badge>
                                                            <span className="text-[10px] text-muted-foreground truncate max-w-[120px] font-medium italic">{selectedCustomer.email}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setSelectedCustomer(null)}
                                                    className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-all shrink-0"
                                                >
                                                    <IconX className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* 2. Transaction Metadata */}
                            <Card className="border-border shadow-md bg-card rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300">
                                <CardHeader className="bg-muted/30 border-b border-border pb-6 pt-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                                            <IconReceipt2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold">Order Metadata</CardTitle>
                                            <CardDescription className="text-xs">Transaction audit trails</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-8 space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Reference Number</Label>
                                        <div className={cn(
                                            "flex bg-muted/20 rounded-xl px-5 py-4 items-center gap-3 border border-border focus-within:border-primary/50 transition-all",
                                            errors.refId && "border-destructive ring-destructive/20 shadow-[0_0_10px_rgba(239,68,68,0.05)]"
                                        )}>
                                            <IconCalendarEvent className="h-5 w-5 text-muted-foreground" />
                                            <input
                                                ref={salesRefIdRef}
                                                className="bg-transparent border-none focus:ring-0 text-lg font-black text-foreground w-full uppercase tracking-tight"
                                                value={salesRefId}
                                                onChange={(e) => {
                                                    setSalesRefId(e.target.value);
                                                    if (errors.refId) setErrors(prev => ({ ...prev, refId: null }));
                                                }}
                                                placeholder="REF-XXXX-XXXX"
                                            />
                                        </div>
                                        {errors.refId && (
                                            <p className="text-[10px] text-destructive font-black uppercase tracking-widest mt-2 ml-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                                {errors.refId}
                                            </p>
                                        )}
                                    </div>
                                    <Separator className="bg-border/50" />
                                    <div className="flex items-center justify-between text-[10px] px-2">
                                        <span className="font-black text-muted-foreground uppercase tracking-widest">Entry Timestamp</span>
                                        <span className="font-bold text-foreground bg-muted px-2 py-1 rounded-md uppercase tracking-tighter">
                                            {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* 3. Service Entry (Separate Card) */}
                        <Card className="border-border shadow-md bg-card rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300">
                            <CardHeader className="bg-muted/30 border-b border-border py-6 px-8 flex flex-row items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <IconClipboardList className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">{editingIndex !== null ? 'Modify Cart Item' : 'Service Entry'}</CardTitle>
                                        <CardDescription className="text-xs">Configure service parameters for this sale</CardDescription>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    className="h-10 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-primary/20"
                                    onClick={() => setIsServiceModalOpen(true)}
                                >
                                    <IconPlus className="h-3 w-3" />
                                    New Service
                                </Button>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
                                    <div className="md:col-span-6 space-y-2">
                                        <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground ml-1">Asset Selection</Label>
                                        <Select
                                            value={currentServiceId}
                                            onValueChange={(val) => {
                                                setCurrentServiceId(val);
                                                if (errors.service) setErrors(prev => ({ ...prev, service: null }));
                                            }}
                                        >
                                            <SelectTrigger
                                                ref={serviceSelectRef}
                                                className={cn(
                                                    "h-12 rounded-xl border-border focus:ring-primary/20 text-foreground font-bold text-base bg-background",
                                                    errors.service && "border-destructive ring-destructive/20"
                                                )}
                                            >
                                                <SelectValue placeholder="Select a Service" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl shadow-2xl bg-card border-border">
                                                {services.map(service => (
                                                    <SelectItem key={service.id} value={service.id} className="py-3 font-bold">
                                                        {service.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.service && (
                                            <p className="text-[10px] text-destructive font-black uppercase tracking-widest mt-2 ml-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                                {errors.service}
                                            </p>
                                        )}
                                    </div>
                                    <div className="md:col-span-3 space-y-2">
                                        <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground ml-1">Market Rate (₹)</Label>
                                        <div className="relative">
                                            <IconCurrencyRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />
                                            <Input
                                                ref={priceInputRef}
                                                type="number"
                                                className={cn(
                                                    "h-12 pl-12 text-lg font-black border-border rounded-xl focus-visible:ring-emerald-500/10 transition-all bg-background",
                                                    errors.price && "border-destructive ring-destructive/20 shadow-[0_0_10px_rgba(239,68,68,0.05)]"
                                                )}
                                                value={customPrice}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) return;
                                                    setCustomPrice(val);
                                                    if (errors.price) setErrors(prev => ({ ...prev, price: null }));
                                                }}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        {errors.price && (
                                            <p className="text-[10px] text-destructive font-black uppercase tracking-widest mt-2 ml-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                                {errors.price}
                                            </p>
                                        )}
                                    </div>
                                    <div className="md:col-span-3 flex gap-2">
                                        <Button
                                            type="button"
                                            className={cn(
                                                "h-12 flex-1 rounded-xl font-black uppercase tracking-[0.1em] text-[10px] gap-2 transition-all shadow-md active:scale-95",
                                                editingIndex !== null ? "bg-orange-500 hover:bg-orange-600 text-white" : "bg-foreground text-background hover:bg-foreground/90"
                                            )}
                                            onClick={handleAddService}
                                            disabled={!currentServiceId}
                                        >
                                            {editingIndex !== null ? (
                                                <>
                                                    <IconUserCheck className="h-4 w-4" />
                                                    Update Item
                                                </>
                                            ) : (
                                                <>
                                                    <IconPlus className="h-4 w-4" />
                                                    Append Item
                                                </>
                                            )}
                                        </Button>
                                        {editingIndex !== null && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="h-12 w-12 rounded-xl border-border"
                                                onClick={cancelEdit}
                                            >
                                                <IconX className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 4. Cart Table */}
                        <div ref={cartCardRef}>
                            <Card className="border-border shadow-md bg-card rounded-2xl overflow-hidden shadow-slate-200/5 dark:shadow-none">
                                <CardHeader className="bg-muted/30 border-b border-border py-4 px-8 flex flex-row items-center justify-between">
                                    <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                        <IconReceipt2 className="h-4 w-4" />
                                        Billed Cart Details
                                    </CardTitle>
                                    {errors.cart && (
                                        <Badge variant="destructive" className="text-[9px] font-black uppercase tracking-widest animate-pulse border-none px-4 py-1">
                                            {errors.cart}
                                        </Badge>
                                    )}
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-muted/30">
                                                <TableRow className="hover:bg-transparent border-b border-border">
                                                    <TableHead className="py-4 px-8 font-black text-muted-foreground text-[10px] uppercase tracking-[0.2em]">Service Description</TableHead>
                                                    <TableHead className="text-right py-4 px-8 font-black text-muted-foreground text-[10px] uppercase tracking-[0.2em]">Amount (INR)</TableHead>
                                                    <TableHead className="w-[120px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedServices.length > 0 ? (
                                                    selectedServices.map((service, index) => (
                                                        <TableRow key={index} className={cn(
                                                            "group transition-all border-b border-border last:border-0",
                                                            editingIndex === index ? "bg-orange-500/5" : "hover:bg-muted/30"
                                                        )}>
                                                            <TableCell className="py-6 px-8">
                                                                <div className="flex flex-col">
                                                                    <span className="text-base font-black text-foreground leading-none mb-1.5">{service.name}</span>
                                                                    <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">ID: {service.serviceId.substring(0, 8).toUpperCase()}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right py-6 px-8">
                                                                <span className="text-lg font-black text-foreground tracking-tighter">₹{service.price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                            </TableCell>
                                                            <TableCell className="px-8 flex justify-end gap-2 py-6">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-muted-foreground/60 hover:text-foreground transition-colors"
                                                                    onClick={() => handleEditService(index)}
                                                                >
                                                                    <IconPencil className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                                                                    onClick={() => handleRemoveService(index)}
                                                                >
                                                                    <IconTrash className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={3} className="h-64 text-center">
                                                            <div className="flex flex-col items-center justify-center space-y-4 opacity-20">
                                                                <div className="h-20 w-20 rounded-3xl bg-muted flex items-center justify-center">
                                                                    <IconClipboardList className="h-10 w-10 text-muted-foreground" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-base font-black text-foreground uppercase tracking-widest">Cart is Empty</p>
                                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Add items using the entry form above</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Settlement Sidebar */}
                    <div className="xl:col-span-1">
                        <div className="sticky top-[108px] space-y-6">
                            <Card className="border border-border shadow-2xl bg-card rounded-3xl overflow-hidden ring-1 ring-border">
                                <CardHeader className="bg-foreground text-background pb-10 pt-12 px-8 border-b-[6px] border-primary relative overflow-hidden">
                                    <div className="absolute right-0 top-0 p-8 opacity-10 -mr-10 -mt-10">
                                        <IconCreditCard className="h-40 w-40" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 opacity-60 mb-3">
                                            <IconCreditCard className="h-4 w-4" />
                                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em]">Settlement Logic</CardTitle>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-xs font-bold opacity-40 italic uppercase tracking-widest">Final Ledger</span>
                                            <div className="h-[1px] flex-1 bg-background/20" />
                                        </div>
                                        <div className="mt-6 flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-primary">₹</span>
                                            <span className="text-6xl font-black tracking-tighter">
                                                {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </span>
                                            <span className="text-2xl font-black opacity-30">.{((totalAmount % 1) * 100).toFixed(0).padStart(2, '0')}</span>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-10 px-8 pb-10 space-y-10">
                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1">
                                                <Label htmlFor="paid">Paid Amount</Label>
                                            </div>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-xl pointer-events-none group-focus-within:text-emerald-500 transition-colors">₹</div>
                                                <Input
                                                    ref={paidAmountRef}
                                                    id="paid"
                                                    type="number"
                                                    className={cn(
                                                        "h-14 pl-10 border-border rounded-2xl font-black text-2xl text-foreground focus-visible:ring-emerald-500/20 bg-emerald-500/5",
                                                        errors.paidAmount && "border-destructive ring-destructive/20 shadow-[0_0_10px_rgba(239,68,68,0.05)]"
                                                    )}
                                                    value={paidAmount}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) return;
                                                        setPaidAmount(val);
                                                        if (errors.paidAmount) setErrors(prev => ({ ...prev, paidAmount: null }));
                                                    }}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            {errors.paidAmount && (
                                                <p className="text-[10px] text-destructive font-black uppercase tracking-widest mt-2 ml-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                                    {errors.paidAmount}
                                                </p>
                                            )}
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        disabled={!totalAmount || totalAmount <= 0 || Number(paidAmount) === totalAmount}
                                                        className="w-full h-10 mt-2 bg-zinc-900 border-zinc-800 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all font-bold text-[10px] uppercase tracking-widest rounded-xl disabled:opacity-30 disabled:grayscale"
                                                    >
                                                        Mark as Fully Paid
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="rounded-2xl border-border bg-card">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">Confirm Full Payment</AlertDialogTitle>
                                                        <AlertDialogDescription className="text-sm font-medium text-muted-foreground">
                                                            This will set the paid amount to <span className="text-foreground font-black">₹{totalAmount.toLocaleString()}</span>. Are you sure you want to clear the balance?
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter className="mt-6">
                                                        <AlertDialogCancel className="rounded-xl font-bold uppercase tracking-widest text-[10px] h-11">Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => {
                                                                setPaidAmount(totalAmount.toString());
                                                                if (errors.paidAmount) setErrors(prev => ({ ...prev, paidAmount: null }));
                                                                toast.success("Payment amount adjusted to full");
                                                            }}
                                                            className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] h-11"
                                                        >
                                                            Confirm Payment
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>

                                    <div className="bg-muted p-6 rounded-3xl border border-border relative overflow-hidden">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] whitespace-nowrap px-1">Net Balance</span>
                                            {(totalAmount - Number(paidAmount)) === 0 && totalAmount > 0 && (
                                                <Badge className="bg-emerald-500 text-white border-0 text-[10px] font-black uppercase py-0.5 px-3 animate-pulse">CLEARED</Badge>
                                            )}
                                        </div>
                                        <div className={cn(
                                            "text-3xl font-black tracking-tighter px-1 transition-colors duration-500",
                                            totalAmount - Number(paidAmount) > 0 ? "text-destructive" : "text-emerald-500"
                                        )}>
                                            ₹{(totalAmount - Number(paidAmount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-16 bg-foreground text-background hover:bg-foreground/90 text-sm font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 overflow-hidden group"
                                        disabled={isSubmitting}
                                        onClick={handleSubmit}
                                    >
                                        {isSubmitting ? "Processing..." : "Add Sale"}
                                        <IconChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                    </Button>

                                    <div className="flex flex-col items-center gap-2 opacity-20 text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground">
                                        <div className="h-[1px] w-full bg-border" />
                                        <span>Terminal Secure Link Alpha</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </main>

            {/* Modals */}
            <CustomerModal
                isOpen={isCustomerModalOpen}
                onOpenChange={setIsCustomerModalOpen}
                formData={customerFormData}
                onInputChange={(e) => {
                    setCustomerFormData({ ...customerFormData, [e.target.name]: e.target.value });
                    if (customerErrors[e.target.name]) {
                        setCustomerErrors(prev => ({ ...prev, [e.target.name]: null }));
                    }
                }}
                onSubmit={handleCustomerSubmit}
                onCancel={() => {
                    setIsCustomerModalOpen(false);
                    setCustomerErrors({});
                }}
                errors={customerErrors}
            />

            <ServiceModal
                isOpen={isServiceModalOpen}
                onOpenChange={setIsServiceModalOpen}
                formData={serviceFormData}
                onInputChange={(e) => {
                    setServiceFormData({ ...serviceFormData, [e.target.name]: e.target.value });
                    if (serviceErrors[e.target.name]) {
                        setServiceErrors(prev => ({ ...prev, [e.target.name]: null }));
                    }
                }}
                onCheckedChange={(isActive) => setServiceFormData({ ...serviceFormData, isActive })}
                onSubmit={handleServiceSubmit}
                onCancel={() => {
                    setIsServiceModalOpen(false);
                    setServiceErrors({});
                }}
                errors={serviceErrors}
            />

            <InvoicePreviewModal
                isOpen={isInvoicePreviewOpen}
                onClose={() => setIsInvoicePreviewOpen(false)}
                sale={completedSale}
                customer={selectedCustomer}
                admins={admins}
                onConfirmDownload={handleConfirmDownload}
            />

            {/* Hidden Invoice Template for PDF generation */}
            <div className="absolute -top-[10000px] left-0 opacity-0 pointer-events-none z-[-100]">
                <InvoiceTemplate
                    sale={completedSale}
                    customer={selectedCustomer}
                    admins={admins}
                />
            </div>

            {/* Success Overlay instead of direct redirect */}
            {
                completedSale && !isInvoicePreviewOpen && (
                    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-500">
                        <Card className="max-w-md w-full border-border shadow-2xl rounded-2xl p-8 text-center animate-in zoom-in-95 duration-500">
                            {user?.role?.trim().toLowerCase() === 'admin' ? (
                                <>
                                    <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto mb-6">
                                        <IconUserCheck className="h-10 w-10" />
                                    </div>
                                    <h2 className="text-2xl font-black text-foreground mb-2">Sale Completed!</h2>
                                    <p className="text-muted-foreground text-sm mb-8 italic">The transaction for <span className="text-foreground font-bold">{selectedCustomer?.name}</span> has been securely synced.</p>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Button
                                            variant="outline"
                                            className="h-12 font-black uppercase tracking-widest text-[10px] gap-2 rounded-xl"
                                            onClick={() => router.push('/sales')}
                                        >
                                            <IconLayoutDashboard className="h-4 w-4" />
                                            Go to Dashboard
                                        </Button>
                                        <Button
                                            className="h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] gap-2 rounded-xl shadow-lg shadow-emerald-500/20"
                                            onClick={handleGenerateInvoice}
                                        >
                                            <IconDownload className="h-4 w-4" />
                                            Download Invoice
                                        </Button>
                                    </div>
                                    <Button
                                        variant="link"
                                        className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 hover:text-primary transition-colors"
                                        onClick={() => window.location.reload()}
                                    >
                                        Start New Transaction
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6">
                                        <IconClipboardList className="h-10 w-10" />
                                    </div>
                                    <h2 className="text-2xl font-black text-foreground mb-2">Sales Request Sent to Admin</h2>
                                    <p className="text-muted-foreground text-sm mb-8 italic">Your sales request has been successfully sent to the admin for approval.</p>

                                    <Button
                                        className="w-full h-12 bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 font-black uppercase tracking-widest text-[10px] gap-2 rounded-xl shadow-lg"
                                        onClick={() => {
                                            setCompletedSale(null);
                                            window.location.reload();
                                        }}
                                    >
                                        Go Back
                                    </Button>
                                </>
                            )}
                        </Card>
                    </div>
                )
            }

            <style jsx global>{`
                @media print {
                    .min-h-screen { background: white !important; }
                    .max-w-\[1600px\] { max-width: 100% !important; margin: 0 !important; }
                    .sticky, button, .badges, nav, footer, .xl\:col-span-1 { display: none !important; }
                    .xl\:col-span-3 { width: 100% !important; grid-column: span 4 / span 4 !important; }
                    .Card { border: 1px solid #e2e8f0 !important; box-shadow: none !important; margin-bottom: 2rem !important; }
                    .bg-primary, .bg-slate-900, .bg-foreground { background: none !important; color: black !important; }
                    * { color: black !important; border-color: #e2e8f0 !important; }
                }

                input::-webkit-outer-spin-button,
                input::-webkit-inner-spin-button {
                  -webkit-appearance: none;
                  margin: 0;
                }
                input[type=number] {
                  -moz-appearance: textfield;
                }
            `}</style>
        </div >
    );
}
