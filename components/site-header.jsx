"use client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "next-themes"
import {
  UserCircle,
  LogOut,
  Moon,
  Sun
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb"
import { ModeToggle } from "@/components/mode-toggle"
import { NotificationBell } from "@/components/notification-bell"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function SiteHeader() {
  const { user } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      document.cookie = "authToken=; path=/; max-age=0"
      document.cookie = "userId=; path=/; max-age=0"
      localStorage.setItem('logout-event', Date.now().toString())
      toast.success("Logged out")
      router.push("/login")
    } catch (error) {
      toast.error("Logout failed")
    }
  }

  return (
    <header
      className="sticky top-0 z-40 flex h-14 md:h-12 w-full shrink-0 items-center justify-between rounded-t-2xl border-b bg-background/80 backdrop-blur-md transition-all ease-linear px-4 md:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 h-9 w-9" />
        <div className="flex items-center gap-2 ml-1">
          <div className="hidden md:block">
            <DynamicBreadcrumb />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Desktop Theme Toggle */}
        <div className="hidden md:block">
          <ModeToggle />
        </div>
        
        <NotificationBell />

        {/* Mobile Profile Menu (Replaces theme toggle on mobile) */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full ring-offset-background transition-colors hover:bg-muted focus-visible:outline-none">
                <Avatar className="h-8 w-8 border border-border shadow-sm">
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold uppercase">
                    {user?.name?.charAt(0) || <UserCircle className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl shadow-xl border-border animate-in slide-in-from-top-1 duration-200">
              <DropdownMenuLabel className="px-2 py-1.5">
                <div className="flex flex-col space-y-0.5">
                  <p className="text-xs font-bold leading-none">{user?.name || "User"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <div className="px-2 py-2">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Display Mode</p>
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    variant={theme === 'light' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 px-0 rounded-md"
                    onClick={() => setTheme('light')}
                  >
                    <Sun className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 px-0 rounded-md"
                    onClick={() => setTheme('dark')}
                  >
                    <Moon className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg py-2"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span className="text-xs font-bold">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

