'use client';

import { Loader2 } from 'lucide-react';

export function PageLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-zinc-950 transition-colors duration-300">
      <Loader2 className="h-12 w-12 animate-spin text-zinc-900 dark:text-white stroke-[2]" />
    </div>
  );
}
