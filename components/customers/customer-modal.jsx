'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IconUser, IconPencil } from "@tabler/icons-react";

export function CustomerModal({
    isOpen,
    onOpenChange,
    mode = 'add',
    formData,
    onInputChange,
    onSubmit,
    onCancel,
    isLoading = false,
    errors = {}
}) {
    const isEdit = mode === 'edit';

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        {isEdit ? (
                            <IconPencil className="h-6 w-6 text-primary" />
                        ) : (
                            <IconUser className="h-6 w-6 text-primary" />
                        )}
                        {isEdit ? 'Edit Customer' : 'Add New Customer'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? 'Update the customer profile information'
                            : 'Create a new customer profile in the system'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Full Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            name="name"
                            value={formData.name || ''}
                            onChange={onInputChange}
                            placeholder="John Doe"
                            required
                            className={`transition-all duration-200 focus:ring-2 ${errors.name ? 'border-destructive focus:ring-destructive' : ''}`}
                        />
                        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="mobile">
                            Mobile Number <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="mobile"
                            name="mobile"
                            value={formData.mobile || ''}
                            onChange={onInputChange}
                            placeholder="+1 234 567 890"
                            required
                            className={`transition-all duration-200 focus:ring-2 ${errors.mobile ? 'border-destructive focus:ring-destructive' : ''}`}
                        />
                        {errors.mobile && <p className="text-xs text-destructive mt-1">{errors.mobile}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email || ''}
                            onChange={onInputChange}
                            placeholder="email@example.com"
                            className={`transition-all duration-200 focus:ring-2 ${errors.email ? 'border-destructive focus:ring-destructive' : ''}`}
                        />
                        {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                    </div>


                    <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                            id="country"
                            name="country"
                            value={formData.country || ''}
                            onChange={onInputChange}
                            placeholder="United Arab Emirates"
                            className="transition-all duration-200 focus:ring-2"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="state">State / Province</Label>
                        <Input
                            id="state"
                            name="state"
                            value={formData.state || ''}
                            onChange={onInputChange}
                            placeholder="Dubai"
                            className="transition-all duration-200 focus:ring-2"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                            id="city"
                            name="city"
                            value={formData.city || ''}
                            onChange={onInputChange}
                            placeholder="Dubai City"
                            className="transition-all duration-200 focus:ring-2"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="place">Place / Area</Label>
                        <Input
                            id="place"
                            name="place"
                            value={formData.place || ''}
                            onChange={onInputChange}
                            placeholder="Business Bay"
                            className="transition-all duration-200 focus:ring-2"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="pincode">Pincode / Zip Code</Label>
                        <Input
                            id="pincode"
                            name="pincode"
                            value={formData.pincode || ''}
                            onChange={onInputChange}
                            placeholder="00000"
                            className="transition-all duration-200 focus:ring-2"
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Full Address</Label>
                        <Input
                            id="address"
                            name="address"
                            value={formData.address || ''}
                            onChange={onInputChange}
                            placeholder="Building name, Street address, etc."
                            className="transition-all duration-200 focus:ring-2"
                        />
                    </div>

                    <div className="flex gap-3 pt-6 md:col-span-2">
                        <Button
                            type="submit"
                            className="flex-1 shadow-md hover:shadow-lg transition-all duration-300"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Saving...' : (isEdit ? 'Update Customer' : 'Add Customer')}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            className="flex-1"
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
