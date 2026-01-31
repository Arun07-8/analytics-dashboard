'use client';

import { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
    IconPackage,
    IconCircleCheckFilled,
    IconCircleXFilled,
    IconAlertTriangle,
    IconTrendingUp,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { getAllServices, createService, updateService, deleteService } from "@/lib/firebaseCollections";

// Reusable components
import { ServiceModal } from "@/components/services/service-modal";
import { ServicesTable } from "@/components/services/services-table";

// Mark this page as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

export default function ServicesPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [services, setServices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [deletingServiceId, setDeletingServiceId] = useState(null);

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

    // Show loading state
    if (loading || isLoadingData) {
        return (
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading services...</p>
                    </div>
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
                className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
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
            </div>

            {/* Services Table Content - Using REUSABLE Components */}
            <ServicesTable
                data={filteredServices}
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