'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconDownload, IconX } from "@tabler/icons-react";
import { InvoiceTemplate } from "./invoice-template";

export function InvoicePreviewModal({
  isOpen,
  onClose,
  sale,
  customer,
  admins = [],
  onConfirmDownload
}) {
  if (!sale || !customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Invoice Preview</DialogTitle>
          <DialogDescription>
            Review the invoice before downloading as PDF
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 bg-gray-100 p-6 rounded-lg overflow-auto">
          <div className="transform scale-90 origin-top">
            <InvoiceTemplate
              sale={sale}
              customer={customer}
              admins={admins}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            <IconX className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={onConfirmDownload}>
            <IconDownload className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
