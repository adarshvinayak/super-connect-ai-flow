
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SearchRequest {
  query: string;
  userId?: string;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    })
  }

  try {
    const { query, userId } = await req.json() as SearchRequest
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get Groq API key from environment variables
    const groqApiKey = Deno.env.get('GROQ_API_KEY')
    if (!groqApiKey) {
      return new Response(
        JSON.stringify({ error: 'GROQ API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl!, supabaseKey!)

    // First, process the search query with Groq to get relevant search terms and intent
    const prompt = `
      You are an AI assistant helping with a professional networking platform search. 
      Given the following search query: "${query}", 
      
      Extract key search terms, interpret the search intent, and output ONLY a JSON object with the following structure:
      {
        "searchTerms": ["term1", "term2"], // Extract up to 5 relevant search terms
        "interpretedIntent": "string",     // Brief interpretation of what the user is looking for (e.g., "technical co-founder", "marketing professional", etc.)
        "targetSkills": ["skill1", "skill2"], // Any specific skills mentioned or implied
        "targetLocation": "string" // Any location mentioned, or null if none
      }
      
      DO NOT include any other text, explanations, or preamble beyond the JSON object itself.
    `

    // Call Groq API to analyze the search query
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    })

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text()
      throw new Error(`Groq API error (${groqResponse.status}): ${errorText}`)
    }

    const groqData = await groqResponse.json()
    
    // Extract the JSON response from Groq
    let parsedSearchData
    try {
      const content = groqData.choices[0].message.content
      parsedSearchData = JSON.parse(content)
    } catch (e) {
      console.error("Failed to parse Groq response:", e)
      parsedSearchData = {
        searchTerms: [query],
        interpretedIntent: "any",
        targetSkills: [],
        targetLocation: null
      }
    }

    // Now query the database with the enhanced search terms
    const { searchTerms, targetSkills, targetLocation } = parsedSearchData
    let baseQuery = supabase
      .from('users')
      .select(`
        user_id,
        full_name,
        bio,
        location,
        role,
        skills:user_skills(skill:skills(skill_name)),
        intents:user_intents(intent:intents(intent_name))
      `)
      .neq('user_id', userId || '')

    // Add filters based on AI analysis
    if (targetSkills && targetSkills.length > 0) {
      baseQuery = baseQuery.or(
        targetSkills.map(skill => `skills.skill.skill_name.ilike.%${skill}%`).join(',')
      )
    }

    if (targetLocation) {
      baseQuery = baseQuery.ilike('location', `%${targetLocation}%`)
    }

    // Add text search on basic fields
    if (searchTerms && searchTerms.length > 0) {
      const searchPattern = searchTerms.join(' | ')
      baseQuery = baseQuery.or(
        `full_name.ilike.%${searchPattern}%,bio.ilike.%${searchPattern}%,role.ilike.%${searchPattern}%`
      )
    }

    // Execute the query
    const { data: users, error } = await baseQuery

    if (error) {
      throw error
    }

    // Now generate AI match explanations for each user found
    const processedUsers = []
    
    for (const user of users) {
      // Generate a match explanation for this specific user
      const matchPrompt = `
        You are a professional networking assistant. Generate a brief, personalized explanation (1-2 sentences) for why these two professionals might be a good match:
        
        User's query: "${query}"
        
        Potential match information:
        - Name: ${user.full_name}
        - Role: ${user.role || 'Not specified'}
        - Skills: ${user.skills?.map(s => s.skill.skill_name).join(', ') || 'Not specified'}
        - Bio: ${user.bio || 'Not specified'}
        - Location: ${user.location || 'Not specified'}
        
        Your response should ONLY be the brief explanation text, with no additional formatting.
      `

      const matchResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: matchPrompt }],
          temperature: 0.7,
          max_tokens: 150
        })
      })

      let matchExplanation = "Potential match based on your search criteria."
      if (matchResponse.ok) {
        const matchData = await matchResponse.json()
        matchExplanation = matchData.choices[0].message.content.trim()
      }

      // Add the match explanation to the user object
      processedUsers.push({
        ...user,
        matchExplanation
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results: processedUsers,
        interpretedIntent: parsedSearchData.interpretedIntent
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('AI search error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
