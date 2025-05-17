
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    })
  }

  try {
    // Extract the resume data from the request
    const formData = await req.formData()
    const fileData = formData.get('resume')
    const userId = formData.get('userId')
    
    if (!fileData || !userId) {
      return new Response(
        JSON.stringify({ error: 'Resume file and userId are required' }),
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

    // Convert file to base64 for sending to Groq
    const buffer = await fileData.arrayBuffer()
    const fileContent = new TextDecoder().decode(buffer)

    // Create Supabase client for storing the file
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl!, supabaseKey!)

    // Store the resume file in Supabase Storage
    const fileExt = fileData.name.split('.').pop()
    const filePath = `${userId}/resume_${Date.now()}.${fileExt}`
    
    const { error: uploadError } = await supabase
      .storage
      .from('resumes')
      .upload(filePath, fileData, {
        contentType: fileData.type
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      throw new Error(`Failed to upload resume: ${uploadError.message}`)
    }

    // Send the resume content to Groq for parsing
    const prompt = `
      You are a resume parsing assistant. Extract structured information from the following resume content.
      Return ONLY a JSON object with the following structure:
      {
        "name": "Full Name",
        "email": "email@example.com",
        "phone": "phone number if available, otherwise null",
        "skills": ["skill1", "skill2", ...],
        "education": [
          {
            "institution": "University/School name",
            "degree": "Degree earned",
            "fieldOfStudy": "Field of study",
            "startDate": "YYYY-MM if available, otherwise null",
            "endDate": "YYYY-MM if available, otherwise null",
            "description": "Brief description if available"
          }
        ],
        "employment": [
          {
            "company": "Company name",
            "position": "Job title",
            "startDate": "YYYY-MM if available, otherwise null",
            "endDate": "YYYY-MM if available or 'Present' if current, otherwise null",
            "current": true/false,
            "description": "Brief job description"
          }
        ],
        "projects": [
          {
            "title": "Project title",
            "description": "Brief description",
            "url": "URL if available, otherwise null"
          }
        ]
      }
      
      Here's the resume content:
      ${fileContent}
      
      DO NOT include any explanation or additional text beyond the JSON output.
    `

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 2000
      })
    })

    if (!groqResponse.ok) {
      throw new Error(`Groq API error (${groqResponse.status})`)
    }

    const groqData = await groqResponse.json()
    const parsedContent = groqData.choices[0].message.content.trim()
    
    // Parse the JSON response
    let resumeData
    try {
      // Find the JSON object in the response (in case there's any preamble)
      const jsonMatch = parsedContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        resumeData = JSON.parse(jsonMatch[0])
      } else {
        resumeData = JSON.parse(parsedContent)
      }
    } catch (e) {
      console.error("Failed to parse resume data:", e)
      throw new Error("Failed to parse resume content. The AI response was not valid JSON.")
    }

    // Get the public URL for the uploaded file
    const { data: publicUrl } = supabase
      .storage
      .from('resumes')
      .getPublicUrl(filePath)

    // Add the resume file URL to the response data
    resumeData.resumeUrl = publicUrl.publicUrl

    return new Response(
      JSON.stringify({ 
        success: true, 
        resumeData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Resume parsing error:', error)
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
