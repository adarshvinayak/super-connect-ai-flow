import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Loader2 } from "lucide-react";
import { supabase, getSession } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ProfileInsightsProps {
  profileData: any;
  className?: string;
}

const ProfileInsights = ({ profileData, className = "" }: ProfileInsightsProps) => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const generateInsights = async () => {
      if (!user || !profileData) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if we already have generated insights for this match
        const { data: existingMatches } = await supabase
          .from('matches')
          .select(`
            match_id,
            match_explanations(explanation_text)
          `)
          .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
          .or(`user_id_1.eq.${profileData.user_id},user_id_2.eq.${profileData.user_id}`);
        
        // If we have an existing match with explanation, use it
        if (existingMatches && existingMatches.length > 0 && 
            existingMatches[0].match_explanations && 
            existingMatches[0].match_explanations.length > 0) {
          setInsights(existingMatches[0].match_explanations[0].explanation_text);
          setIsLoading(false);
          return;
        }
        
        // Otherwise generate new insights
        const session = await getSession();
        
        // Get current user profile data for comparison
        const { data: currentUserData, error: userError } = await supabase
          .from('users')
          .select(`
            user_id,
            full_name,
            bio,
            location,
            role,
            skills:user_skills(skill:skills(skill_name))
          `)
          .eq('user_id', user.id)
          .single();
        
        if (userError) throw userError;
        
        // Call the AI analysis edge function
        const response = await fetch(`https://dvdkihicwovcfbwlfmrk.supabase.co/functions/v1/ai-match-analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            profiles: [
              {
                name: currentUserData.full_name,
                bio: currentUserData.bio,
                role: currentUserData.role,
                location: currentUserData.location,
                skills: currentUserData.skills?.map(s => s.skill?.skill_name).filter(Boolean)
              },
              {
                name: profileData.full_name,
                bio: profileData.bio,
                role: profileData.role,
                location: profileData.location,
                skills: profileData.skills?.map(s => s.skill?.skill_name).filter(Boolean)
              }
            ]
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate insights");
        }

        const data = await response.json();
        
        if (data.success && data.analysis) {
          // Store the match and explanation in database
          const { data: matchData, error: matchError } = await supabase
            .from('matches')
            .insert({
              user_id_1: user.id,
              user_id_2: profileData.user_id
            })
            .select('match_id')
            .single();
          
          if (matchError) throw matchError;
          
          // Store the explanation
          await supabase
            .from('match_explanations')
            .insert({
              match_id: matchData.match_id,
              explanation_text: data.analysis,
              llm_model_used: data.model_used || "llama-3-3-70b-versatile",
              input_data_summary: {
                user1: currentUserData.full_name,
                user2: profileData.full_name
              }
            });
          
          setInsights(data.analysis);
        } else {
          setError("Failed to generate insights");
        }
      } catch (error) {
        console.error("Error generating profile insights:", error);
        setError("Failed to generate profile insights");
      } finally {
        setIsLoading(false);
      }
    };
    
    generateInsights();
  }, [user, profileData]);
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
            AI Insights
          </CardTitle>
          <CardDescription>Analyzing profile match...</CardDescription>
        </CardHeader>
        <CardContent className="h-32 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  if (error || !insights) {
    return null; // Don't show the card if there's an error or no insights
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
          AI Match Insights
        </CardTitle>
        <CardDescription>Powered by Groq AI</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm space-y-2">
          {insights.split('\n\n').map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileInsights;
