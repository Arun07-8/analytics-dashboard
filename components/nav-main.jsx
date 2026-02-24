"use client"
import * as React from "react"
import { usePathname } from "next/navigation"
import { IconCirclePlusFilled, IconMail } from "@tabler/icons-react";

import Link from "next/link"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"

export function NavMain({
  items
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <React.Fragment key={item.title}>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={item.title}
                  asChild
                  isActive={pathname === item.url}
                  className="data-[active=true]:bg-zinc-200 dark:data-[active=true]:bg-zinc-700 data-[active=true]:text-foreground">
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {item.hasSeparator && <SidebarSeparator className="my-2" />}
            </React.Fragment>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

