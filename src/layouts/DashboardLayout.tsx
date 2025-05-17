
import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useState } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Only show search in the header when not on the search page
  const showHeaderSearch = location.pathname !== "/search";
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        {showHeaderSearch && (
          <div className="px-4 py-2 border-b flex justify-center">
            <form onSubmit={handleSearch} className="w-full max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Search for people, skills, or roles..."
                  className="w-full pl-10 pr-20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button 
                  type="submit" 
                  size="sm" 
                  className="absolute right-1 top-1/2 transform -translate-y-1/2"
                >
                  Search
                </Button>
              </div>
            </form>
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto page-transition">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
