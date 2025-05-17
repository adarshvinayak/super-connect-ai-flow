
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, X } from "lucide-react";
import { useSearch } from "@/hooks/useSearch";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";

const GlobalSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { search, results, isSearching, interpretedIntent } = useSearch();
  const searchRef = useRef<HTMLDivElement>(null);
  
  useOnClickOutside(searchRef, () => {
    setShowResults(false);
    if (!query) {
      setIsExpanded(false);
    }
  });
  
  // Handle search on Enter key or button click
  const handleSearch = async () => {
    if (query.trim()) {
      await search(query);
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };

  // Handle input focus
  const handleFocus = () => {
    setIsExpanded(true);
    if (results.length > 0 && query.trim()) {
      setShowResults(true);
    }
  };

  // Handle clear button
  const handleClear = () => {
    setQuery("");
    setShowResults(false);
  };
  
  // Handle search result click
  const handleResultClick = (id: string) => {
    navigate(`/profile/${id}`);
    setShowResults(false);
  };
  
  // Perform search when query changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim() && isExpanded) {
        handleSearch();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [query, isExpanded]);
  
  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className={`flex rounded-md transition-all ${isExpanded ? "w-full" : "w-40 md:w-64"}`}>
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder={isExpanded ? "Search people, skills, locations..." : "Search"}
            className={`pl-10 pr-10 py-2 rounded-r-none border-r-0 transition-all ${isExpanded ? "w-full" : "w-full"}`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleFocus}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          {query && (
            <button 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={handleClear}
            >
              <X size={16} />
            </button>
          )}
        </div>
        <Button
          className="rounded-l-none"
          onClick={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Search"
          )}
        </Button>
      </div>
      
      {/* Search results dropdown */}
      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-[80vh] overflow-auto shadow-lg">
          <CardContent className="p-2">
            {interpretedIntent && (
              <div className="p-2 mb-2 bg-gray-50 text-sm text-gray-600 rounded">
                <span className="font-medium">Looking for:</span> {interpretedIntent}
              </div>
            )}
            
            {isSearching ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                <span>Searching...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-2">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="p-3 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
                    onClick={() => handleResultClick(result.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{result.name}</h4>
                        <p className="text-sm text-gray-500">{result.role} {result.location ? `• ${result.location}` : ''}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleResultClick(result.id)}>
                        View
                      </Button>
                    </div>
                    
                    {result.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {result.skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                        ))}
                        {result.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{result.skills.length - 3} more</Badge>
                        )}
                      </div>
                    )}
                    
                    {result.matchExplanation && (
                      <p className="text-xs text-gray-600 mt-2 italic">
                        {result.matchExplanation}
                      </p>
                    )}
                  </div>
                ))}
                
                <div className="pt-2 text-center border-t">
                  <Button 
                    variant="link" 
                    className="text-sm"
                    onClick={() => {
                      navigate(`/search?q=${encodeURIComponent(query)}`);
                      setShowResults(false);
                    }}
                  >
                    See all results
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-center p-4 text-gray-500">No results found</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GlobalSearch;
