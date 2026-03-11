'use client';

import { useState, useEffect, useMemo, use } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
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
    IconTrash,
    IconPlus,
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
import { getAllCustomers } from '@/lib/firebase/collections/customer';
import { getActiveServices } from '@/lib/firebase/collections/service';
import { updateSale, getSale } from '@/lib/firebase/collections/sale';
import { CustomerModal } from '@/components/customers/customer-modal';
import { ServiceModal } from '@/components/services/service-modal';
import { createCustomer } from '@/lib/firebase/collections/customer';
import { createService } from '@/lib/firebase/collections/service';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from "@/lib/utils";

export default function EditSalePage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const from = searchParams.get('from');
    const saleId = params.id;
    const { user } = useAuth();

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

    // Modals states
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [customerFormData, setCustomerFormData] = useState({});
    const [serviceFormData, setServiceFormData] = useState({ isActive: true });
    const [customerErrors, setCustomerErrors] = useState({});
    const [serviceErrors, setServiceErrors] = useState({});

    useEffect(() => {
        fetchData();
    }, [saleId]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [customersData, servicesData, saleData] = await Promise.all([
                getAllCustomers(),
                getActiveServices(),
                getSale(saleId)
            ]);

            setCustomers(customersData);
            setServices(servicesData);

            if (saleData) {
                // Security check for staff trying to edit a processed record via direct URL
                if (saleData.verificationStatus !== 'Pending' && user?.role?.trim().toLowerCase() !== 'admin') {
                    toast.error("Cannot edit a processed sales record");
                    router.push('/sales');
                    return;
                }

                const customer = customersData.find(c => c.id === saleData.customerId);
                setSelectedCustomer(customer || { id: saleData.customerId, name: 'Unknown Customer' });
                setSelectedServices(saleData.services || []);
                setPaidAmount(saleData.paidAmount?.toString() || '0');
                setSalesRefId(saleData.salesRefId?.[0] || '');
            } else {
                toast.error("Sale not found");
                router.push('/sales');
            }
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
            // Only auto-update price from master list if:
            // 1. We're adding a new item (editingIndex === null)
            // 2. We're editing an item but have changed the selected service
            const isNewItem = editingIndex === null;
            const hasServiceChanged = editingIndex !== null && selectedServices[editingIndex]?.serviceId !== currentServiceId;

            if (isNewItem || hasServiceChanged) {
                const service = services.find(s => s.id === currentServiceId);
                if (service) {
                    setCustomPrice(service.price?.toString() || '0');
                }
            }
        } else {
            setCustomPrice('');
        }
    }, [currentServiceId, services, editingIndex, selectedServices]);

    const totalAmount = useMemo(() => {
        return selectedServices.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
    }, [selectedServices]);

    const handleAddService = () => {
        if (!currentServiceId) {
            toast.error("Please select a service");
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
                toast.success("Service updated");
            } else {
                setSelectedServices([...selectedServices, {
                    serviceId: service.id,
                    name: service.name,
                    price: Number(customPrice) || 0
                }]);
            }
            setCurrentServiceId('');
            setCustomPrice('');
        }
    };

    const handleEditService = (index) => {
        const item = selectedServices[index];
        setCurrentServiceId(item.serviceId);
        setCustomPrice(item.price.toString());
        setEditingIndex(index);
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
        if (!selectedCustomer) {
            toast.error("Please select a customer");
            return;
        }
        if (selectedServices.length === 0) {
            toast.error("Please add at least one service");
            return;
        }

        setIsSubmitting(true);
        try {
            const finalTotal = Number(totalAmount);
            const finalPaid = Number(paidAmount) || 0;
            const isClosed = finalPaid >= finalTotal;

            const updateData = {
                customerId: selectedCustomer.id,
                services: selectedServices,
                totalAmount: finalTotal,
                paidAmount: finalPaid,
                excessAmount: finalTotal - finalPaid,
                closed: isClosed,
                status: isClosed ? 'paid' : 'unpaid',
                salesRefId: [salesRefId],
            };

            await updateSale(saleId, updateData);
            toast.success("Sale updated successfully");
            router.push(from === 'dashboard' ? '/dashboard' : '/sales');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCustomerSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};

        if (!customerFormData.name?.trim()) newErrors.name = "Full name is required";
        else if (customerFormData.name.trim().length < 3) newErrors.name = "Name must be at least 3 characters";

        const mobileRegex = /^[0-9+() -]{7,15}$/;
        if (!customerFormData.mobile?.trim()) newErrors.mobile = "Mobile number is required";
        else if (!mobileRegex.test(customerFormData.mobile)) newErrors.mobile = "Invalid mobile number format";

        if (!customerFormData.email?.trim()) {
            newErrors.email = "Email address is required";
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(customerFormData.email)) newErrors.email = "Invalid email format";
        }

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
            {/* Professional Navigation */}
            <div className="sticky top-0 z-40 bg-card border-b border-border shadow-sm px-4 py-3 sm:py-4 sm:px-10">
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                    <div className="flex items-center gap-4 md:gap-6">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.push(from === 'dashboard' ? '/dashboard' : '/sales')}
                            className="h-9 w-9 md:h-10 md:w-10 border-border hover:bg-accent transition-colors shrink-0"
                        >
                            <IconArrowLeft className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                        </Button>
                        <div className="h-10 w-[1px] bg-border hidden md:block" />
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <IconLayoutDashboard className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em] font-mono">Sales Terminal</span>
                            </div>
                            <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight leading-none">Edit Sale</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            onClick={handleSubmit}
                            className="h-10 md:h-11 px-6 md:px-10 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-wider gap-2 shadow-lg shadow-primary/20 transition-all rounded-lg active:scale-95 text-xs md:text-sm flex-1 md:flex-none"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Updating..." : "Update Sale"}
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-4 py-8 sm:px-10">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-4 gap-10">
                    <div className="xl:col-span-3 space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Customer Section */}
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
                                                        placeholder="Search Name, Email or Phone..."
                                                        className="pl-12 h-14 text-base border-border focus-visible:ring-primary/20 rounded-xl transition-all bg-background"
                                                        value={customerSearch}
                                                        onChange={(e) => setCustomerSearch(e.target.value)}
                                                    />
                                                </div>
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

                            {/* Order Metadata */}
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
                                        <div className="flex bg-muted/20 rounded-xl px-5 py-4 items-center gap-3 border border-border focus-within:border-primary/50 transition-all">
                                            <IconCalendarEvent className="h-5 w-5 text-muted-foreground" />
                                            <input
                                                className="bg-transparent border-none focus:ring-0 text-lg font-black text-foreground w-full uppercase tracking-tight"
                                                value={salesRefId}
                                                onChange={(e) => setSalesRefId(e.target.value)}
                                                placeholder="REF-XXXX-XXXX"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Service Entry */}
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
                                        <Select value={currentServiceId} onValueChange={setCurrentServiceId}>
                                            <SelectTrigger className="h-12 rounded-xl border-border focus:ring-primary/20 text-foreground font-bold text-base bg-background">
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
                                    </div>
                                    <div className="md:col-span-3 space-y-2">
                                        <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground ml-1">Market Rate (₹)</Label>
                                        <div className="relative">
                                            <IconCurrencyRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />
                                            <Input
                                                type="number"
                                                className="h-12 pl-12 text-lg font-black border-border rounded-xl focus-visible:ring-emerald-500/10 transition-all bg-background"
                                                value={customPrice}
                                                onChange={(e) => setCustomPrice(e.target.value)}
                                                placeholder="0.00"
                                            />
                                        </div>
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
                                                <><IconUserCheck className="h-4 w-4" /> Update Item</>
                                            ) : (
                                                <><IconPlus className="h-4 w-4" /> Append Item</>
                                            )}
                                        </Button>
                                        {editingIndex !== null && (
                                            <Button type="button" variant="outline" className="h-12 w-12 rounded-xl border-border" onClick={cancelEdit}>
                                                <IconX className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Cart Table */}
                        <Card className="border-border shadow-md bg-card rounded-2xl overflow-hidden">
                            <CardHeader className="bg-muted/30 border-b border-border py-4 px-8">
                                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                    <IconReceipt2 className="h-4 w-4" />
                                    Billed Cart Details
                                </CardTitle>
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
                                            {selectedServices.map((service, index) => (
                                                <TableRow key={index} className={cn(
                                                    "border-b border-border last:border-0",
                                                    editingIndex === index ? "bg-orange-500/5" : "hover:bg-muted/30"
                                                )}>
                                                    <TableCell className="py-6 px-8">
                                                        <div className="flex flex-col">
                                                            <span className="text-base font-black text-foreground mb-1.5">{service.name}</span>
                                                            <span className="text-[10px] font-mono font-bold text-muted-foreground">ID: {service.serviceId.substring(0, 8).toUpperCase()}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right py-6 px-8">
                                                        <span className="text-lg font-black tracking-tighter">₹{service.price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                    </TableCell>
                                                    <TableCell className="px-8 flex justify-end gap-2 py-6">
                                                        <Button type="button" variant="ghost" size="icon" onClick={() => handleEditService(index)}>
                                                            <IconPencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveService(index)}>
                                                            <IconTrash className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
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
                                        <div className="mt-6 flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-primary">₹</span>
                                            <span className="text-6xl font-black tracking-tighter">{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-10 px-8 pb-10 space-y-10">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Paid Amount</Label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-xl">₹</div>
                                            <Input
                                                id="paid"
                                                type="number"
                                                className="h-14 pl-10 border-border rounded-2xl font-black text-2xl text-foreground bg-emerald-500/5"
                                                value={paidAmount}
                                                onChange={(e) => setPaidAmount(e.target.value)}
                                            />
                                        </div>
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

                                    <div className="bg-muted p-6 rounded-3xl border border-border">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Net Balance</span>
                                        <div className={cn("text-3xl font-black tracking-tighter mt-2", totalAmount - Number(paidAmount) > 0 ? "text-destructive" : "text-emerald-500")}>
                                            ₹{(totalAmount - Number(paidAmount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-16 bg-foreground text-background hover:bg-foreground/90 text-sm font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? "Updating..." : "Update Sale"}
                                        <IconChevronRight className="h-5 w-5 ml-2" />
                                    </Button>
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
        </div>
    );
}
