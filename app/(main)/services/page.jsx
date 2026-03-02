'use client';

import { useState, useEffect, useMemo } from 'react';
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
    IconPackage,
    IconCircleCheckFilled,
    IconCircleXFilled,
    IconAlertTriangle,
    IconTrendingUp,
    IconStar,
    IconChevronDown,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { getAllServices, createService, updateService, deleteService, subscribeToSales } from "@/lib/firebase";

// Reusable components
import { SectionCards } from "@/components/section-cards";
import { ServiceModal } from "@/components/services/service-modal";
import { ServicesTable } from "@/components/services/services-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IconCalendar, IconChartBar } from "@tabler/icons-react";

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
        <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
            {/* Stats Cards - Matching Dashboard SectionCards style */}
            <div
                className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
                <Card className="@container/card relative overflow-hidden">
                    <CardHeader>
                        <CardDescription className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Services</CardDescription>
                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                            {services.length}
                        </CardTitle>
                        <div className="absolute top-4 right-4 p-2 rounded-lg bg-primary/10">
                            <IconPackage className="size-6 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-col items-start gap-1.5 text-sm pt-0">
                        <div className="line-clamp-1 flex gap-2 font-medium">
                            Full catalog <IconPackage className="size-4" />
                        </div>
                        <div className="text-muted-foreground">
                            All registered service offerings
                        </div>
                    </CardContent>
                </Card>

                <Card className="@container/card relative overflow-hidden">
                    <CardHeader>
                        <CardDescription className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active Services</CardDescription>
                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-green-600">
                            {services.filter(s => s.isActive).length}
                        </CardTitle>
                        <div className="absolute top-4 right-4 p-2 rounded-lg bg-green-500/10">
                            <IconCircleCheckFilled className="size-6 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-col items-start gap-1.5 text-sm pt-0">
                        <div className="line-clamp-1 flex gap-2 font-medium">
                            Currently live <IconTrendingUp className="size-4 text-green-600" />
                        </div>
                        <div className="text-muted-foreground">
                            Available for customers
                        </div>
                    </CardContent>
                </Card>

                <Card className="@container/card relative overflow-hidden">
                    <CardHeader>
                        <CardDescription className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Inactive Services</CardDescription>
                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-orange-600">
                            {services.filter(s => !s.isActive).length}
                        </CardTitle>
                        <div className="absolute top-4 right-4 p-2 rounded-lg bg-orange-500/10">
                            <IconCircleXFilled className="size-6 text-orange-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-col items-start gap-1.5 text-sm pt-0">
                        <div className="line-clamp-1 flex gap-2 font-medium">
                            Service pause <IconCircleXFilled className="size-4 text-orange-600" />
                        </div>
                        <div className="text-muted-foreground">
                            Hidden from public view
                        </div>
                    </CardContent>
                </Card>

                <Card className="@container/card relative overflow-hidden ring-1 ring-primary/20 bg-primary/[0.02]">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardDescription className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Top Performer</CardDescription>
                            <Badge variant="outline" className="text-[9px] uppercase font-bold border-amber-500/20 text-amber-600 dark:text-amber-400 bg-amber-500/5">
                                {usagePeriod === 'all' ? 'Lifetime' : usagePeriod.replace('-', ' ')}
                            </Badge>
                        </div>
                        <CardTitle className="text-xl font-bold tabular-nums @[250px]/card:text-2xl text-primary mt-1 truncate">
                            {topPerformer.name.toUpperCase()}
                        </CardTitle>
                        <div className="absolute top-12 right-4 opacity-30 drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]">
                            <IconStar style={{ color: '#FFD700', fill: '#FFD700' }} className="size-12" />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-col items-start gap-1.5 text-sm pt-0">
                        <div className="line-clamp-1 flex gap-2 font-black text-primary">
                            {topPerformer.count} <span className="font-medium text-muted-foreground">Interactions</span>
                        </div>
                        <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 focus:bg-primary/10 px-1 rounded transition-colors italic">
                            Linked to Graph Scale
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Services Table Content - Fixed 5 Rows Limit */}
            <ServicesTable
                data={filteredServices}
                pageSize={5}
                usageData={usageDataFiltered}
                usagePeriod={usagePeriod}
                onUsagePeriodChange={setUsagePeriod}
                fromDate={fromDate}
                setFromDate={setFromDate}
                toDate={toDate}
                setToDate={setToDate}
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

            {/* Reusable Modals */}
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

            {/* Delete Confirmation Dialog */}
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