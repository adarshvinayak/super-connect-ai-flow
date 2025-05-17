
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Map, ChevronDown, Loader2 } from "lucide-react";
import { SelectValue, SelectTrigger, SelectItem, SelectContent, Select } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserResult {
  user_id: string;
  full_name: string;
  role: string | null;
  location: string | null;
  bio: string | null;
  skills: { skill_name: string }[];
  networking_intent: string | null;
}

const SearchPage = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [allUsers, setAllUsers] = useState<UserResult[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    intent: "all",
    location: "all",
    sortBy: "relevance"
  });
  const [isLoading, setIsLoading] = useState(true);
  const [locations, setLocations] = useState<string[]>([]);
  
  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);
  
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          user_id,
          full_name,
          role,
          location,
          bio,
          skills:user_skills(skill:skills(skill_name)),
          networking_intent:user_intents(intent:intents(intent_name))
        `)
        .neq('user_id', user?.id); // Exclude current user
      
      if (userError) {
        throw userError;
      }
      
      if (!userData) {
        setAllUsers([]);
        setResults([]);
        return;
      }
      
      // Process the data to format skills and networking intent
      const processedUsers = userData.map(user => {
        // Get skill names
        const skills = (user.skills || []).map((skillEntry: any) => ({
          skill_name: skillEntry.skill?.skill_name || "Unknown"
        }));
        
        // Get networking intent
        const networking_intent = user.networking_intent && user.networking_intent.length > 0 
          ? user.networking_intent[0]?.intent?.intent_name
          : null;
        
        return {
          ...user,
          skills,
          networking_intent
        };
      });
      
      // Extract unique locations for the filter
      const uniqueLocations = Array.from(
        new Set(
          processedUsers
            .filter(user => user.location)
            .map(user => user.location)
        )
      ) as string[];
      
      setLocations(uniqueLocations);
      setAllUsers(processedUsers);
      setResults(processedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFiltersAndSearch();
  };
  
  const applyFiltersAndSearch = () => {
    let filtered = [...allUsers];
    
    // Apply search query if exists
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(user => {
        const fullName = user.full_name?.toLowerCase() || "";
        const role = user.role?.toLowerCase() || "";
        const location = user.location?.toLowerCase() || "";
        const bio = user.bio?.toLowerCase() || "";
        const skills = user.skills.map(s => s.skill_name.toLowerCase()).join(" ");
        
        return (
          fullName.includes(lowerQuery) ||
          role.includes(lowerQuery) ||
          location.includes(lowerQuery) ||
          bio?.includes(lowerQuery) ||
          skills.includes(lowerQuery)
        );
      });
    }
    
    // Filter by intent
    if (filters.intent !== "all") {
      filtered = filtered.filter(user => user.networking_intent === filters.intent);
    }
    
    // Filter by location
    if (filters.location !== "all") {
      filtered = filtered.filter(user => user.location === filters.location);
    }
    
    // Sort results
    if (filters.sortBy === "name") {
      filtered.sort((a, b) => a.full_name.localeCompare(b.full_name));
    }
    
    setResults(filtered);
  };
  
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // We'll apply filters in the next render cycle
    setTimeout(() => applyFiltersAndSearch(), 0);
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Search</h1>
      
      {/* Search bar */}
      <div className="relative">
        <form onSubmit={handleSearch}>
          <div className="flex">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search people by name, skill, or use natural language..."
                className="pl-10 py-6 pr-4 rounded-r-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button type="submit" className="rounded-l-none">
              Search
            </Button>
          </div>
        </form>
        
        <div className="mt-4 flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            <ChevronDown
              className={`h-4 w-4 ml-2 transition-transform ${
                showFilters ? "rotate-180" : ""
              }`}
            />
          </Button>
          
          <p className="text-sm text-gray-500">
            {results.length} {results.length === 1 ? "result" : "results"}
          </p>
        </div>
        
        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 border rounded-lg bg-gray-50 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium mb-2">Networking Intent</p>
                <Select
                  value={filters.intent}
                  onValueChange={(value) => handleFilterChange("intent", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select intent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Intents</SelectItem>
                    <SelectItem value="cofounder">Co-founder</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="teammate">Teammate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Location</p>
                <Select
                  value={filters.location}
                  onValueChange={(value) => handleFilterChange("location", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map(location => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Sort By</p>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => handleFilterChange("sortBy", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilters({ intent: "all", location: "all", sortBy: "relevance" });
                  setQuery("");
                  setResults(allUsers);
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Search Results */}
      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {results.length > 0 ? (
            results.map((user) => (
              <Card key={user.user_id} className="card-hover">
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <div>
                      <CardTitle>{user.full_name}</CardTitle>
                      <CardDescription>{user.role || "No role specified"}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {user.location && (
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <Map className="h-4 w-4 mr-1" />
                      {user.location}
                    </div>
                  )}
                  
                  {user.bio && (
                    <p className="text-gray-700 mb-4 line-clamp-2">{user.bio}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-1">
                    {user.skills && user.skills.length > 0 ? (
                      user.skills.map((skill, index) => (
                        <Badge key={`${user.user_id}-${index}`} variant="secondary">{skill.skill_name}</Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">No skills listed</span>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="mr-2" asChild>
                    <Link to={`/profile/${user.user_id}`}>View Profile</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to={`/messaging/${user.user_id}`}>Connect</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-lg font-medium">No results found</p>
              <p className="text-gray-500 mt-1">
                Try adjusting your search or filters to find more people
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
