'use client';

import { useState, useEffect, useMemo } from 'react';
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
    IconPackage,
    IconCircleCheckFilled,
    IconCircleXFilled,
    IconAlertTriangle,
    IconStar,
    IconPlus,
    IconCalendar,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getAllServices, createService, updateService, deleteService, subscribeToSales } from "@/lib/firebase";

// Reusable components
import { SectionCards } from "@/components/section-cards";
import { ServiceModal } from "@/components/services/service-modal";
import { ServicesTable } from "@/components/services/services-table";

// Mark this page as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

export default function ServicesPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [services, setServices] = useState([]);
    const [sales, setSales] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [usagePeriod, setUsagePeriod] = useState('all');
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [deletingServiceId, setDeletingServiceId] = useState(null);
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isActive: true
    });

    const [editFormData, setEditFormData] = useState({
        name: '',
        description: '',
        isActive: true
    });

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // Load services from Firestore on mount
    useEffect(() => {
        const fetchServices = async () => {
            try {
                setIsLoadingData(true);
                const data = await getAllServices();
                const formattedData = data.map(service => ({
                    ...service,
                    createdAt: service.createdAt?.toDate ? service.createdAt.toDate().toISOString() : service.createdAt,
                    updatedAt: service.updatedAt?.toDate ? service.updatedAt.toDate().toISOString() : service.updatedAt
                }));
                setServices(formattedData);
            } catch (error) {
                console.error("Error fetching services:", error);
                toast.error("Failed to load services");
            } finally {
                setIsLoadingData(false);
            }
        };

        if (user) {
            fetchServices();
        }
    }, [user]);

    // Track usage counts from sales
    useEffect(() => {
        if (!user) return;
        const unsub = subscribeToSales({}, (data) => {
            setSales(data);
        });
        return () => unsub();
    }, [user]);

    // Aggregate usage data for the chart with advanced filtering
    const usageDataFiltered = useMemo(() => {
        const now = new Date();
        let fromDate = new Date(0); // Lifetime by default
        let toDate = new Date();

        if (usagePeriod === 'today') {
            fromDate = new Date(now.setHours(0, 0, 0, 0));
        } else if (usagePeriod === 'yesterday') {
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            fromDate = new Date(yesterday.setHours(0, 0, 0, 0));
            toDate = new Date(yesterday.setHours(23, 59, 59, 999));
        } else if (usagePeriod === 'this-week') {
            const first = now.getDate() - now.getDay();
            fromDate = new Date(now.setDate(first));
            fromDate.setHours(0, 0, 0, 0);
        } else if (usagePeriod === 'this-month') {
            fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
            fromDate.setHours(0, 0, 0, 0);
        } else if (usagePeriod === 'this-year') {
            fromDate = new Date(now.getFullYear(), 0, 1);
            fromDate.setHours(0, 0, 0, 0);
        } else if (usagePeriod === 'specific-day') {
            if (!fromDate) return [];
            const d = new Date(fromDate);
            d.setHours(0, 0, 0, 0);
            const start = d;
            const end = new Date(d);
            end.setHours(23, 59, 59, 999);

            const counts = {};
            sales.forEach(sale => {
                const saleDate = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt);
                if (saleDate >= start && saleDate <= end) {
                    if (sale.services && Array.isArray(sale.services)) {
                        sale.services.forEach(s => {
                            const name = s.name || 'Unknown Service';
                            counts[name] = (counts[name] || 0) + 1;
                        });
                    }
                }
            });
            return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 9);
        } else if (usagePeriod === 'custom') {
            if (!fromDate && !toDate) return [];
            const start = fromDate ? new Date(fromDate) : new Date(0);
            if (fromDate) start.setHours(0, 0, 0, 0);
            const end = toDate ? new Date(toDate) : new Date();
            if (toDate) end.setHours(23, 59, 59, 999);

            const counts = {};
            sales.forEach(sale => {
                const saleDate = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt);
                if (saleDate >= start && saleDate <= end) {
                    if (sale.services && Array.isArray(sale.services)) {
                        sale.services.forEach(s => {
                            const name = s.name || 'Unknown Service';
                            counts[name] = (counts[name] || 0) + 1;
                        });
                    }
                }
            });
            return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 9);
        }

        const counts = {};
        sales.forEach(sale => {
            const saleDate = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt);
            if (saleDate >= fromDate && saleDate <= toDate) {
                if (sale.services && Array.isArray(sale.services)) {
                    sale.services.forEach(s => {
                        const name = s.name || 'Unknown Service';
                        counts[name] = (counts[name] || 0) + 1;
                    });
                }
            }
        });

        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 9);
    }, [sales, usagePeriod]);

    const topPerformer = useMemo(() => {
        return usageDataFiltered[0] || { name: 'No Data', count: 0 };
    }, [usageDataFiltered]);

    const handleInputChange = (setFn) => (e) => {
        const { name, value, type, checked } = e.target;
        setFn(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleCheckedChange = (setFn) => (checked) => {
        setFn(prev => ({ ...prev, isActive: checked }));
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            isActive: true
        });
    };

    const handleAddService = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Service name is required');
            return;
        }

        try {
            const serviceId = await createService({
                name: formData.name,
                description: formData.description || '',
                isActive: formData.isActive
            });

            const newService = {
                id: serviceId,
                name: formData.name,
                description: formData.description || '',
                isActive: formData.isActive,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            setServices(prev => [...prev, newService]);
            toast.success('Service added successfully!', {
                description: `${formData.name} has been added to your services.`
            });
            setIsAddDialogOpen(false);
            resetForm();
        } catch (error) {
            console.error("Error adding service:", error);
            toast.error("Failed to add service");
        }
    };

    const handleEditService = async (e) => {
        e.preventDefault();

        if (!editFormData.name.trim()) {
            toast.error('Service name is required');
            return;
        }

        try {
            await updateService(editingService.id, {
                name: editFormData.name,
                description: editFormData.description || '',
                isActive: editFormData.isActive
            });

            setServices(prev => prev.map(service =>
                service.id === editingService.id
                    ? {
                        ...service,
                        name: editFormData.name,
                        description: editFormData.description || '',
                        isActive: editFormData.isActive,
                        updatedAt: new Date().toISOString()
                    }
                    : service
            ));

            toast.info('Service updated successfully!', {
                description: `${editFormData.name} has been updated.`
            });
            setIsEditDialogOpen(false);
            setEditingService(null);
        } catch (error) {
            console.error("Error updating service:", error);
            toast.error("Failed to update service");
        }
    };

    const openDeleteDialog = (id) => {
        setDeletingServiceId(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteService = async () => {
        try {
            await deleteService(deletingServiceId);
            setServices(prev => prev.filter(service => service.id !== deletingServiceId));
            toast.warning('Service deleted successfully!', {
                description: 'The service has been removed from your list.'
            });
            setIsDeleteDialogOpen(false);
            setDeletingServiceId(null);
        } catch (error) {
            console.error("Error deleting service:", error);
            toast.error("Failed to delete service");
        }
    };

    const openEditDialog = (service) => {
        setEditingService(service);
        setEditFormData({
            name: service.name,
            description: service.description || '',
            isActive: service.isActive
        });
        setIsEditDialogOpen(true);
    };

    const filteredServices = services.filter(service => {
        const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()));

        if (activeTab === 'active') return matchesSearch && service.isActive;
        if (activeTab === 'inactive') return matchesSearch && !service.isActive;
        return matchesSearch;
    });

    const stats = [
        {
            label: "Total Services",
            value: services.length,
            icon: <IconPackage />,
            description: "All registered service offerings"
        },
        {
            label: "Active Services",
            value: services.filter(s => s.isActive).length,
            icon: <IconCircleCheckFilled />,
            description: "Available for customers"
        },
        {
            label: "Inactive Services",
            value: services.filter(s => !s.isActive).length,
            icon: <IconCircleXFilled />,
            description: "Hidden from public view"
        },
        {
            label: "Top Sales Service",
            value: topPerformer.name,
            icon: <IconStar />,
            description: `${topPerformer.count} interactions`
        }
    ];

    // Show loading state
    if (loading || isLoadingData) {
        return (
            <div className="flex items-center justify-center h-screen bg-background text-foreground">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-xs font-medium animate-pulse">Loading Services...</p>
                </div>
            </div>
        );
    }

    // Don't render page content if user is not authenticated
    if (!user) {
        return null;
    }

    return (
        <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-700">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/40">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                        </div>
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest font-mono">
                            Service Catalog
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight leading-none text-foreground">
                        Service Management
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium">
                        Manage your service offerings and track performance
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Period Selector */}
                    <div className="flex items-center gap-2 bg-card border border-border/50 rounded-xl pl-3 h-10 shadow-sm">
                        <span className="text-[11px] font-semibold text-muted-foreground shrink-0 border-r pr-3 h-full flex items-center">Period</span>
                        <Select value={usagePeriod} onValueChange={setUsagePeriod}>
                            <SelectTrigger className="bg-transparent border-none text-xs font-semibold focus:ring-0 cursor-pointer outline-none h-full px-2 w-[130px] shadow-none">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Time</SelectItem>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="yesterday">Yesterday</SelectItem>
                                <SelectItem value="this-week">This Week</SelectItem>
                                <SelectItem value="this-month">This Month</SelectItem>
                                <SelectItem value="this-year">This Year</SelectItem>
                                <SelectItem value="specific-day">Specific Date</SelectItem>
                                <SelectItem value="custom">Custom Range</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {usagePeriod === 'specific-day' && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("h-10 text-xs font-semibold bg-card border-border/50 rounded-xl shadow-sm px-3", !fromDate && "text-muted-foreground")}>
                                    <IconCalendar className="mr-2 h-3.5 w-3.5 opacity-50" />
                                    {fromDate ? format(fromDate, "dd MMM yyyy") : "Select Date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <CalendarComponent mode="single" selected={fromDate} onSelect={setFromDate} disabled={(d) => d > new Date()} initialFocus />
                            </PopoverContent>
                        </Popover>
                    )}

                    {usagePeriod === 'custom' && (
                        <div className="flex items-center gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("h-10 text-xs font-semibold bg-card border-border/50 rounded-xl shadow-sm px-3", !fromDate && "text-muted-foreground")}>
                                        <span className="text-muted-foreground mr-2">From</span>
                                        {fromDate ? format(fromDate, "dd/MM/yy") : "Select"}
                                        <IconCalendar className="ml-2 h-3.5 w-3.5 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <CalendarComponent mode="single" selected={fromDate} onSelect={setFromDate} disabled={(d) => d > new Date()} initialFocus />
                                </PopoverContent>
                            </Popover>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("h-10 text-xs font-semibold bg-card border-border/50 rounded-xl shadow-sm px-3", !toDate && "text-muted-foreground")}>
                                        <span className="text-muted-foreground mr-2">To</span>
                                        {toDate ? format(toDate, "dd/MM/yy") : "Select"}
                                        <IconCalendar className="ml-2 h-3.5 w-3.5 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <CalendarComponent mode="single" selected={toDate} onSelect={setToDate} disabled={(d) => d > new Date()} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}

                    <Button
                        onClick={() => setIsAddDialogOpen(true)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm h-10 px-6 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
                    >
                        <IconPlus className="size-4 mr-2" />
                        Add Service
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                <SectionCards cards={stats} equalWidth />

                <ServicesTable
                    data={filteredServices}
                    pageSize={5}
                    usageData={usageDataFiltered}
                    onEdit={openEditDialog}
                    onDelete={openDeleteDialog}
                    onAdd={() => setIsAddDialogOpen(true)}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    servicesCount={{
                        active: services.filter(s => s.isActive).length,
                        inactive: services.filter(s => !s.isActive).length
                    }}
                />
            </div>

            <ServiceModal
                isOpen={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                mode="add"
                formData={formData}
                onInputChange={handleInputChange(setFormData)}
                onCheckedChange={handleCheckedChange(setFormData)}
                onSubmit={handleAddService}
                onCancel={() => {
                    setIsAddDialogOpen(false);
                    resetForm();
                }}
            />

            <ServiceModal
                isOpen={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                mode="edit"
                formData={editFormData}
                onInputChange={handleInputChange(setEditFormData)}
                onCheckedChange={handleCheckedChange(setEditFormData)}
                onSubmit={handleEditService}
                onCancel={() => {
                    setIsEditDialogOpen(false);
                    setEditingService(null);
                }}
            />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <IconAlertTriangle className="h-5 w-5 text-destructive" />
                            Delete Service
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this service? This action cannot be undone.
                            The service will be permanently removed from your list.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingServiceId(null)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteService}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}