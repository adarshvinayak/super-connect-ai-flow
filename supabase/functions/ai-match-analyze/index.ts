
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Get environment variable
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") || "";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Create a Groq API client
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
          content: "You are an AI assistant designed to analyze potential professional connections and explain why they might be good matches based on profiles, skills, and purpose statements."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
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

    const { profiles } = await req.json();

    if (!profiles || !Array.isArray(profiles) || profiles.length < 2) {
      return new Response(
        JSON.stringify({ error: "Invalid input: Must provide at least two profiles to analyze" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Create a prompt for the Groq API
    const prompt = `
      Analyze these two professional profiles and explain why they might be a good match for networking or collaboration:

      Profile 1:
      ${JSON.stringify(profiles[0])}

      Profile 2:
      ${JSON.stringify(profiles[1])}

      Based on their skills, experience, purpose statements, and professional goals, explain:
      1. Their key compatibility points
      2. How they might complement each other
      3. Potential collaboration opportunities
      
      Provide a detailed but concise analysis.
    `;

    console.log("Sending profiles to Groq for analysis");
    
    // Send the request to Groq API
    const groqResponse = await queryGroq(prompt);
    const analysis = groqResponse.choices[0].message.content;

    // Return the analysis
    return new Response(
      JSON.stringify({ 
        success: true,
        analysis,
        model_used: "llama-3-3-70b-versatile",
        raw_response: groqResponse
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
