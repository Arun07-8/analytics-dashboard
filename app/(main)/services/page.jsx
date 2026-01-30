'use client';

import { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Trash2, Search, Package, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

// Mark this page as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

export default function ServicesPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [services, setServices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);

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

    // Load services from localStorage on mount
    useEffect(() => {
        const savedServices = localStorage.getItem('services');
        if (savedServices) {
            setServices(JSON.parse(savedServices));
        } else {
            // Initialize with sample data
            const sampleServices = [
                {
                    id: 1,
                    name: 'Web Development',
                    description: 'Custom website development with modern technologies',
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 2,
                    name: 'Mobile App Development',
                    description: 'Native and cross-platform mobile applications',
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 3,
                    name: 'UI/UX Design',
                    description: 'User interface and experience design services',
                    isActive: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];
            setServices(sampleServices);
            localStorage.setItem('services', JSON.stringify(sampleServices));
        }
    }, []);

    // Save services to localStorage whenever they change
    useEffect(() => {
        if (services.length > 0) {
            localStorage.setItem('services', JSON.stringify(services));
        }
    }, [services]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleEditInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            isActive: true
        });
    };

    const handleAddService = (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Service name is required');
            return;
        }

        const newService = {
            id: Date.now(),
            name: formData.name,
            description: formData.description || '',
            isActive: formData.isActive,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        setServices(prev => [...prev, newService]);
        toast.success('Service added successfully!');
        setIsAddDialogOpen(false);
        resetForm();
    };

    const handleEditService = (e) => {
        e.preventDefault();

        if (!editFormData.name.trim()) {
            toast.error('Service name is required');
            return;
        }

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

        toast.success('Service updated successfully!');
        setIsEditDialogOpen(false);
        setEditingService(null);
    };

    const handleDeleteService = (id) => {
        if (window.confirm('Are you sure you want to delete this service?')) {
            setServices(prev => prev.filter(service => service.id !== id));
            toast.success('Service deleted successfully!');
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

    const filteredServices = services.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Show loading state
    if (loading) {
        return (
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading...</p>
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
        <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-6 py-4 md:py-6">
                {/* Header Section */}
                <div className="px-4 lg:px-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Services Management</h1>
                            <p className="text-muted-foreground">
                                Manage your services and their availability
                            </p>
                        </div>
                        <Button
                            onClick={() => setIsAddDialogOpen(true)}
                            className="shadow-lg hover:shadow-xl transition-all duration-300 gap-2"
                        >
                            <Package className="h-4 w-4" />
                            Add Service
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="px-4 lg:px-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="border-l-4 border-l-primary shadow-md hover:shadow-lg transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Services</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{services.length}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    All service offerings
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Services</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    {services.filter(s => s.isActive).length}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Currently available
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-orange-500 shadow-md hover:shadow-lg transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Inactive Services</CardTitle>
                                <XCircle className="h-4 w-4 text-orange-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-600">
                                    {services.filter(s => !s.isActive).length}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Not available
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Services Table */}
                <div className="px-4 lg:px-6">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <CardTitle>All Services</CardTitle>
                                    <CardDescription className="mt-1">
                                        View and manage all your service offerings
                                    </CardDescription>
                                </div>
                                <div className="relative w-full md:w-72">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search services..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 transition-all duration-200 focus:ring-2"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="font-semibold">Service Name</TableHead>
                                            <TableHead className="font-semibold">Description</TableHead>
                                            <TableHead className="font-semibold">Status</TableHead>
                                            <TableHead className="font-semibold">Created At</TableHead>
                                            <TableHead className="text-right font-semibold">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredServices.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-12">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Package className="h-12 w-12 text-muted-foreground/50" />
                                                        <p className="text-muted-foreground">
                                                            {searchTerm ? 'No services found matching your search' : 'No services yet. Add your first service!'}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredServices.map((service) => (
                                                <TableRow
                                                    key={service.id}
                                                    className="hover:bg-muted/50 transition-colors duration-200"
                                                >
                                                    <TableCell className="font-medium">{service.name}</TableCell>
                                                    <TableCell className="max-w-xs truncate">
                                                        {service.description || '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={service.isActive ? 'default' : 'secondary'}
                                                            className={service.isActive
                                                                ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900'
                                                                : 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300'
                                                            }
                                                        >
                                                            {service.isActive ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {new Date(service.createdAt).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => openEditDialog(service)}
                                                                className="hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDeleteService(service.id)}
                                                                className="hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Add Service Dialog */}
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Add New Service
                            </DialogTitle>
                            <DialogDescription>
                                Create a new service offering
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddService} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="add-name">
                                    Service Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="add-name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Web Development"
                                    required
                                    className="transition-all duration-200 focus:ring-2"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="add-description">Description</Label>
                                <Input
                                    id="add-description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Brief description of the service"
                                    className="transition-all duration-200 focus:ring-2"
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="add-isActive"
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                                />
                                <Label htmlFor="add-isActive" className="cursor-pointer">
                                    Active Service
                                </Label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button type="submit" className="flex-1 shadow-md hover:shadow-lg transition-all duration-300">
                                    Add Service
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsAddDialogOpen(false);
                                        resetForm();
                                    }}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Service Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Pencil className="h-5 w-5" />
                                Edit Service
                            </DialogTitle>
                            <DialogDescription>
                                Update the service details below
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleEditService} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">
                                    Service Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="edit-name"
                                    name="name"
                                    value={editFormData.name}
                                    onChange={handleEditInputChange}
                                    placeholder="e.g., Web Development"
                                    required
                                    className="transition-all duration-200 focus:ring-2"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-description">Description</Label>
                                <Input
                                    id="edit-description"
                                    name="description"
                                    value={editFormData.description}
                                    onChange={handleEditInputChange}
                                    placeholder="Brief description of the service"
                                    className="transition-all duration-200 focus:ring-2"
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="edit-isActive"
                                    checked={editFormData.isActive}
                                    onCheckedChange={(checked) => setEditFormData(prev => ({ ...prev, isActive: checked }))}
                                />
                                <Label htmlFor="edit-isActive" className="cursor-pointer">
                                    Active Service
                                </Label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button type="submit" className="flex-1 shadow-md hover:shadow-lg transition-all duration-300">
                                    Update Service
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditDialogOpen(false);
                                        setEditingService(null);
                                    }}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}