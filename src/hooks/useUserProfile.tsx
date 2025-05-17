import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase, trackActivity } from '@/integrations/supabase/client';

export interface UserProfile {
  userId: string;
  fullName: string;
  email: string;
  role?: string;
  bio?: string;
  location?: string;
  skills: string[];
  education: Education[];
  employment: Employment[];
  projects: Project[];
  createdAt: string;
  updatedAt: string;
  intents: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface Employment {
  id: string;
  company: string;
  position: string;
  startDate?: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  url?: string;
  imageUrl?: string;
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile
  const fetchProfile = useCallback(async (userId?: string) => {
    const targetUserId = userId || user?.id;
    
    if (!targetUserId) {
      setIsLoading(false);
      setError("No user ID provided");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get basic user info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          user_id,
          full_name,
          email,
          bio,
          location,
          role,
          created_at,
          updated_at
        `)
        .eq('user_id', targetUserId)
        .single();

      if (userError) throw userError;

      // Get skills
      const { data: skillsData, error: skillsError } = await supabase
        .from('user_skills')
        .select(`
          skill:skills(skill_id, skill_name)
        `)
        .eq('user_id', targetUserId);

      if (skillsError) throw skillsError;

      // Get intents
      const { data: intentsData, error: intentsError } = await supabase
        .from('user_intents')
        .select(`
          intent:intents(intent_id, intent_name),
          details
        `)
        .eq('user_id', targetUserId);

      if (intentsError) throw intentsError;

      // Get education
      const { data: educationData, error: educationError } = await supabase
        .from('user_education')
        .select('*')
        .eq('user_id', targetUserId);

      if (educationError) throw educationError;

      // Get employment
      const { data: employmentData, error: employmentError } = await supabase
        .from('user_employment')
        .select('*')
        .eq('user_id', targetUserId);

      if (employmentError) throw employmentError;

      // Get projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('user_projects')
        .select('*')
        .eq('user_id', targetUserId);

      if (projectsError) throw projectsError;

      // Format profile data
      const formattedProfile: UserProfile = {
        userId: userData.user_id,
        fullName: userData.full_name,
        email: userData.email,
        role: userData.role || undefined,
        bio: userData.bio || undefined,
        location: userData.location || undefined,
        skills: skillsData.map(item => item.skill.skill_name),
        intents: intentsData.map(item => item.intent.intent_name),
        education: educationData.map(item => ({
          id: item.id,
          institution: item.institution,
          degree: item.degree || undefined,
          fieldOfStudy: item.field_of_study || undefined,
          startDate: item.start_date || undefined,
          endDate: item.end_date || undefined,
          description: item.description || undefined,
        })),
        employment: employmentData.map(item => ({
          id: item.id,
          company: item.company,
          position: item.position,
          startDate: item.start_date || undefined,
          endDate: item.end_date || undefined,
          current: !!item.current,
          description: item.description || undefined,
        })),
        projects: projectsData.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description || undefined,
          url: item.url || undefined,
          imageUrl: item.image_url || undefined,
        })),
        createdAt: userData.created_at,
        updatedAt: userData.updated_at
      };

      setProfile(formattedProfile);
      return formattedProfile;
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load user profile');
      toast.error('Failed to load user profile');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Update user profile
  const updateProfile = useCallback(async (profileData: Partial<UserProfile>) => {
    if (!user) {
      toast.error('You must be logged in to update your profile');
      return false;
    }

    try {
      // Update basic user info
      const { error: userError } = await supabase
        .from('users')
        .update({
          full_name: profileData.fullName,
          bio: profileData.bio,
          location: profileData.location,
          role: profileData.role,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (userError) throw userError;

      // Track activity
      await trackActivity(
        user.id, 
        'profile_update', 
        'Updated profile information'
      );

      // Refresh profile
      await fetchProfile();
      
      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      return false;
    }
  }, [user, fetchProfile]);

  // Update skills
  const updateSkills = useCallback(async (skills: string[]) => {
    if (!user) {
      toast.error('You must be logged in to update your skills');
      return false;
    }

    try {
      // First, get all available skills
      const { data: existingSkills, error: skillsError } = await supabase
        .from('skills')
        .select('skill_id, skill_name');
        
      if (skillsError) throw skillsError;
      
      // Find which skills need to be created
      const existingSkillNames = existingSkills.map(s => s.skill_name.toLowerCase());
      const skillsToCreate = skills.filter(s => !existingSkillNames.includes(s.toLowerCase()));
      
      // Create new skills if needed
      for (const skillName of skillsToCreate) {
        const { data: newSkill, error: createError } = await supabase
          .from('skills')
          .insert({ skill_name: skillName })
          .select('skill_id')
          .single();
          
        if (createError) throw createError;
        
        existingSkills.push({ skill_id: newSkill.skill_id, skill_name: skillName });
      }
      
      // Map skill names to IDs
      const skillNameToId = new Map(existingSkills.map(s => [s.skill_name.toLowerCase(), s.skill_id]));
      const skillIds = skills.map(s => skillNameToId.get(s.toLowerCase())).filter(Boolean);
      
      // Delete existing user skills
      const { error: deleteError } = await supabase
        .from('user_skills')
        .delete()
        .eq('user_id', user.id);
        
      if (deleteError) throw deleteError;
      
      // Insert new skills
      if (skillIds.length > 0) {
        const skillsToInsert = skillIds.map(skill_id => ({
          user_id: user.id,
          skill_id
        }));
        
        const { error: insertError } = await supabase
          .from('user_skills')
          .insert(skillsToInsert);
          
        if (insertError) throw insertError;
      }

      // Track activity
      await trackActivity(
        user.id, 
        'skills_update', 
        'Updated skills'
      );
      
      // Refresh profile
      await fetchProfile();
      
      toast.success('Skills updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating skills:', error);
      toast.error('Failed to update skills');
      return false;
    }
  }, [user, fetchProfile]);

  // Update intents
  const updateIntents = useCallback(async (intents: string[]) => {
    if (!user) {
      toast.error('You must be logged in to update your networking intents');
      return false;
    }

    try {
      // First, get all available intents
      const { data: existingIntents, error: intentsError } = await supabase
        .from('intents')
        .select('intent_id, intent_name');
        
      if (intentsError) throw intentsError;
      
      // Find which intents need to be created
      const existingIntentNames = existingIntents.map(i => i.intent_name.toLowerCase());
      const intentsToCreate = intents.filter(i => !existingIntentNames.includes(i.toLowerCase()));
      
      // Create new intents if needed
      for (const intentName of intentsToCreate) {
        const { data: newIntent, error: createError } = await supabase
          .from('intents')
          .insert({ intent_name: intentName })
          .select('intent_id')
          .single();
          
        if (createError) throw createError;
        
        existingIntents.push({ intent_id: newIntent.intent_id, intent_name: intentName });
      }
      
      // Map intent names to IDs
      const intentNameToId = new Map(existingIntents.map(i => [i.intent_name.toLowerCase(), i.intent_id]));
      const intentIds = intents.map(i => intentNameToId.get(i.toLowerCase())).filter(Boolean);
      
      // Delete existing user intents
      const { error: deleteError } = await supabase
        .from('user_intents')
        .delete()
        .eq('user_id', user.id);
        
      if (deleteError) throw deleteError;
      
      // Insert new intents
      if (intentIds.length > 0) {
        const intentsToInsert = intentIds.map(intent_id => ({
          user_id: user.id,
          intent_id
        }));
        
        const { error: insertError } = await supabase
          .from('user_intents')
          .insert(intentsToInsert);
          
        if (insertError) throw insertError;
      }
      
      // Track activity
      await trackActivity(
        user.id, 
        'intents_update', 
        'Updated networking intents'
      );
      
      // Refresh profile
      await fetchProfile();
      
      toast.success('Networking intents updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating intents:', error);
      toast.error('Failed to update networking intents');
      return false;
    }
  }, [user, fetchProfile]);

  // Add/update education entry
  const updateEducation = useCallback(async (education: Partial<Education> & { id?: string }) => {
    if (!user) {
      toast.error('You must be logged in to update your education');
      return false;
    }

    try {
      if (education.id) {
        // Update existing education entry
        const { error } = await supabase
          .from('user_education')
          .update({
            institution: education.institution,
            degree: education.degree,
            field_of_study: education.fieldOfStudy,
            start_date: education.startDate,
            end_date: education.endDate,
            description: education.description
          })
          .eq('id', education.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Add new education entry
        const { error } = await supabase
          .from('user_education')
          .insert({
            user_id: user.id,
            institution: education.institution!,
            degree: education.degree,
            field_of_study: education.fieldOfStudy,
            start_date: education.startDate,
            end_date: education.endDate,
            description: education.description
          });

        if (error) throw error;
      }

      // Track activity
      await trackActivity(
        user.id, 
        'education_update', 
        education.id ? 'Updated education entry' : 'Added new education entry'
      );

      // Refresh profile
      await fetchProfile();
      
      toast.success(education.id ? 'Education updated successfully' : 'Education added successfully');
      return true;
    } catch (error) {
      console.error('Error updating education:', error);
      toast.error('Failed to update education');
      return false;
    }
  }, [user, fetchProfile]);

  // Delete education entry
  const deleteEducation = useCallback(async (educationId: string) => {
    if (!user) {
      toast.error('You must be logged in to delete your education');
      return false;
    }

    try {
      const { error } = await supabase
        .from('user_education')
        .delete()
        .eq('id', educationId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Track activity
      await trackActivity(
        user.id, 
        'education_delete', 
        'Deleted education entry'
      );

      // Refresh profile
      await fetchProfile();
      
      toast.success('Education deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting education:', error);
      toast.error('Failed to delete education');
      return false;
    }
  }, [user, fetchProfile]);

  // Add/update employment entry
  const updateEmployment = useCallback(async (employment: Partial<Employment> & { id?: string }) => {
    if (!user) {
      toast.error('You must be logged in to update your employment');
      return false;
    }

    try {
      if (employment.id) {
        // Update existing employment entry
        const { error } = await supabase
          .from('user_employment')
          .update({
            company: employment.company,
            position: employment.position,
            start_date: employment.startDate,
            end_date: employment.endDate,
            current: employment.current,
            description: employment.description
          })
          .eq('id', employment.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Add new employment entry
        const { error } = await supabase
          .from('user_employment')
          .insert({
            user_id: user.id,
            company: employment.company!,
            position: employment.position!,
            start_date: employment.startDate,
            end_date: employment.endDate,
            current: employment.current || false,
            description: employment.description
          });

        if (error) throw error;
      }

      // Track activity
      await trackActivity(
        user.id, 
        'employment_update', 
        employment.id ? 'Updated employment entry' : 'Added new employment entry'
      );

      // Refresh profile
      await fetchProfile();
      
      toast.success(employment.id ? 'Employment updated successfully' : 'Employment added successfully');
      return true;
    } catch (error) {
      console.error('Error updating employment:', error);
      toast.error('Failed to update employment');
      return false;
    }
  }, [user, fetchProfile]);

  // Delete employment entry
  const deleteEmployment = useCallback(async (employmentId: string) => {
    if (!user) {
      toast.error('You must be logged in to delete your employment');
      return false;
    }

    try {
      const { error } = await supabase
        .from('user_employment')
        .delete()
        .eq('id', employmentId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Track activity
      await trackActivity(
        user.id, 
        'employment_delete', 
        'Deleted employment entry'
      );

      // Refresh profile
      await fetchProfile();
      
      toast.success('Employment deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting employment:', error);
      toast.error('Failed to delete employment');
      return false;
    }
  }, [user, fetchProfile]);

  // Add/update project entry
  const updateProject = useCallback(async (project: Partial<Project> & { id?: string }) => {
    if (!user) {
      toast.error('You must be logged in to update your projects');
      return false;
    }

    try {
      if (project.id) {
        // Update existing project entry
        const { error } = await supabase
          .from('user_projects')
          .update({
            title: project.title,
            description: project.description,
            url: project.url,
            image_url: project.imageUrl
          })
          .eq('id', project.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Add new project entry
        const { error } = await supabase
          .from('user_projects')
          .insert({
            user_id: user.id,
            title: project.title!,
            description: project.description,
            url: project.url,
            image_url: project.imageUrl
          });

        if (error) throw error;
      }

      // Track activity
      await trackActivity(
        user.id, 
        'project_update', 
        project.id ? 'Updated project entry' : 'Added new project entry'
      );

      // Refresh profile
      await fetchProfile();
      
      toast.success(project.id ? 'Project updated successfully' : 'Project added successfully');
      return true;
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
      return false;
    }
  }, [user, fetchProfile]);

  // Delete project entry
  const deleteProject = useCallback(async (projectId: string) => {
    if (!user) {
      toast.error('You must be logged in to delete your project');
      return false;
    }

    try {
      const { error } = await supabase
        .from('user_projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Track activity
      await trackActivity(
        user.id, 
        'project_delete', 
        'Deleted project entry'
      );

      // Refresh profile
      await fetchProfile();
      
      toast.success('Project deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
      return false;
    }
  }, [user, fetchProfile]);

  // Fix the uploadAndParseResume function
  const uploadAndParseResume = useCallback(async (file: File) => {
    if (!user) {
      toast.error('You must be logged in to upload a resume');
      return null;
    }

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('userId', user.id);

    try {
      // Get the session using Supabase client
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        throw new Error('No active session');
      }

      // Use the correct URL for the Supabase function
      const response = await fetch(`https://dvdkihicwovcfbwlfmrk.supabase.co/functions/v1/parse-resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Resume parsing failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to parse resume');
      }

      // Track activity
      await trackActivity(
        user.id, 
        'resume_upload', 
        'Uploaded and parsed resume'
      );

      toast.success('Resume parsed successfully');
      return result.resumeData;
    } catch (error) {
      console.error('Error uploading and parsing resume:', error);
      toast.error('Failed to upload and parse resume');
      return null;
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setIsLoading(false);
    }
  }, [user, fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    updateSkills,
    updateIntents,
    updateEducation,
    deleteEducation,
    updateEmployment,
    deleteEmployment,
    updateProject,
    deleteProject,
    uploadAndParseResume
  };
}
