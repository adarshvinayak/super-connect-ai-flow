
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.27.0';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Get environment variable
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") || "";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Create a Groq API client function
async function queryGroq(prompt: string, model: string = "llama-3-3-70b-versatile") {
  console.log(`Querying GROQ with model: ${model}`);
  
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: "system",
          content: "You are an assistant that helps parse natural language search queries into structured search parameters for a professional networking platform. You extract skills, location preferences, intent, availability, and working style."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  return await response.json();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY is not configured" }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const { query } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: "Invalid input: Must provide a search query" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Create a prompt for the Groq API
    const prompt = `
      Parse the following natural language search query for a professional networking platform into structured search parameters:
      
      "${query}"
      
      Extract the following information in JSON format:
      - skills: An array of skills or expertise areas mentioned
      - location: Any mentioned location preferences
      - intent: The purpose of the search (e.g., finding a co-founder, client, teammate, etc.)
      - availability: Any mentioned availability preferences (e.g., full-time, part-time, etc.)
      - working_style: Any mentioned working style preferences (e.g., remote, in-office, etc.)
      - years_experience: Any mentioned years of experience
      
      ONLY return a valid JSON object with these fields, nothing else.
      If a field is not mentioned in the search query, set its value to null.
    `;

    console.log("Sending search query to Groq API");
    
    // Send the request to Groq API
    const groqResponse = await queryGroq(prompt);
    let searchParams;
    
    try {
      // Try to parse the structured parameters from Groq's response
      const responseText = groqResponse.choices[0].message.content;
      
      // Extract JSON if wrapped in code blocks
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                        responseText.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, responseText];
      
      searchParams = JSON.parse(jsonMatch[1] || responseText);
      console.log("Parsed search parameters:", JSON.stringify(searchParams));
    } catch (error) {
      console.error("Error parsing Groq response:", error);
      searchParams = { 
        error: "Failed to parse search parameters",
        raw_response: groqResponse.choices[0].message.content
      };
    }

    // Perform the database search using the structured parameters
    let query = supabase
      .from('users')
      .select(`
        user_id,
        full_name,
        location,
        role,
        bio,
        skills:user_skills(skill:skills(skill_name)),
        intents:user_intents(intent:intents(intent_name))
      `);
    
    // Apply filters based on the parsed parameters
    if (searchParams.skills && searchParams.skills.length > 0) {
      // Get user IDs with matching skills
      const { data: userSkills } = await supabase
        .from('user_skills')
        .select('user_id, skill_id')
        .in('skill_id', function() {
          this.select('skill_id')
            .from('skills')
            .textSearch('skill_name', searchParams.skills.join(' | '));
        });
      
      if (userSkills && userSkills.length > 0) {
        const userIds = [...new Set(userSkills.map(us => us.user_id))];
        query = query.in('user_id', userIds);
      }
    }

    if (searchParams.location) {
      query = query.ilike('location', `%${searchParams.location}%`);
    }

    // Executive the query
    const { data: results, error } = await query;

    if (error) {
      throw new Error(`Database query error: ${error.message}`);
    }

    // Generate match explanations
    const resultsWithExplanations = await Promise.all((results || []).map(async (user) => {
      try {
        // Create a prompt for match explanation
        const matchExplanationPrompt = `
          Analyze why this user might be a good match for the search query: "${query}"
          
          User profile:
          Name: ${user.full_name}
          Role: ${user.role || 'Not specified'}
          Location: ${user.location || 'Not specified'}
          Bio: ${user.bio || 'No bio provided'}
          Skills: ${user.skills?.map(s => s.skill?.skill_name).join(', ') || 'None specified'}
          
          Provide a 2-3 line explanation focusing on why this person might be relevant to the query.
          Be concise and professional. Highlight specific matching aspects.
        `;
        
        // Get explanation from Groq
        const explanationResponse = await queryGroq(matchExplanationPrompt);
        const explanation = explanationResponse.choices[0].message.content.trim();
        
        return {
          ...user,
          match_explanation: explanation
        };
      } catch (error) {
        console.error(`Error generating match explanation for user ${user.user_id}:`, error);
        return {
          ...user,
          match_explanation: "No match explanation available"
        };
      }
    }));

    // Return the search results with explanations
    return new Response(
      JSON.stringify({ 
        success: true,
        search_parameters: searchParams,
        results: resultsWithExplanations || []
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
