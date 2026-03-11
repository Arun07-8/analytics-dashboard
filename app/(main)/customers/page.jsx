'use client';

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { getAllCustomers, getAllSales, createCustomer, updateCustomer, getCustomerByMobile, getCustomerByEmail, getAllAdmins, deleteCustomer } from "@/lib/firebase/collections";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { IconPlus, IconUserPlus } from "@tabler/icons-react";
import { CustomersTable } from "@/components/customers/customers-table";
import { CustomerOrdersModal } from "@/components/customers/customer-orders-modal";
import { CustomerModal } from "@/components/customers/customer-modal";
import { SectionCards } from "@/components/section-cards";

// Mark this page as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

export default function CustomersPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    // Data states
    const [customers, setCustomers] = useState([]);
    const [sales, setSales] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    // Modal states
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Customer Form State
    const initialCustomerFormData = {
        name: '', mobile: '', email: '', country: '', place: '', state: '', city: '', pincode: '', address: ''
    };
    const [customerFormData, setCustomerFormData] = useState(initialCustomerFormData);
    const [customerErrors, setCustomerErrors] = useState({});

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    const fetchData = async () => {
        if (!user) return;
        try {
            setLoadingData(true);
            const [customersData, salesData, adminsData] = await Promise.all([
                getAllCustomers(),
                getAllSales(),
                getAllAdmins()
            ]);
            setCustomers(customersData);
            setSales(salesData);
            setAdmins(adminsData);
        } catch (error) {
            console.error("Error fetching customers data:", error);
            toast.error("Failed to load customers data");
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const customerActivityMap = useMemo(() => {
        const map = new Map();
        // Only count verified sales for activity status
        sales.filter(s => s.isVerified === true).forEach(sale => {
            map.set(sale.customerId, (map.get(sale.customerId) || 0) + 1);
        });
        return map;
    }, [sales]);

    const filteredCustomers = useMemo(() => {
        return customers.filter(customer => {
            const saleCount = customerActivityMap.get(customer.id) || 0;

            // Tab filter
            if (activeTab === 'active' && saleCount === 0) return false;
            if (activeTab === 'inactive' && saleCount > 0) return false;

            // Search filter
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return (
                customer.name?.toLowerCase().includes(query) ||
                customer.mobile?.toLowerCase().includes(query) ||
                customer.email?.toLowerCase().includes(query)
            );
        }).sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
        });
    }, [customers, searchQuery, activeTab, customerActivityMap]);

    const customerTabs = useMemo(() => {
        const counts = {
            all: customers.length,
            active: customers.filter(c => customerActivityMap.get(c.id) > 0).length,
            inactive: customers.filter(c => !(customerActivityMap.get(c.id) > 0)).length
        };

        return [
            { label: "All Customers", value: "all", badge: counts.all.toString() },
            { label: "Active", value: "active", badge: counts.active.toString() },
            { label: "Inactive", value: "inactive", badge: counts.inactive.toString() },
        ];
    }, [customers, customerActivityMap]);

    const customerOrders = useMemo(() => {
        if (!selectedCustomer) return [];
        const adminMap = new Map(admins.map(a => [a.id, a.name]));

        // Only show verified orders in the customer history for consistency with revenue
        return sales.filter(sale => sale.customerId === selectedCustomer.id && sale.isVerified === true)
            .map(sale => ({
                ...sale,
                staffName: adminMap.get(sale.staffId) || adminMap.get(sale.createdBy) || "Unknown"
            }))
            .sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                return dateB - dateA;
            });
    }, [selectedCustomer, sales, admins]);


    const stats = useMemo(() => {
        const totalCustomers = customers.length;
        const isAdmin = user?.role?.trim().toLowerCase() === 'admin';

        // Filter for verified sales only, and apply role-based filtering
        const verifiedSales = sales.filter(s => {
            if (s.isVerified !== true) return false;
            if (isAdmin) return true;
            return s.createdBy === user?.uid;
        });

        const activeCustomers = new Set(verifiedSales.map(s => s.customerId)).size;

        // Calculate revenue from verified sales only
        const totalRevenue = verifiedSales.reduce((acc, sale) => acc + (Number(sale.totalAmount) || 0), 0);

        // Calculate growth (customers and revenue)
        const now = new Date();
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // Function to get Date from Firebase Timestamp or string
        const getDate = (val) => val?.toDate ? val.toDate() : new Date(val);

        const newThisMonth = customers.filter(c => getDate(c.createdAt) >= startOfCurrentMonth).length;
        const newLastMonth = customers.filter(c => {
            const date = getDate(c.createdAt);
            return date >= startOfLastMonth && date <= endOfLastMonth;
        }).length;

        const customerGrowth = newLastMonth > 0 ? ((newThisMonth - newLastMonth) / newLastMonth) * 100 : (newThisMonth > 0 ? 100 : 0);

        const revenueThisMonth = verifiedSales.filter(s => getDate(s.createdAt) >= startOfCurrentMonth)
            .reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);
        const revenueLastMonth = verifiedSales.filter(s => {
            const date = getDate(s.createdAt);
            return date >= startOfLastMonth && date <= endOfLastMonth;
        }).reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);

        const revenueGrowth = revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 : (revenueThisMonth > 0 ? 100 : 0);

        return [
            {
                label: "Total Customers",
                value: totalCustomers,
                growth: Number(customerGrowth.toFixed(1)),
                description: "All-time registered clients"
            },
            {
                label: "New This Month",
                value: newThisMonth,
                description: "Customer growth this month"
            },
            {
                label: isAdmin ? "Active Customers" : "My Active Clients",
                value: activeCustomers,
                description: isAdmin ? "With transaction history" : "Customers you've served"
            },
        ];
    }, [customers, sales, user]);

    const handleViewOrders = (customer) => {
        setSelectedCustomer(customer);
        setIsOrdersModalOpen(true);
    };

    const handleDeleteCustomer = async (customer) => {
        try {
            await deleteCustomer(customer.id);
            toast.success(`${customer.name} removed successfully`);
            fetchData();
        } catch (error) {
            console.error("Error deleting customer:", error);
            toast.error("Failed to delete customer");
        }
    };
    const handleEditCustomer = (customer) => {
        setCustomerFormData({
            ...customer,
            id: customer.id
        });
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleSubmitCustomer = async (e) => {
        e.preventDefault();
        const errors = {};
        if (!customerFormData.name.trim()) errors.name = "Full Name is required";

        const hasMobile = customerFormData.mobile?.trim();
        const hasEmail = customerFormData.email?.trim();

        if (!hasMobile && !hasEmail) {
            errors.mobile = "Either Mobile or Email is required";
            errors.email = "Either Mobile or Email is required";
        }

        if (hasMobile && !/^\+?[\d\s-]{10,}$/.test(customerFormData.mobile)) {
            errors.mobile = "Invalid mobile number format";
        }

        if (hasEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerFormData.email)) {
            errors.email = "Invalid email format";
        }

        if (Object.keys(errors).length > 0) {
            setCustomerErrors(errors);
            return;
        }

        try {
            setIsSubmitting(true);

            // Uniqueness check
            if (hasMobile) {
                const mobileExists = await getCustomerByMobile(customerFormData.mobile);
                if (mobileExists && (modalMode === 'add' || mobileExists.id !== customerFormData.id)) {
                    setCustomerErrors(prev => ({ ...prev, mobile: "Mobile number already exists" }));
                    setIsSubmitting(false);
                    return;
                }
            }
            if (hasEmail) {
                const emailExists = await getCustomerByEmail(customerFormData.email);
                if (emailExists && (modalMode === 'add' || emailExists.id !== customerFormData.id)) {
                    setCustomerErrors(prev => ({ ...prev, email: "Email address already exists" }));
                    setIsSubmitting(false);
                    return;
                }
            }

            if (modalMode === 'add') {
                await createCustomer(customerFormData);
                toast.success("Customer added successfully");
            } else {
                const { id, ...data } = customerFormData;
                await updateCustomer(id, data);
                toast.success("Customer profile updated");
            }

            setIsModalOpen(false);
            setCustomerFormData(initialCustomerFormData);
            fetchData();
        } catch (error) {
            toast.error(modalMode === 'add' ? "Failed to add customer" : "Failed to update customer");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || loadingData) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full transition-all duration-700 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-border/40">
                <div className="space-y-1 md:space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </div>
                        <span className="text-[10px] md:text-[11px] font-bold text-muted-foreground uppercase tracking-widest font-mono">
                            Customer Registry
                        </span>
                    </div>
                    <h1 className="text-[22px] md:text-4xl font-bold tracking-tight leading-none bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Customer Management
                    </h1>
                    <p className="text-xs md:text-sm text-muted-foreground font-medium flex items-center gap-2">
                        View and manage all your clients
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <Button
                        onClick={() => {
                            setCustomerFormData(initialCustomerFormData);
                            setModalMode('add');
                            setIsModalOpen(true);
                        }}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm h-10 px-6 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center gap-2 w-full sm:w-auto"
                    >
                        <IconUserPlus className="size-4" />
                        New Customer
                    </Button>
                </div>
            </div>

            <SectionCards cards={stats} />

            <div className="space-y-4 pt-4">
                <CustomersTable
                    data={filteredCustomers}
                    onViewOrders={handleViewOrders}
                    onAddClick={() => {
                        setCustomerFormData(initialCustomerFormData);
                        setModalMode('add');
                        setIsModalOpen(true);
                    }}
                    onSearchChange={setSearchQuery}
                    tabs={customerTabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    onDeleteCustomer={handleDeleteCustomer}
                    onEditCustomer={handleEditCustomer}
                />
            </div>

            <CustomerOrdersModal
                isOpen={isOrdersModalOpen}
                onOpenChange={setIsOrdersModalOpen}
                customer={selectedCustomer}
                orders={customerOrders}
            />

            <CustomerModal
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
                mode={modalMode}
                formData={customerFormData}
                onInputChange={(e) => setCustomerFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
                onSubmit={handleSubmitCustomer}
                isLoading={isSubmitting}
                errors={customerErrors}
                onCancel={() => setIsModalOpen(false)}
            />
        </div>
    );
}
