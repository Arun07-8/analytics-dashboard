import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"

export default function MainLayout({ children }) {
    return (
        <SidebarProvider
            style={{
                "--sidebar-width": "18rem", // Replaced calc(var(--spacing) * 72) with fixed rem for simplicity or update if you have spacing var
                "--header-height": "3rem", // Replaced calc(var(--spacing) * 12)
            }}
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
