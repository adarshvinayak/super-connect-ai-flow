
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, UserPlus, Shield, Loader2, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserProfile {
  user_id: string;
  full_name: string;
  role: string | null;
  location: string | null;
  bio: string | null;
  skills: { skill_name: string }[];
  education: {
    id: string;
    institution: string;
    degree: string | null;
    field_of_study: string | null;
    start_date: string | null;
    end_date: string | null;
    description: string | null;
  }[];
  employment: {
    id: string;
    company: string;
    position: string;
    start_date: string | null;
    end_date: string | null;
    description: string | null;
    current: boolean;
  }[];
  projects: {
    id: string;
    title: string;
    description: string | null;
    url: string | null;
    image_url: string | null;
  }[];
  links: {
    platform: string;
    profile_url: string;
  }[];
}

type ConnectionStatus = 'none' | 'pending' | 'connected';

const ViewProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [isBlocked, setIsBlocked] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('none');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (id && user) {
      fetchUserProfile();
      checkConnectionStatus();
    }
  }, [id, user]);
  
  const fetchUserProfile = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      // Fetch user basic info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          user_id,
          full_name,
          role,
          location,
          bio
        `)
        .eq('user_id', id)
        .single();
      
      if (userError) {
        throw userError;
      }
      
      if (!userData) {
        setUserProfile(null);
        setIsLoading(false);
        return;
      }
      
      // Fetch skills
      const { data: skillsData } = await supabase
        .from('user_skills')
        .select('skill:skills(skill_name)')
        .eq('user_id', id);
      
      const skills = (skillsData || []).map((skillEntry: any) => ({
        skill_name: skillEntry.skill?.skill_name || "Unknown"
      }));
      
      // Fetch education
      const { data: educationData } = await supabase
        .from('user_education')
        .select('*')
        .eq('user_id', id);
      
      // Fetch employment
      const { data: employmentData } = await supabase
        .from('user_employment')
        .select('*')
        .eq('user_id', id);
      
      // Fetch projects
      const { data: projectsData } = await supabase
        .from('user_projects')
        .select('*')
        .eq('user_id', id);
      
      // Fetch social links
      const { data: linksData } = await supabase
        .from('social_profiles')
        .select('platform, profile_url')
        .eq('user_id', id);
      
      // Fetch portfolio
      const { data: portfolioData } = await supabase
        .from('portfolios')
        .select('portfolio_url')
        .eq('user_id', id);
      
      // Combine all links
      const links = [
        ...(linksData || []),
        ...(portfolioData || []).map((p: any) => ({
          platform: 'portfolio',
          profile_url: p.portfolio_url
        }))
      ];
      
      // Construct complete profile
      const profile: UserProfile = {
        ...userData,
        skills: skills,
        education: educationData || [],
        employment: employmentData || [],
        projects: projectsData || [],
        links: links
      };
      
      setUserProfile(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Failed to load user profile");
    } finally {
      setIsLoading(false);
    }
  };
  
  const checkConnectionStatus = async () => {
    if (!id || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('connection_requests')
        .select('status')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${user.id})`)
        .maybeSingle();
      
      if (error) {
        console.error("Error checking connection status:", error);
        return;
      }
      
      if (!data) {
        setConnectionStatus('none');
      } else if (data.status === 'accepted') {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('pending');
      }
    } catch (error) {
      console.error("Error checking connection status:", error);
    }
  };
  
  const handleConnect = async () => {
    if (!user || !id) {
      toast.error("You must be logged in to connect");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('connection_requests')
        .insert({
          sender_id: user.id,
          receiver_id: id,
          status: 'pending',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast.success("Connection request sent");
      setConnectionStatus('pending');
    } catch (error: any) {
      console.error("Error sending connection request:", error);
      toast.error(error.message || "Failed to send connection request");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleMessage = () => {
    // Navigate to messaging page is handled by the Link component
  };
  
  const handleBlock = () => {
    setIsBlocked(!isBlocked);
    toast(isBlocked ? "User unblocked" : "User blocked");
    // In a real implementation, we would update a 'blocked_users' table
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <p className="mt-4 text-gray-600">Loading profile...</p>
      </div>
    );
  }
  
  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h3 className="text-xl font-semibold mb-2">User not found</h3>
        <p className="text-gray-600">The profile you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{userProfile.full_name}'s Profile</h1>
        <div className="flex gap-2">
          {connectionStatus === "none" && !isBlocked && (
            <Button onClick={handleConnect} disabled={isSubmitting}>
              <UserPlus className="h-4 w-4 mr-2" />
              {isSubmitting ? "Sending..." : "Connect"}
            </Button>
          )}
          
          {connectionStatus === "pending" && !isBlocked && (
            <Button variant="outline" disabled>
              Request Pending
            </Button>
          )}
          
          {connectionStatus === "connected" && !isBlocked && (
            <Button onClick={handleMessage} asChild>
              <a href={`/messaging/${id}`}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </a>
            </Button>
          )}
          
          {!isBlocked ? (
            <Button variant="outline" onClick={handleBlock}>
              <Shield className="h-4 w-4 mr-2" />
              Block
            </Button>
          ) : (
            <Button variant="destructive" onClick={handleBlock}>
              Unblock
            </Button>
          )}
        </div>
      </div>
      
      {isBlocked ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <h3 className="text-xl font-semibold mb-2">User Blocked</h3>
              <p className="text-gray-600 mb-4">You've blocked this user. They won't be able to contact you or see your profile.</p>
              <Button onClick={handleBlock}>Unblock User</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Personal and professional details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userProfile.role && (
                  <div>
                    <p className="text-sm text-gray-500">Professional Role</p>
                    <p className="font-medium">{userProfile.role}</p>
                  </div>
                )}
                
                {userProfile.location && (
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{userProfile.location}</p>
                  </div>
                )}
              </div>

              {userProfile.bio && (
                <div>
                  <p className="text-sm text-gray-500">Bio</p>
                  <p className="mt-1">{userProfile.bio}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500 mb-2">Skills</p>
                <div className="flex flex-wrap gap-1">
                  {userProfile.skills && userProfile.skills.length > 0 ? (
                    userProfile.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill.skill_name}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No skills listed</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Education */}
          {userProfile.education && userProfile.education.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Education</CardTitle>
                <CardDescription>Academic background</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userProfile.education.map((edu) => (
                    <div key={edu.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <h4 className="font-medium">{edu.institution}</h4>
                      {edu.degree && <p>{edu.degree}</p>}
                      {edu.field_of_study && <p className="text-sm text-gray-600">{edu.field_of_study}</p>}
                      {(edu.start_date || edu.end_date) && (
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(edu.start_date)}
                          {edu.start_date && edu.end_date && <span className="mx-1">-</span>}
                          {formatDate(edu.end_date)}
                        </div>
                      )}
                      {edu.description && <p className="mt-2 text-sm">{edu.description}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Employment */}
          {userProfile.employment && userProfile.employment.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Work Experience</CardTitle>
                <CardDescription>Professional background</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userProfile.employment.map((job) => (
                    <div key={job.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <h4 className="font-medium">{job.position}</h4>
                      <p className="text-sm">{job.company}</p>
                      {(job.start_date || job.end_date || job.current) && (
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(job.start_date)}
                          <span className="mx-1">-</span>
                          {job.current ? (
                            <span>Present</span>
                          ) : (
                            formatDate(job.end_date)
                          )}
                        </div>
                      )}
                      {job.description && <p className="mt-2 text-sm">{job.description}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Projects */}
          {userProfile.projects && userProfile.projects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Projects</CardTitle>
                <CardDescription>Work showcase</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userProfile.projects.map((project) => (
                    <div key={project.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <h4 className="font-medium">{project.title}</h4>
                      {project.description && <p className="text-sm mt-1">{project.description}</p>}
                      {project.url && (
                        <a 
                          href={project.url}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-supernet-blue hover:underline mt-1 inline-block"
                        >
                          View Project →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Professional Links */}
          {userProfile.links && userProfile.links.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Professional Links</CardTitle>
                <CardDescription>Online presence</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {userProfile.links.map((link, index) => (
                    <li key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <span className="font-medium capitalize">{link.platform}</span>
                      <a
                        href={link.profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-supernet-blue hover:underline"
                      >
                        {link.profile_url}
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default ViewProfilePage;
