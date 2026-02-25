'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IconPackage, IconPencil } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export function ServiceModal({
    isOpen,
    onOpenChange,
    mode = 'add',
    formData,
    onInputChange,
    onCheckedChange,
    onSubmit,
    onCancel,
    errors = {}
}) {
    const isEdit = mode === 'edit';

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isEdit ? (
                            <IconPencil className="h-5 w-5" />
                        ) : (
                            <IconPackage className="h-5 w-5" />
                        )}
                        {isEdit ? 'Edit Service' : 'Add New Service'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? 'Update the service details below'
                            : 'Create a new service offering'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor={`${mode}-name`}>
                            Service Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id={`${mode}-name`}
                            name="name"
                            value={formData.name || ''}
                            onChange={onInputChange}
                            placeholder="e.g., Web Development"
                            className={cn(
                                "transition-all duration-200 focus:ring-2",
                                errors.name && "border-destructive focus:ring-destructive"
                            )}
                        />
                        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`${mode}-description`}>Description</Label>
                        <Input
                            id={`${mode}-description`}
                            name="description"
                            value={formData.description || ''}
                            onChange={onInputChange}
                            placeholder="Brief description of the service"
                            className={cn(
                                "transition-all duration-200 focus:ring-2",
                                errors.description && "border-destructive focus:ring-destructive"
                            )}
                        />
                        {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
                    </div>

                    <div className="space-y-4">
                        {/* Price field removed as services use flexible pricing */}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`${mode}-status`}>Status</Label>
                        <Select
                            id={`${mode}-status`}
                            value={formData.isActive ? "active" : "inactive"}
                            onValueChange={(value) => onCheckedChange(value === "active")}
                        >
                            <SelectTrigger className="w-full transition-all duration-200 focus:ring-2">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1 shadow-md hover:shadow-lg transition-all duration-300">
                            {isEdit ? 'Update Service' : 'Add Service'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
