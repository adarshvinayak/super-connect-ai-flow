
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
async function queryGroq(prompt: string, model: string = "llama-3.1-8b-instant") {
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
          content: "You are an assistant that helps parse natural language search queries into structured search parameters."
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
      
      ONLY return a valid JSON object with these fields, nothing else.
      If a field is not mentioned in the search query, set its value to null.
    `;

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
        bio,
        skills:user_skills(skill:skills(skill_name)),
        intents:user_intents(intent:intents(intent_name))
      `);
    
    // Apply filters based on the parsed parameters
    if (searchParams.skills && searchParams.skills.length > 0) {
      // Complex query for skills since they're in a related table
      // This is a simplified approach
      const skillNames = searchParams.skills.map(skill => skill.toLowerCase());
      query = query.in('skills.skill.skill_name', skillNames);
    }

    if (searchParams.location) {
      query = query.ilike('location', `%${searchParams.location}%`);
    }

    // Execute the query
    const { data: results, error } = await query;

    if (error) {
      throw new Error(`Database query error: ${error.message}`);
    }

    // Return the search results
    return new Response(
      JSON.stringify({ 
        success: true,
        search_parameters: searchParams,
        results: results || []
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
