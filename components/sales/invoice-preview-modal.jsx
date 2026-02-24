'use client';
import { useState, useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconDownload, IconX, IconLoader } from "@tabler/icons-react";
import { InvoiceTemplate } from "./invoice-template";

export function InvoicePreviewModal({
  isOpen,
  onClose,
  sale,
  customer,
  admins = [],
  onConfirmDownload
}) {
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Delay rendering the heavy invoice template to allow the modal animation to run smoothly
      // The modal animation takes about 300ms, so we wait 350ms to paint the heavy DOM.
      const timer = setTimeout(() => setShowPreview(true), 350);
      return () => clearTimeout(timer);
    } else {
      setShowPreview(false);
    }
  }, [isOpen]);

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

        <div className="mt-4 bg-gray-100 p-6 rounded-lg overflow-auto min-h-[500px] flex justify-center items-start">
          {showPreview ? (
            <div className="transform scale-90 origin-top w-full">
              <InvoiceTemplate
                sale={sale}
                customer={customer}
                admins={admins}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground w-full h-[500px] gap-2">
              <IconLoader className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs font-black uppercase tracking-widest animate-pulse">Loading Document...</p>
            </div>
          )}
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
