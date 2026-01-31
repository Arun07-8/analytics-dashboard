'use client';
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DashboardTable } from "@/components/dashboard/sections-table"
import { SectionCards } from "@/components/section-cards"
import { Button } from "@/components/ui/button";
import { IconUserPlus } from "@tabler/icons-react";
import { CustomerModal } from "@/components/customers/customer-modal";
import { createCustomer, getCustomerByEmail, getCustomerByMobile } from "@/lib/firebase/collections";
import { toast } from "sonner";
import data from "../data.json"

// Mark this page as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

export default function Page() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const initialCustomerFormData = {
    name: '',
    mobile: '',
    email: '',
    country: '',
    place: '',
    state: '',
    city: '',
    pincode: '',
    address: ''
  };

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerErrors, setCustomerErrors] = useState({});
  const [customerFormData, setCustomerFormData] = useState(initialCustomerFormData);

  const resetCustomerForm = () => {
    setCustomerFormData(initialCustomerFormData);
    setCustomerErrors({});
  };

  useEffect(() => {
    // If auth is loaded and user is not authenticated, redirect to login
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleCustomerInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (customerErrors[name]) {
      setCustomerErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();

    // Initial validation
    const errors = {};
    if (!customerFormData.name.trim()) errors.name = "Full Name is required";
    if (!customerFormData.mobile.trim()) {
      errors.mobile = "Mobile Number is required";
    } else if (!/^\+?[\d\s-]{10,}$/.test(customerFormData.mobile)) {
      errors.mobile = "Invalid mobile number format";
    }

    if (customerFormData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerFormData.email)) {
      errors.email = "Invalid email format";
    }

    if (Object.keys(errors).length > 0) {
      setCustomerErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);

      // Check for duplicates in DB
      const mobileExists = await getCustomerByMobile(customerFormData.mobile);
      if (mobileExists) {
        setCustomerErrors(prev => ({ ...prev, mobile: "Mobile number already exists" }));
        setIsSubmitting(false);
        return;
      }

      if (customerFormData.email) {
        const emailExists = await getCustomerByEmail(customerFormData.email);
        if (emailExists) {
          setCustomerErrors(prev => ({ ...prev, email: "Email already exists" }));
          setIsSubmitting(false);
          return;
        }
      }

      await createCustomer(customerFormData);
      toast.success("Customer added successfully");
      setIsCustomerModalOpen(false);
      resetCustomerForm();
    } catch (error) {
      console.error("Error creating customer:", error);
      toast.error(error.message || "Failed to add customer");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-center justify-between px-4 lg:px-6">
          <h1 className="text-2xl font-bold tracking-tight">Sales Dashboard</h1>
          <Button
            onClick={() => setIsCustomerModalOpen(true)}
            className="flex items-center gap-2"
          >
            <IconUserPlus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>

        <SectionCards />

        <div className="px-4 lg:px-6">
          <ChartAreaInteractive />
        </div>

        <DashboardTable data={data} />
      </div>

      <CustomerModal
        isOpen={isCustomerModalOpen}
        onOpenChange={(open) => {
          setIsCustomerModalOpen(open);
          if (!open) resetCustomerForm();
        }}
        mode="add"
        formData={customerFormData}
        onInputChange={handleCustomerInputChange}
        onSubmit={handleCustomerSubmit}
        onCancel={() => {
          setIsCustomerModalOpen(false);
          resetCustomerForm();
        }}
        isLoading={isSubmitting}
        errors={customerErrors}
      />
    </div>
  )
}
