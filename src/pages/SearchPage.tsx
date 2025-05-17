
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Map, ChevronDown } from "lucide-react";
import { SelectValue, SelectTrigger, SelectItem, SelectContent, Select } from "@/components/ui/select";

// Dummy data for demo purposes
const dummyUsers = [
  {
    id: "1",
    name: "Alex Johnson",
    role: "Frontend Developer",
    location: "San Francisco, CA",
    skills: ["React", "TypeScript", "UI/UX"],
    bio: "Frontend developer specializing in React and TypeScript. Looking for co-founding opportunities in the AI space.",
    networkingIntent: "cofounder"
  },
  {
    id: "2",
    name: "Taylor Smith",
    role: "Product Manager",
    location: "New York, NY",
    skills: ["Product Strategy", "User Research", "Agile"],
    bio: "Experienced product manager with a track record of launching successful SaaS products. Looking for technical co-founders.",
    networkingIntent: "cofounder"
  },
  {
    id: "3",
    name: "Jamie Rivera",
    role: "Marketing Specialist",
    location: "Austin, TX",
    skills: ["Content Strategy", "SEO", "Social Media"],
    bio: "Growth marketer with a passion for helping startups scale. Seeking partners with technical skills.",
    networkingIntent: "client"
  },
  {
    id: "4",
    name: "Morgan Lee",
    role: "UX Designer",
    location: "Seattle, WA",
    skills: ["UI Design", "User Research", "Figma"],
    bio: "UX designer focused on creating beautiful, intuitive interfaces. Looking to collaborate with developers on client projects.",
    networkingIntent: "client"
  },
  {
    id: "5",
    name: "Casey Wong",
    role: "Project Manager",
    location: "Chicago, IL",
    skills: ["Agile", "Scrum", "Team Leadership"],
    bio: "Experienced project manager seeking talented developers to join our team for ongoing client work.",
    networkingIntent: "teammate"
  },
  {
    id: "6",
    name: "Jordan Taylor",
    role: "CTO",
    location: "Boston, MA",
    skills: ["System Architecture", "Team Building", "Strategic Planning"],
    bio: "CTO of a growing startup looking to expand our engineering team with talented developers.",
    networkingIntent: "teammate"
  },
];

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(dummyUsers);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    intent: "all",
    location: "all",
    sortBy: "relevance"
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setResults(dummyUsers);
      return;
    }
    
    // Simple search implementation for the demo
    const filtered = dummyUsers.filter(user => {
      const searchString = `${user.name} ${user.role} ${user.location} ${user.bio} ${user.skills.join(" ")}`.toLowerCase();
      return searchString.includes(query.toLowerCase());
    });
    
    setResults(filtered);
  };
  
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Apply filters
    let filtered = [...dummyUsers];
    
    // Filter by intent
    if (newFilters.intent !== "all") {
      filtered = filtered.filter(user => user.networkingIntent === newFilters.intent);
    }
    
    // Filter by location (simplified for demo)
    if (newFilters.location !== "all") {
      filtered = filtered.filter(user => user.location.includes(newFilters.location));
    }
    
    // Apply search query if exists
    if (query.trim()) {
      filtered = filtered.filter(user => {
        const searchString = `${user.name} ${user.role} ${user.location} ${user.bio} ${user.skills.join(" ")}`.toLowerCase();
        return searchString.includes(query.toLowerCase());
      });
    }
    
    // Sort results
    if (newFilters.sortBy === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    // Add other sorting options as needed
    
    setResults(filtered);
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
                  setResults(dummyUsers);
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
        {results.length > 0 ? (
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
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="mr-2" asChild>
                  <Link to={`/profile/${user.id}`}>View Profile</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to={`/messaging/${user.id}`}>Connect</Link>
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
