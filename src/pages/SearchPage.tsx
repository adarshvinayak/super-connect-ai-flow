
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Map, Filter, ChevronDown, Loader2 } from "lucide-react";
import { SelectValue, SelectTrigger, SelectItem, SelectContent, Select } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useSearch } from "@/hooks/useSearch";
import { useConnections } from "@/hooks/useConnections";

const SearchPage = () => {
  const { user } = useAuth();
  const { search, results, isSearching, interpretedIntent } = useSearch();
  const { sendConnectionRequest } = useConnections();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    intent: "all",
    location: "all",
    sortBy: "relevance"
  });
  
  // For URL query parameters
  const location = useLocation();
  const navigate = useNavigate();
  
  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  // Extract query from URL and search on page load
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryParam = params.get('q');
    
    if (queryParam) {
      search(queryParam);
    }
  }, [location.search, search]);
  
  // Handle connect button click
  const handleConnect = async (userId: string) => {
    await sendConnectionRequest(userId);
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Search Results</h1>
      
      {/* Search interpretation */}
      {interpretedIntent && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-700">
            <span className="font-medium">Looking for:</span> {interpretedIntent}
          </p>
        </div>
      )}
      
      <div className="flex justify-between items-center">
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
        <div className="p-4 border rounded-lg bg-gray-50 animate-fade-in">
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
              }}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      )}
      
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
                
                <p className="text-gray-700 mb-4 line-clamp-2">{user.bio}</p>
                
                <div className="flex flex-wrap gap-1">
                  {user.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
                
                {user.matchExplanation && (
                  <div className="mt-4 bg-gray-50 p-3 rounded-md text-sm text-gray-600 italic">
                    {user.matchExplanation}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="mr-2" asChild>
                  <Link to={`/profile/${user.id}`}>View Profile</Link>
                </Button>
                <Button size="sm" onClick={() => handleConnect(user.id)}>
                  Connect
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
    </div>
  );
};

export default SearchPage;
