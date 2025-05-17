
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Users, 
  Search, 
  MessageCircle, 
  User, 
  Settings, 
  LogOut 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const Sidebar = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  const navItems = [
    { name: "Dashboard", icon: Home, href: "/dashboard" },
    { name: "Network", icon: Users, href: "/connections" },
    { name: "Search", icon: Search, href: "/search" },
    { name: "Messages", icon: MessageCircle, href: "/messaging" },
    { name: "Profile", icon: User, href: "/profile" },
    { name: "Settings", icon: Settings, href: "/settings" },
  ];

  return (
    <div className="hidden md:flex h-screen w-64 flex-col bg-white border-r border-gray-200 shadow-sm">
      <div className="flex items-center justify-center h-16 border-b border-gray-200">
        <Link to="/dashboard" className="flex items-center">
          <span className="text-2xl font-bold gradient-text">SuperNetworkAI</span>
        </Link>
      </div>

      <div className="flex flex-col justify-between flex-1 px-4 py-6">
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                location.pathname === item.href
                  ? "bg-supernet-lightpurple text-supernet-purple"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <item.icon className={cn(
                "mr-3 h-5 w-5",
                location.pathname === item.href ? "text-supernet-purple" : "text-gray-500"
              )} />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="mt-auto">
          <Button 
            variant="ghost" 
            className="w-full justify-start px-4 py-3 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100"
            onClick={() => signOut()}
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-500" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
