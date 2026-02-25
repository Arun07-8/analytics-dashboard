"use client"

import * as React from "react"
import Link from "next/link"
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
  IconPlus,
  IconUserPlus,
  IconClipboardList,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Sales",
      url: "/sales",
      icon: IconChartBar,
    },
    {
      title: "Expenses",
      url: "/expenses",
      icon: IconReport,
      role: "admin",
    },
    {
      title: "Sales Requests",
      url: "/sales-requests",
      icon: IconClipboardList,
      role: "admin",
    },
    {
      title: "Services",
      url: "/services",
      icon: IconListDetails,
    },
    {
      title: "Customers",
      url: "/customers",
      icon: IconUsers,
    },
    {
      title: "Create Admin",
      url: "/createAdmin",
      icon: IconUserPlus,
      role: "admin",
    },
  ],

}

export function AppSidebar({ ...props }) {
  const { user, loading } = useAuth()
  const db = getFirestore()



  const role = user?.role?.trim().toLowerCase()

  // Filter navigation based on role
  const filteredNavMain = data.navMain
    .filter((item) => {
      // If an item has a required role, check it
      if (item.role && item.role !== role) {
        return false
      }

      // Requirement: Staff can access Sales, Services, and Customers
      if (role === "staff") {
        const allowedForStaff = ["Sales", "Services", "Customers"]
        if (!allowedForStaff.includes(item.title)) {
          return false
        }
      }

      // Backup: Hide Dashboard for non-admins if not explicitly marked
      if (item.title === "Dashboard" && role !== "admin") {
        return false
      }

      return true
    })
    .map((item) => ({
      ...item,
      hasSeparator:
        (item.title === "Customers" && role !== "admin") ||
        (item.title === "Create Admin" && role === "admin"),
    }))

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="h-14 mb-4 p-0 hover:bg-transparent focus-visible:ring-0">
              <Link href="/" className="flex h-full w-full items-center justify-start px-3">
                <img
                  src="/Foxon Final Logo-02.png"
                  alt="FoxonHub Logo"
                  className="h-25 pl-4 w-full object-contain object-left dark:brightness-0 dark:invert"
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground justify-center gap-2 shadow-md h-10"
            >
              <Link href="/sales/create">
                <IconPlus className="size-4" />
                <span className="font-semibold">Create Sale</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
      </SidebarContent>
      <SidebarFooter>
        {loading ? (
          <div className="h-14 px-4 flex items-center text-sm text-muted-foreground">
            Loading profile...
          </div>
        ) : user ? (
          <NavUser user={user} />
        ) : null}
      </SidebarFooter>
    </Sidebar>
  );
}
