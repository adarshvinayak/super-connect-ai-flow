
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MatchAnalysisRequest {
  userId: string;
  targetUserId: string;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    })
  }

  try {
    const { userId, targetUserId } = await req.json() as MatchAnalysisRequest
    
    if (!userId || !targetUserId) {
      return new Response(
        JSON.stringify({ error: 'Both userId and targetUserId are required' }),
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

    // Fetch both users' data
    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select(`
        full_name,
        bio,
        location,
        role,
        skills:user_skills(skill:skills(skill_name)),
        intents:user_intents(intent:intents(intent_name)),
        education:user_education(*),
        employment:user_employment(*)
      `)
      .eq('user_id', userId)
      .single()

    if (currentUserError) throw currentUserError

    const { data: targetUser, error: targetUserError } = await supabase
      .from('users')
      .select(`
        full_name,
        bio,
        location,
        role,
        skills:user_skills(skill:skills(skill_name)),
        intents:user_intents(intent:intents(intent_name)),
        education:user_education(*),
        employment:user_employment(*)
      `)
      .eq('user_id', targetUserId)
      .single()

    if (targetUserError) throw targetUserError

    // Prepare user data for the prompt
    const formatUser = (user) => {
      return {
        name: user.full_name,
        bio: user.bio || 'Not provided',
        location: user.location || 'Not provided',
        role: user.role || 'Not provided',
        skills: user.skills?.map(s => s.skill.skill_name).join(', ') || 'Not provided',
        intents: user.intents?.map(i => i.intent.intent_name).join(', ') || 'Not provided',
        education: user.education?.map(e => 
          `${e.degree || ''} in ${e.field_of_study || ''} at ${e.institution || ''}`
        ).join('; ') || 'Not provided',
        employment: user.employment?.map(e => 
          `${e.position || ''} at ${e.company || ''}`
        ).join('; ') || 'Not provided'
      }
    }

    const currentUserData = formatUser(currentUser)
    const targetUserData = formatUser(targetUser)

    // Generate a detailed match analysis with Groq
    const prompt = `
      You are a professional networking assistant providing insight on potential professional connections.
      
      Analyze the two professional profiles below and provide a detailed analysis (2-3 paragraphs) of why they would be a good match for professional networking, considering their skills, experience, background, and potential synergies.
      
      Profile 1:
      - Name: ${currentUserData.name}
      - Role: ${currentUserData.role}
      - Skills: ${currentUserData.skills}
      - Bio: ${currentUserData.bio}
      - Location: ${currentUserData.location}
      - Education: ${currentUserData.education}
      - Employment: ${currentUserData.employment}
      - Networking Intents: ${currentUserData.intents}
      
      Profile 2:
      - Name: ${targetUserData.name}
      - Role: ${targetUserData.role}
      - Skills: ${targetUserData.skills}
      - Bio: ${targetUserData.bio}
      - Location: ${targetUserData.location}
      - Education: ${targetUserData.education}
      - Employment: ${targetUserData.employment}
      - Networking Intents: ${targetUserData.intents}
      
      Focus on complementary skills, potential collaboration opportunities, and shared interests. Be specific about how they might benefit from connecting.
      Do not mention their names in your analysis - use terms like "you" and "this professional" instead.
    `

    const analysisResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      })
    })

    if (!analysisResponse.ok) {
      throw new Error(`Groq API error (${analysisResponse.status})`)
    }

    const analysisData = await analysisResponse.json()
    const matchAnalysis = analysisData.choices[0].message.content.trim()

    // Store the match analysis in the database
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('match_explanations')
      .insert({
        match_id: `${userId}_${targetUserId}`,
        explanation_text: matchAnalysis,
        llm_model_used: "llama-3.3-70b-versatile",
        input_data_summary: {
          user1: {
            id: userId,
            name: currentUserData.name
          },
          user2: {
            id: targetUserId,
            name: targetUserData.name
          }
        }
      })
      .select()
      .single()

    if (saveError) {
      console.error("Error saving match analysis:", saveError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        matchAnalysis,
        analysisId: savedAnalysis?.explanation_id || null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Match analysis error:', error)
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
