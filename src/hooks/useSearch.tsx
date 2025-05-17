
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase, getSession } from '@/integrations/supabase/client';

export interface SearchResult {
  id: string;
  name: string;
  role?: string;
  location?: string;
  bio?: string;
  skills: string[];
  matchExplanation?: string;
}

export function useSearch() {
  const { user } = useAuth();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [interpretedIntent, setInterpretedIntent] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    setIsSearching(true);
    setSearchError(null);
    
    try {
      if (!query.trim()) {
        // If query is empty, return empty results
        setResults([]);
        setIsSearching(false);
        return;
      }
      
      const session = await getSession();
      
      // Call the AI search edge function
      const response = await fetch(`https://dvdkihicwovcfbwlfmrk.supabase.co/functions/v1/ai-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          query,
          userId: user?.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to search");
      }

      const data = await response.json();
      
      if (data.success && data.results) {
        // Update interpreted intent
        setInterpretedIntent(data.interpretedIntent || null);
        
        // Process the results to match our UI format
        const formattedResults = data.results.map((user: any) => {
          // Extract skills from the nested structure
          const skills = user.skills?.map((skillObj: any) => skillObj.skill.skill_name) || [];
          
          return {
            id: user.user_id,
            name: user.full_name,
            role: user.role || "Professional",
            location: user.location || "Location not specified",
            skills: skills,
            bio: user.bio || "No bio available",
            matchExplanation: user.matchExplanation || "Potential match based on your search criteria."
          };
        });
        
        setResults(formattedResults);
      } else {
        // If there's an issue with the search, fall back to basic filtering
        console.log("AI search returned no results, falling back to basic search");
        await basicSearch(query);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchError("Search error: " + (error.message || "Failed to perform search"));
      toast.error("Search error: " + (error.message || "Failed to perform search"));
      
      // Fall back to basic search
      await basicSearch(query);
    } finally {
      setIsSearching(false);
    }
  }, [user]);

  // Basic search fallback without AI
  const basicSearch = useCallback(async (query: string) => {
    try {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      
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
        const skills = user.skills?.map(skillObj => skillObj.skill.skill_name) || [];
        
        return {
          id: user.user_id,
          name: user.full_name,
          role: user.role || "Professional",
          location: user.location || "Location not specified",
          skills: skills,
          bio: user.bio || "No bio available",
        };
      });
      
      // Apply text search
      const lowerQuery = query.toLowerCase();
      const filtered = formattedUsers.filter(user => {
        const searchString = `${user.name} ${user.role || ''} ${user.location || ''} ${user.bio || ''} ${user.skills.join(" ")}`.toLowerCase();
        return searchString.includes(lowerQuery);
      });
      
      setResults(filtered);
      setInterpretedIntent(null);
    } catch (error) {
      console.error("Error in basic search:", error);
      setSearchError("Error in search: " + (error.message || "Unknown error"));
      toast.error("Failed to load search results");
      setResults([]);
    }
  }, [user]);

  return {
    results,
    isSearching,
    searchError,
    interpretedIntent,
    search
  };
}
