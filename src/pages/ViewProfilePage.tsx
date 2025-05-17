
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, UserPlus, Shield, Briefcase, Book, FolderKanban, Calendar } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useConnections } from "@/hooks/useConnections";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

// MatchAnalysis component to display AI-powered match analysis
const MatchAnalysis = ({ userId, targetUserId }: { userId: string, targetUserId: string }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        
        if (!session.session) {
          throw new Error("Not authenticated");
        }
        
        const response = await fetch(`https://dvdkihicwovcfbwlfmrk.supabase.co/functions/v1/user-match-analysis`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session.access_token}`
          },
          body: JSON.stringify({
            userId,
            targetUserId
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to get analysis: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success) {
          setAnalysis(data.matchAnalysis);
        } else {
          throw new Error(data.error || "Failed to get match analysis");
        }
      } catch (err) {
        console.error("Error fetching match analysis:", err);
        setError("Failed to load match analysis");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnalysis();
  }, [userId, targetUserId]);
  
  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>AI-Powered Match Analysis</CardTitle>
          <CardDescription>Analyzing professional compatibility...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-6">
            <div className="animate-pulse bg-gray-200 h-4 w-full rounded mb-2"></div>
            <div className="animate-pulse bg-gray-200 h-4 w-full rounded mb-2"></div>
            <div className="animate-pulse bg-gray-200 h-4 w-3/4 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error || !analysis) {
    return null;
  }
  
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>AI-Powered Match Analysis</CardTitle>
        <CardDescription>Why this might be a valuable connection</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 p-4 rounded-md">
          <p className="text-gray-700 whitespace-pre-line">{analysis}</p>
        </div>
      </CardContent>
    </Card>
  );
};

// Format date helper function
const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  return format(new Date(dateString), 'MMM yyyy');
};

const ViewProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { fetchProfile, profile, isLoading } = useUserProfile();
  const { sendConnectionRequest, connections, receivedRequests, sentRequests } = useConnections();
  const [isBlocked, setIsBlocked] = useState(false);
  
  // Determine the connection status with this user
  const determineConnectionStatus = () => {
    if (!user || !id) return "none";
    
    // Check if already connected
    const isConnected = connections.some(conn => 
      (conn.senderId === user.id && conn.receiverId === id) || 
      (conn.senderId === id && conn.receiverId === user.id)
    );
    
    if (isConnected) return "connected";
    
    // Check if user has sent a request to this profile
    const hasSentRequest = sentRequests.some(req => 
      req.senderId === user.id && req.receiverId === id
    );
    
    if (hasSentRequest) return "sent";
    
    // Check if this profile has sent a request to the user
    const hasReceivedRequest = receivedRequests.some(req => 
      req.senderId === id && req.receiverId === user.id
    );
    
    if (hasReceivedRequest) return "received";
    
    return "none";
  };
  
  const connectionStatus = determineConnectionStatus();
  
  useEffect(() => {
    if (id) {
      fetchProfile(id);
    }
  }, [id, fetchProfile]);
  
  const handleConnect = () => {
    if (id) {
      sendConnectionRequest(id);
    }
  };
  
  const handleBlock = () => {
    setIsBlocked(!isBlocked);
    // In a real app, this would block the user
    console.log(`${isBlocked ? 'Unblocking' : 'Blocking'} ${profile?.fullName}`);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!profile) {
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
        <h1 className="text-2xl font-bold">{profile.fullName}'s Profile</h1>
        <div className="flex gap-2">
          {connectionStatus === "none" && !isBlocked && (
            <Button onClick={handleConnect}>
              <UserPlus className="h-4 w-4 mr-2" />
              Connect
            </Button>
          )}
          
          {connectionStatus === "sent" && !isBlocked && (
            <Button variant="outline" disabled>
              Request Pending
            </Button>
          )}
          
          {connectionStatus === "received" && !isBlocked && (
            <Button onClick={handleConnect}>
              Accept Request
            </Button>
          )}
          
          {connectionStatus === "connected" && !isBlocked && (
            <Button asChild>
              <Link to={`/messaging/${id}`}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Link>
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
                <div>
                  <p className="text-sm text-gray-500">Professional Role</p>
                  <p className="font-medium">{profile.role || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{profile.location || "Not specified"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Bio</p>
                <p className="mt-1">{profile.bio || "No bio available"}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Skills</p>
                <div className="flex flex-wrap gap-1">
                  {profile.skills && profile.skills.length > 0 ? (
                    profile.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-gray-500">No skills listed</p>
                  )}
                </div>
              </div>
              
              {profile.intents && profile.intents.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Networking Interests</p>
                  <div className="flex flex-wrap gap-1">
                    {profile.intents.map((intent) => (
                      <Badge key={intent} variant="outline">
                        {intent}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Display AI match analysis if current user is logged in */}
          {user && user.id !== id && (
            <MatchAnalysis userId={user.id} targetUserId={id} />
          )}
          
          {/* Education */}
          {profile.education && profile.education.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <Book className="h-5 w-5 mr-2 text-gray-500" />
                  <CardTitle>Education</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profile.education.map((edu) => (
                    <div key={edu.id} className="border-l-2 border-gray-200 pl-4 py-1">
                      <h4 className="font-medium">{edu.institution}</h4>
                      {edu.degree && (
                        <p className="text-sm">{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</p>
                      )}
                      {(edu.startDate || edu.endDate) && (
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(edu.startDate)} - {edu.endDate ? formatDate(edu.endDate) : 'Present'}
                        </div>
                      )}
                      {edu.description && (
                        <p className="text-sm text-gray-600 mt-2">{edu.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Employment */}
          {profile.employment && profile.employment.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <Briefcase className="h-5 w-5 mr-2 text-gray-500" />
                  <CardTitle>Employment</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profile.employment.map((job) => (
                    <div key={job.id} className="border-l-2 border-gray-200 pl-4 py-1">
                      <h4 className="font-medium">{job.position}</h4>
                      <p className="text-sm">{job.company}</p>
                      {(job.startDate || job.endDate || job.current) && (
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(job.startDate)} - {job.current ? 'Present' : job.endDate ? formatDate(job.endDate) : 'Present'}
                        </div>
                      )}
                      {job.description && (
                        <p className="text-sm text-gray-600 mt-2">{job.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Projects */}
          {profile.projects && profile.projects.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <FolderKanban className="h-5 w-5 mr-2 text-gray-500" />
                  <CardTitle>Projects</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profile.projects.map((project) => (
                    <div key={project.id} className="border-l-2 border-gray-200 pl-4 py-1">
                      <h4 className="font-medium">{project.title}</h4>
                      {project.description && (
                        <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                      )}
                      {project.url && (
                        <a 
                          href={project.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                        >
                          View Project
                        </a>
                      )}
                      {project.imageUrl && (
                        <div className="mt-2">
                          <img 
                            src={project.imageUrl} 
                            alt={project.title} 
                            className="rounded-md max-h-40 object-cover"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default ViewProfilePage;
