'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";

const routeConfig = {
    'sales': 'Sales',
    'create': 'Create',
    'edit': 'Edit',
    'customers': 'Customers',
    'services': 'Services',
    'dashboard': 'Dashboard',
    'createAdmin': 'Create Admin',
};

export function DynamicBreadcrumb() {
    const pathname = usePathname();

    // Split and filter segments
    const pathSegments = pathname.split('/').filter(segment => segment !== '' && segment !== '(main)');

    return (
        <Breadcrumb className="hidden md:flex">
            <BreadcrumbList className="flex items-center flex-wrap gap-y-1">
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link href="/dashboard" className="transition-colors hover:text-foreground">Dashboard</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>

                {pathSegments.map((segment, index) => {
                    // Skip 'dashboard' if it's the first segment since we already have 'Dashboard' base
                    if (index === 0 && segment.toLowerCase() === 'dashboard') return null;

                    // Check if segment is a Firebase ID (rough check: long alphanumeric)
                    const isId = segment.length > 15 && /[a-zA-Z]/.test(segment) && /[0-9]/.test(segment);
                    const label = routeConfig[segment] || (isId ? 'Details' : segment.charAt(0).toUpperCase() + segment.slice(1));

                    const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
                    const isLast = index === pathSegments.length - 1;

                    return (
                        <React.Fragment key={href}>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage className="font-medium text-foreground">{label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link href={href} className="transition-colors hover:text-foreground">{label}</Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                        </React.Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
