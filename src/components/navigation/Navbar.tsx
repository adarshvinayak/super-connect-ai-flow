import { useState } from "react"
import { useTheme } from "next-themes"
import { MoonIcon, SunIcon } from "@radix-ui/react-icons"
import { useClerk, useSession } from "@clerk/nextjs"
import { Link } from "react-router-dom"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ModeToggle } from "@/components/mode-toggle"
import GlobalSearch from "@/components/GlobalSearch";
import { NotificationsPopover } from "@/components/ui/notifications";

interface NavbarProps {
  isSidebarOpen: boolean
  setIsSidebarOpen: (isOpen: boolean) => void
}

export function Navbar({ isSidebarOpen, setIsSidebarOpen }: NavbarProps) {
  const { theme } = useTheme()
  const { signOut } = useClerk()
  const { isSignedIn, session } = useSession()
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  return (
    <div className="border-b bg-background sticky top-0 z-50">
      <div className="flex h-16 items-center px-4">
        <Button
          variant="ghost"
          className="mr-4 md:hidden"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? "Close" : "Open"}
        </Button>
        <div className="mr-4 hidden md:block">
          <nav className="flex items-center gap-x-4 text-sm font-medium">
            <Link to="/dashboard" className="transition-colors hover:text-foreground/80">
              Dashboard
            </Link>
            <Link to="/search" className="transition-colors hover:text-foreground/80">
              Search
            </Link>
            <Link to="/connections" className="transition-colors hover:text-foreground/80">
              Network
            </Link>
            <Link to="/messaging" className="transition-colors hover:text-foreground/80">
              Messaging
            </Link>
          </nav>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <GlobalSearch />
          </div>
          
          {isSignedIn && <NotificationsPopover />}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://avatar.vercel.sh/api/${session?.user.emailAddresses[0].emailAddress}.svg`} />
                  <AvatarFallback>
                    {session?.user.firstName?.charAt(0)}
                    {session?.user.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem asChild>
                <Link to="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  signOut()
                }}
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
