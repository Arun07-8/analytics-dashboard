'use client';

import { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
    IconPackage,
    IconCircleCheckFilled,
    IconCircleXFilled,
    IconAlertTriangle,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { getAllServices, createService, updateService, deleteService } from "@/lib/firebase";

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
        <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full transition-all duration-700 animate-in fade-in slide-in-from-bottom-2">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/40">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </div>
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest font-mono">
                            Service Catalog
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-none bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Business Services
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                        Manage and configure your service offerings.
                    </p>
                </div>
            </div>

            {/* Stats Cards - Unified Dashboard Design */}
            <SectionCards cards={stats} />

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