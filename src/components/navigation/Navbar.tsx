
import { useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun, Menu } from "lucide-react"
import { Link } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import GlobalSearch from "@/components/GlobalSearch";
import { NotificationsPopover } from "@/components/ui/notifications";

interface NavbarProps {
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: (isOpen: boolean) => void;
}

export function Navbar({ isSidebarOpen, setIsSidebarOpen }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="border-b bg-background sticky top-0 z-50">
      <div className="flex h-16 items-center px-4">
        {setIsSidebarOpen && (
          <Button
            variant="ghost"
            className="mr-4 md:hidden"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">{isSidebarOpen ? "Close" : "Open"} sidebar</span>
          </Button>
        )}
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
          
          {user && <NotificationsPopover />}
          
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.email ? `https://avatar.vercel.sh/${user.email}.svg` : undefined} />
                  <AvatarFallback>
                    {user?.email?.charAt(0) || 'U'}
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
              <DropdownMenuItem onClick={signOut}>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
