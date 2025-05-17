
import { Link } from "react-router-dom";
import { Bell, MessageCircle, Search, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center md:hidden">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="hidden md:flex flex-1 items-center">
            <div className="relative w-full max-w-xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input 
                placeholder="Search by name, skill, or use natural language..." 
                className="pl-10 pr-4 rounded-full border-gray-200 focus:border-supernet-purple"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-1 md:space-x-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/messaging">
                <MessageCircle className="h-5 w-5 text-gray-600" />
              </Link>
            </Button>
            
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="sr-only">Notifications</span>
            </Button>
            
            <div className="relative ml-3">
              <Button variant="ghost" size="icon" asChild className="rounded-full overflow-hidden">
                <Link to="/profile">
                  <User className="h-5 w-5 text-gray-600" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile search (shown when menu is open) */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden px-4 pb-4`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Natural language search..." 
            className="pl-10 pr-4 w-full rounded-full border-gray-200 focus:border-supernet-purple"
          />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
