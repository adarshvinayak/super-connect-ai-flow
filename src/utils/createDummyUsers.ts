
import { supabase } from "@/integrations/supabase/client";

// Define available skills and intents
const availableSkills = [
  "React", "JavaScript", "TypeScript", "Node.js", "Python",
  "Product Management", "UX Design", "UI Design", "Content Writing",
  "Data Science", "Machine Learning", "Marketing", "SEO", "DevOps",
  "AWS", "Azure", "Google Cloud", "Kubernetes", "Docker", "GraphQL",
  "REST API", "SQL", "NoSQL", "MongoDB", "PostgreSQL", "Firebase",
  "Mobile Development", "iOS", "Android", "Flutter", "React Native",
  "Project Management", "Agile", "Scrum", "Team Leading", "Sales",
  "Business Development", "Finance", "Analytics", "Growth Hacking",
  "Social Media", "Video Production", "Design Thinking", "Figma"
];

const availableIntents = ["cofounder", "client", "teammate"];

const availableLocations = [
  "San Francisco, CA", "New York, NY", "Austin, TX", "Seattle, WA", 
  "Chicago, IL", "Boston, MA", "Los Angeles, CA", "Portland, OR",
  "Denver, CO", "Atlanta, GA", "Miami, FL", "Dallas, TX", 
  "Washington, DC", "Philadelphia, PA", "Phoenix, AZ",
  "London, UK", "Berlin, Germany", "Toronto, Canada", "Sydney, Australia",
  "Paris, France", "Amsterdam, Netherlands", "Tokyo, Japan", "Singapore"
];

// Helper function to get random elements from an array
const getRandomElements = (array: any[], count: number) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Helper function to create realistic dummy user with skills and intents
const createDummyUser = async (email: string) => {
  try {
    // First create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: "password123", // Simple password for dummy accounts
      email_confirm: true // Auto-confirm email
    });
    
    if (authError) {
      console.error("Error creating auth user:", authError);
      return null;
    }
    
    const userId = authData.user.id;
    
    // Generate realistic user info
    const fullName = `${email.split('@')[0].replace(/[0-9]/g, '').split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;
    const location = availableLocations[Math.floor(Math.random() * availableLocations.length)];
    const role = ["Developer", "Designer", "Product Manager", "Marketer", "Data Scientist", "DevOps Engineer", "Founder"][Math.floor(Math.random() * 7)];
    const bio = `Experienced ${role} with a passion for building innovative products. Looking to connect with like-minded professionals for potential collaborations and opportunities.`;
    
    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        user_id: userId,
        full_name: fullName,
        location,
        bio,
        email,
        role
      });
    
    if (profileError) {
      console.error("Error creating user profile:", profileError);
      return null;
    }
    
    // Assign random skills (3-7 skills per user)
    const skillCount = Math.floor(Math.random() * 5) + 3; // 3 to 7 skills
    const userSkills = getRandomElements(availableSkills, skillCount);
    
    for (const skill of userSkills) {
      // Check if skill exists, if not create it
      const { data: existingSkill } = await supabase
        .from('skills')
        .select('skill_id')
        .eq('skill_name', skill)
        .single();
      
      let skillId;
      
      if (!existingSkill) {
        // Create skill
        const { data: newSkill } = await supabase
          .from('skills')
          .insert({ skill_name: skill })
          .select('skill_id')
          .single();
        
        skillId = newSkill.skill_id;
      } else {
        skillId = existingSkill.skill_id;
      }
      
      // Link skill to user
      await supabase
        .from('user_skills')
        .insert({
          user_id: userId,
          skill_id: skillId
        });
    }
    
    // Assign a networking intent
    const intent = availableIntents[Math.floor(Math.random() * availableIntents.length)];
    
    // Check if intent exists
    const { data: existingIntent } = await supabase
      .from('intents')
      .select('intent_id')
      .eq('intent_name', intent)
      .single();
    
    let intentId;
    
    if (!existingIntent) {
      // Create intent
      const { data: newIntent } = await supabase
        .from('intents')
        .insert({ intent_name: intent })
        .select('intent_id')
        .single();
      
      intentId = newIntent.intent_id;
    } else {
      intentId = existingIntent.intent_id;
    }
    
    // Link intent to user
    await supabase
      .from('user_intents')
      .insert({
        user_id: userId,
        intent_id: intentId
      });
    
    // Add social profiles with 50% probability each
    if (Math.random() > 0.5) {
      await supabase
        .from('social_profiles')
        .insert({
          user_id: userId,
          platform: 'github',
          profile_url: `https://github.com/${fullName.toLowerCase().replace(' ', '')}`
        });
    }
    
    if (Math.random() > 0.5) {
      await supabase
        .from('social_profiles')
        .insert({
          user_id: userId,
          platform: 'linkedin',
          profile_url: `https://linkedin.com/in/${fullName.toLowerCase().replace(' ', '-')}`
        });
    }
    
    if (Math.random() > 0.7) {
      await supabase
        .from('social_profiles')
        .insert({
          user_id: userId,
          platform: 'portfolio',
          profile_url: `https://${fullName.toLowerCase().replace(' ', '')}.dev`
        });
    }
    
    return {
      userId,
      email,
      fullName
    };
  } catch (error) {
    console.error("Error creating dummy user:", error);
    return null;
  }
};

// Main function to create multiple dummy users
export const createDummyUsers = async (count = 10) => {
  const createdUsers = [];
  
  for (let i = 0; i < count; i++) {
    const email = `dummy.user${i+1}@example.com`;
    const user = await createDummyUser(email);
    
    if (user) {
      createdUsers.push(user);
    }
  }
  
  console.log(`Created ${createdUsers.length} dummy users successfully`);
  return createdUsers;
};

// Export a function to create a single dummy user with custom email
export const createSingleDummyUser = async (email: string) => {
  return await createDummyUser(email);
};
