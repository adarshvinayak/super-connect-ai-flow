
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CVParserRequest {
  fileUrl: string;
  fileName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const groqApiKey = Deno.env.get("GROQ_API_KEY");
    if (!groqApiKey) {
      throw new Error("GROQ_API_KEY is not set in environment variables");
    }

    // Parse request
    const { fileUrl, fileName } = await req.json() as CVParserRequest;
    
    if (!fileUrl) {
      throw new Error("File URL is required");
    }

    console.log(`Processing CV: ${fileName}`);
    
    // Download the file content
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.status}`);
    }
    
    // Get file content as text or base64 depending on file type
    const isTextFile = fileName.toLowerCase().endsWith('.txt') || fileName.toLowerCase().endsWith('.md');
    let fileContent: string;
    
    if (isTextFile) {
      fileContent = await fileResponse.text();
    } else {
      // Convert to base64 for binary files like PDF, DOC
      const buffer = await fileResponse.arrayBuffer();
      fileContent = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
    }
    
    // For PDF and DOCX files, extract text using GROQ LLM model
    const fileType = fileName.split('.').pop()?.toLowerCase();
    if (fileType === 'pdf' || fileType === 'doc' || fileType === 'docx') {
      // Use GROQ to extract content from document
      console.log("Extracting information from document...");
      
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are a professional CV/resume parser with expertise in extracting structured information from resume documents. 
                Your task is to extract key information including:
                - Full name
                - Contact information (email, phone)
                - Education history (institution, degree, field, dates)
                - Employment history (company, position, dates, descriptions)
                - Skills (technical and soft skills)
                - Projects (if any)
                
                Analyze the following ${fileType} file content and provide a structured JSON response with these categories.
                For the extracted information, maintain accuracy while formatting in a structured way.`
            },
            {
              role: "user",
              content: `Parse this resume: ${fileContent.length > 3000 ? fileContent.substring(0, 3000) + '...' : fileContent}`
            }
          ],
          response_format: { type: "json_object" }
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error("Error from GROQ:", error);
        throw new Error("Failed to parse document with GROQ");
      }
      
      const result = await response.json();
      const parsedContent = JSON.parse(result.choices[0].message.content);
      
      console.log("Successfully parsed CV");
      
      return new Response(JSON.stringify(parsedContent), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error("Error processing CV:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to process CV"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
