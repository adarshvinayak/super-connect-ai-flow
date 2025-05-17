
import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Map, ChevronDown, Loader2, Send } from "lucide-react";
import { SelectValue, SelectTrigger, SelectItem, SelectContent, Select } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase, getSession } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SearchPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    intent: "all",
    location: "all",
    sortBy: "relevance"
  });
  
  const [pendingConnections, setPendingConnections] = useState([]);
  
  // Fetch pending connection requests
  useEffect(() => {
    if (!user) return;
    
    const fetchPendingConnections = async () => {
      try {
        const { data, error } = await supabase
          .from('connection_requests')
          .select('receiver_id')
          .eq('sender_id', user.id)
          .eq('status', 'pending');
        
        if (error) throw error;
        setPendingConnections(data?.map(conn => conn.receiver_id) || []);
      } catch (err) {
        console.error("Error fetching pending connections:", err);
      }
    };
    
    fetchPendingConnections();
  }, [user]);
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update URL with search query
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    } else {
      setSearchParams({});
    }
    
    if (!query.trim()) {
      // If query is empty, load all users
      fetchAllUsers();
      return;
    }
    
    setIsSearching(true);
    
    try {
      // Get current session for authorization
      const session = await getSession();
      
      // Call the AI search edge function
      const response = await fetch(`https://dvdkihicwovcfbwlfmrk.supabase.co/functions/v1/ai-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          query: query
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to search");
      }

      const data = await response.json();
      
      if (data.success && data.results) {
        // Process the results to match our UI format
        const formattedResults = data.results.map(user => {
          // Extract skills from the nested structure
          const skills = user.skills?.map(skillObj => skillObj.skill?.skill_name).filter(Boolean) || [];
          
          // Extract intents if available
          const intents = user.intents?.map(intentObj => intentObj.intent?.intent_name).filter(Boolean) || [];
          
          return {
            id: user.user_id,
            name: user.full_name,
            role: user.role || "Professional",
            location: user.location || "Location not specified",
            skills: skills,
            bio: user.bio || "No bio available",
            networkingIntent: intents[0] || "not specified",
            matchExplanation: user.match_explanation || null
          };
        });
        
        setResults(formattedResults);
      } else {
        // If there's an issue with the search, fall back to basic filtering
        console.log("AI search returned no results, falling back to basic search");
        await fetchAllUsers();
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search error: " + (error.message || "Failed to perform search"));
      
      // Fall back to basic search
      await fetchAllUsers();
    } finally {
      setIsSearching(false);
    }
  };
  
  const fetchAllUsers = async () => {
    try {
      // Basic user search in the database
      const { data: users, error } = await supabase
        .from('users')
        .select(`
          user_id,
          full_name,
          bio,
          location,
          role,
          skills:user_skills(skill:skills(skill_name))
        `)
        .neq('user_id', user?.id); // Exclude current user
      
      if (error) throw error;
      
      // Format the users to match our UI
      const formattedUsers = users.map(user => {
        // Extract skills from the nested structure
        const skills = user.skills?.map(skillObj => skillObj.skill?.skill_name).filter(Boolean) || [];
        
        return {
          id: user.user_id,
          name: user.full_name,
          role: user.role || "Professional",
          location: user.location || "Location not specified",
          skills: skills,
          bio: user.bio || "No bio available",
          networkingIntent: "not specified"
        };
      });
      
      // Apply text search if query exists
      if (query.trim()) {
        const lowerQuery = query.toLowerCase();
        const filtered = formattedUsers.filter(user => {
          const searchString = `${user.name} ${user.role} ${user.location} ${user.bio} ${user.skills.join(" ")}`.toLowerCase();
          return searchString.includes(lowerQuery);
        });
        setResults(filtered);
      } else {
        setResults(formattedUsers);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
      setResults([]);
    }
  };
  
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Apply filters to current results
    let filtered = [...results];
    
    // Filter by intent
    if (newFilters.intent !== "all") {
      filtered = filtered.filter(user => user.networkingIntent === newFilters.intent);
    }
    
    // Filter by location (simplified for demo)
    if (newFilters.location !== "all") {
      filtered = filtered.filter(user => user.location.includes(newFilters.location));
    }
    
    // Sort results
    if (newFilters.sortBy === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    setResults(filtered);
  };
  
  const sendConnectionRequest = async (receiverId) => {
    if (!user) {
      toast.error("You must be logged in to send connection requests");
      navigate("/auth");
      return;
    }
    
    try {
      // Insert the connection request
      const { data, error } = await supabase
        .from('connection_requests')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          status: 'pending'
        });
      
      if (error) throw error;
      
      // Add to pending connections list
      setPendingConnections([...pendingConnections, receiverId]);
      
      // Create notification by adding to user_activity
      await supabase
        .from('user_activity')
        .insert({
          user_id: receiverId,
          activity_type: 'connection_request',
          description: `New connection request from ${user.email}`,
          entity_id: user.id
        });
      
      toast.success("Connection request sent!");
    } catch (error) {
      console.error("Error sending connection request:", error);
      toast.error("Failed to send connection request: " + error.message);
    }
  };

  // Initialize search when component loads or URL changes
  useEffect(() => {
    if (initialQuery) {
      handleSearch(new Event('submit') as any);
    } else {
      fetchAllUsers();
    }
  }, [initialQuery]);
  
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
            <Button type="submit" className="rounded-l-none" disabled={isSearching}>
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                "Search"
              )}
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
                    <SelectItem value="San Francisco">San Francisco</SelectItem>
                    <SelectItem value="New York">New York</SelectItem>
                    <SelectItem value="Austin">Austin</SelectItem>
                    <SelectItem value="Seattle">Seattle</SelectItem>
                    <SelectItem value="Chicago">Chicago</SelectItem>
                    <SelectItem value="Boston">Boston</SelectItem>
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
                  fetchAllUsers();
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Search Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isSearching ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-gray-600">Searching for matches...</p>
            </div>
          </div>
        ) : results.length > 0 ? (
          results.map((user) => (
            <Card key={user.id} className="card-hover">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <div>
                    <CardTitle>{user.name}</CardTitle>
                    <CardDescription>{user.role}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <Map className="h-4 w-4 mr-1" />
                  {user.location}
                </div>
                
                <p className="text-gray-700 mb-3 line-clamp-2">{user.bio}</p>
                
                {user.matchExplanation && (
                  <div className="mb-4 p-2 bg-blue-50 text-blue-700 text-sm rounded-md border border-blue-100">
                    <p className="italic">{user.matchExplanation}</p>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-1">
                  {user.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/profile/${user.id}`}>View Profile</Link>
                </Button>
                
                {pendingConnections.includes(user.id) ? (
                  <Button size="sm" variant="outline" disabled>
                    Request Sent
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    onClick={() => sendConnectionRequest(user.id)}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                )}
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
    </div>
  );
};

export default SearchPage;
