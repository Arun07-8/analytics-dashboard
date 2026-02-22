'use client';

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { getAllCustomers, getAllSales, createCustomer, getCustomerByMobile, getCustomerByEmail, getAllAdmins } from "@/lib/firebase/collections";
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
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
        sales.forEach(sale => {
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

        return sales.filter(sale => sale.customerId === selectedCustomer.id)
            .map(sale => ({
                ...sale,
                staffName: adminMap.get(sale.staffId) || "Unknown"
            }))
            .sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                return dateB - dateA;
            });
    }, [selectedCustomer, sales, admins]);


    const stats = useMemo(() => {
        const totalCustomers = customers.length;
        const activeCustomers = new Set(sales.map(s => s.customerId)).size;

        // Calculate revenue
        const totalRevenue = sales.reduce((acc, sale) => acc + (Number(sale.totalAmount) || 0), 0);

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

        const revenueThisMonth = sales.filter(s => getDate(s.createdAt) >= startOfCurrentMonth)
            .reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);
        const revenueLastMonth = sales.filter(s => {
            const date = getDate(s.createdAt);
            return date >= startOfLastMonth && date <= endOfLastMonth;
        }).reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);

        const revenueGrowth = revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 : (revenueThisMonth > 0 ? 100 : 0);

        return [
            { label: "Total Revenue", value: totalRevenue, prefix: "₹", isCurrency: true, growth: Number(revenueGrowth.toFixed(1)), description: "Accumulated transaction value" },
            { label: "Total Customers", value: totalCustomers, growth: Number(customerGrowth.toFixed(1)), description: "All-time registered clients" },
            { label: "New This Month", value: newThisMonth, description: "Customer growth this month" },
            { label: "Active Customers", value: activeCustomers, description: "With transaction history" },
        ];
    }, [customers, sales]);

    const handleViewOrders = (customer) => {
        setSelectedCustomer(customer);
        setIsOrdersModalOpen(true);
    };

    const handleAddCustomer = async (e) => {
        e.preventDefault();
        const errors = {};
        if (!customerFormData.name.trim()) errors.name = "Full Name is required";
        if (!customerFormData.mobile.trim()) {
            errors.mobile = "Mobile Number is required";
        } else if (!/^\+?[\d\s-]{10,}$/.test(customerFormData.mobile)) {
            errors.mobile = "Invalid mobile number format";
        }

        if (Object.keys(errors).length > 0) {
            setCustomerErrors(errors);
            return;
        }

        try {
            setIsSubmitting(true);
            const mobileExists = await getCustomerByMobile(customerFormData.mobile);
            if (mobileExists) {
                setCustomerErrors(prev => ({ ...prev, mobile: "Mobile number already exists" }));
                return;
            }
            await createCustomer(customerFormData);
            toast.success("Customer added successfully");
            setIsAddModalOpen(false);
            setCustomerFormData(initialCustomerFormData);
            fetchData();
        } catch (error) {
            toast.error("Failed to add customer");
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

    return (
        <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Customer Management</h1>
                        <p className="text-muted-foreground text-sm">View and manage all your clients</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
                            <IconUserPlus className="h-4 w-4" />
                            New Customer
                        </Button>
                    </div>
                </div>

                <SectionCards cards={stats} />

                <div className="px-4 lg:px-6">
                    <CustomersTable
                        data={filteredCustomers}
                        onViewOrders={handleViewOrders}
                        onAddClick={() => setIsAddModalOpen(true)}
                        onSearchChange={setSearchQuery}
                        tabs={customerTabs}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                    />
                </div>
            </div>

            <CustomerOrdersModal
                isOpen={isOrdersModalOpen}
                onOpenChange={setIsOrdersModalOpen}
                customer={selectedCustomer}
                orders={customerOrders}
            />

            <CustomerModal
                isOpen={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
                mode="add"
                formData={customerFormData}
                onInputChange={(e) => setCustomerFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
                onSubmit={handleAddCustomer}
                isLoading={isSubmitting}
                errors={customerErrors}
                onCancel={() => setIsAddModalOpen(false)}
            />
        </div>
    );
}
