import {
  LayoutDashboard,
  MessageCircle,
  Search,
  Settings,
  User,
  Users,
} from "lucide-react"
import { usePathname } from "next/navigation"

import { ScrollArea } from "@/components/ui/scroll-area"
import { buttonVariants } from "@/components/ui/button"
import { Link } from "react-router-dom"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className, ...props }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div
      className="flex h-full w-64 flex-col border-r bg-secondary"
      {...props}
    >
      <div className="flex-1 space-y-2 p-2">
        <Link to="/" className="grid h-12 place-items-center p-3 font-semibold">
          SuperNet
        </Link>
        <ScrollArea className="py-2">
          <nav className="grid items-start px-2 text-sm font-medium">
            <Link
              to="/dashboard"
              className={buttonVariants({
                variant: pathname === "/dashboard" ? "default" : "ghost",
                size: "sm",
                className: "justify-start",
              })}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
            <Link
              to="/search"
              className={buttonVariants({
                variant: pathname === "/search" ? "default" : "ghost",
                size: "sm",
                className: "justify-start",
              })}
            >
              <Search className="mr-2 h-4 w-4" />
              Search
            </Link>
            <Link
              to="/connections"
              className={buttonVariants({
                variant: pathname === "/connections" ? "default" : "ghost",
                size: "sm",
                className: "justify-start",
              })}
            >
              <Users className="mr-2 h-4 w-4" />
              Network
            </Link>
            <Link
              to="/messaging"
              className={buttonVariants({
                variant: pathname === "/messaging" ? "default" : "ghost",
                size: "sm",
                className: "justify-start",
              })}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Messaging
            </Link>
            <Link
              to="/profile"
              className={buttonVariants({
                variant:
                  pathname === "/profile"
                    ? "default"
                    : "ghost",
                size: "sm",
                className: "justify-start",
              })}
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
            <Link
              to="/settings"
              className={buttonVariants({
                variant: pathname === "/settings" ? "default" : "ghost",
                size: "sm",
                className: "justify-start",
              })}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </nav>
        </ScrollArea>
      </div>
    </div>
  )
}
