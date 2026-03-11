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
      <DialogContent className="w-[95vw] sm:w-full max-w-[900px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">Invoice Preview</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Review the invoice before downloading as PDF
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 sm:mt-4 bg-gray-100/50 p-2 sm:p-6 rounded-xl overflow-x-auto no-scrollbar w-full border border-border/50">
          {showPreview ? (
            <div className="min-w-[700px] sm:min-w-0 sm:w-full transform sm:scale-95 origin-top mx-auto flex justify-center pb-8">
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

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6 w-full">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto h-11 sm:h-10 rounded-xl">
            <IconX className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={onConfirmDownload} className="w-full sm:w-auto h-11 sm:h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white">
            <IconDownload className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
