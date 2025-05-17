
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, X, Check, User, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Define interfaces for our data
interface UserData {
  user_id: string;
  full_name: string;
  role: string | null;
  location: string | null;
  skills: { skill_name: string }[];
}

interface ConnectionData {
  id: string;
  created_at: string;
  receiver: UserData | null;
  sender: UserData | null;
  status: string;
}

const ConnectionsPage = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<ConnectionData[]>([]);
  const [requests, setRequests] = useState<ConnectionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (user) {
      fetchConnections();
    }
  }, [user]);
  
  const fetchConnections = async () => {
    setIsLoading(true);
    try {
      // Get accepted connections
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('connection_requests')
        .select(`
          id,
          status,
          created_at,
          sender:sender_id(user_id:user_id, full_name, role, location, skills:user_skills(skill:skills(skill_name))),
          receiver:receiver_id(user_id:user_id, full_name, role, location, skills:user_skills(skill:skills(skill_name)))
        `)
        .eq('status', 'accepted')
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`);
      
      if (connectionsError) {
        toast.error("Failed to fetch connections");
        console.error(connectionsError);
      } else if (connectionsData) {
        // Process the connections to extract skill names and handle possible nulls
        const processedConnections = connectionsData.map(conn => ({
          ...conn,
          receiver: conn.receiver ? {
            ...conn.receiver,
            skills: conn.receiver.skills?.map((s: any) => ({ 
              skill_name: s.skill?.skill_name || "Unknown skill" 
            })) || []
          } : null,
          sender: conn.sender ? {
            ...conn.sender,
            skills: conn.sender.skills?.map((s: any) => ({ 
              skill_name: s.skill?.skill_name || "Unknown skill" 
            })) || []
          } : null
        }));
        
        setConnections(processedConnections);
      }
      
      // Get pending requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('connection_requests')
        .select(`
          id,
          status,
          created_at,
          sender:sender_id(user_id:user_id, full_name, role, location, skills:user_skills(skill:skills(skill_name))),
          receiver:receiver_id(user_id:user_id, full_name, role, location, skills:user_skills(skill:skills(skill_name)))
        `)
        .eq('status', 'pending')
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`);
      
      if (requestsError) {
        toast.error("Failed to fetch connection requests");
        console.error(requestsError);
      } else if (requestsData) {
        // Process the requests to extract skill names and handle possible nulls
        const processedRequests = requestsData.map(conn => ({
          ...conn,
          receiver: conn.receiver ? {
            ...conn.receiver,
            skills: conn.receiver.skills?.map((s: any) => ({ 
              skill_name: s.skill?.skill_name || "Unknown skill" 
            })) || []
          } : null,
          sender: conn.sender ? {
            ...conn.sender,
            skills: conn.sender.skills?.map((s: any) => ({ 
              skill_name: s.skill?.skill_name || "Unknown skill" 
            })) || []
          } : null,
          type: conn.sender_id === user?.id ? 'sent' : 'received'
        }));
        
        setRequests(processedRequests);
      }
    } catch (error) {
      console.error("Error fetching connections:", error);
      toast.error("Something went wrong while fetching your connections");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAcceptRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('connection_requests')
        .update({ status: 'accepted' })
        .eq('id', id);
      
      if (error) {
        toast.error("Failed to accept connection request");
        console.error(error);
      } else {
        toast.success("Connection request accepted");
        
        // Find the accepted request to add to connections
        const acceptedRequest = requests.find(req => req.id === id);
        
        if (acceptedRequest) {
          // Remove from requests
          setRequests(prev => prev.filter(req => req.id !== id));
          
          // Add to connections
          setConnections(prev => [...prev, {
            ...acceptedRequest,
            status: 'accepted'
          }]);
        }
      }
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error("Something went wrong");
    }
  };
  
  const handleDeclineRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('connection_requests')
        .update({ status: 'rejected' })
        .eq('id', id);
      
      if (error) {
        toast.error("Failed to decline connection request");
        console.error(error);
      } else {
        toast.success("Connection request declined");
        setRequests(prev => prev.filter(req => req.id !== id));
      }
    } catch (error) {
      console.error("Error declining request:", error);
      toast.error("Something went wrong");
    }
  };
  
  const handleCancelRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('connection_requests')
        .delete()
        .eq('id', id);
      
      if (error) {
        toast.error("Failed to cancel connection request");
        console.error(error);
      } else {
        toast.success("Connection request cancelled");
        setRequests(prev => prev.filter(req => req.id !== id));
      }
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast.error("Something went wrong");
    }
  };
  
  // Function to get the other user in a connection (not the current user)
  const getConnectionUser = (conn: ConnectionData): UserData | null => {
    if (!user) return null;
    
    // If the current user is the receiver, return the sender
    if (conn.receiver?.user_id === user.id) {
      return conn.sender;
    }
    // If the current user is the sender, return the receiver
    else if (conn.sender?.user_id === user.id) {
      return conn.receiver;
    }
    
    return null;
  };
  
  // Function to get connection date in a readable format
  const formatConnectionDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Your Network</h1>
      
      <Tabs defaultValue="connections" className="w-full">
        <TabsList>
          <TabsTrigger value="connections">
            Connections ({connections.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending Requests ({requests.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="connections" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading your connections...</span>
            </div>
          ) : connections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connections.map(conn => {
                const connectionUser = getConnectionUser(conn);
                if (!connectionUser) return null;
                
                const firstLetter = connectionUser.full_name ? connectionUser.full_name.charAt(0).toUpperCase() : '?';
                
                return (
                  <Card key={conn.id} className="card-hover">
                    <CardHeader className="pb-2">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full gradient-bg flex items-center justify-center text-white font-medium mr-3">
                          {firstLetter}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{connectionUser.full_name}</CardTitle>
                          <CardDescription>{connectionUser.role || 'No role specified'}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-sm text-gray-500 mb-2">
                        {connectionUser.location || 'Location not specified'}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {connectionUser.skills && connectionUser.skills.length > 0 ? 
                          connectionUser.skills.map((skill, index) => (
                            <Badge key={`${conn.id}-${index}`} variant="secondary" className="text-xs">
                              {skill.skill_name}
                            </Badge>
                          )) : 
                          <span className="text-xs text-gray-500">No skills listed</span>
                        }
                      </div>
                      <p className="text-xs text-gray-500">
                        Connected since {formatConnectionDate(conn.created_at)}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/profile/${connectionUser.user_id}`}>
                          <User className="h-4 w-4 mr-1" />
                          Profile
                        </Link>
                      </Button>
                      <Button size="sm" asChild>
                        <Link to={`/messaging/${connectionUser.user_id}`}>
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Message
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <h3 className="text-lg font-medium mb-2">No connections yet</h3>
              <p className="text-gray-500 mb-4">
                Start networking by searching for people or accepting connection requests
              </p>
              <Button asChild>
                <Link to="/search">Find People</Link>
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="pending" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading your requests...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Received requests */}
              {requests.filter(req => req.sender?.user_id !== user?.id).length > 0 && (
                <div>
                  <h3 className="font-medium text-lg mb-4">Requests Received</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requests
                      .filter(req => req.sender?.user_id !== user?.id)
                      .map(request => {
                        const firstLetter = request.sender?.full_name ? request.sender.full_name.charAt(0).toUpperCase() : '?';
                        
                        return (
                          <Card key={request.id}>
                            <CardHeader className="pb-2">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full gradient-bg flex items-center justify-center text-white font-medium mr-3">
                                  {firstLetter}
                                </div>
                                <div>
                                  <CardTitle className="text-lg">{request.sender?.full_name || 'Unknown User'}</CardTitle>
                                  <CardDescription>{request.sender?.role || 'No role specified'}</CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pb-2">
                              <p className="text-sm text-gray-500 mb-2">
                                {request.sender?.location || 'Location not specified'}
                              </p>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {request.sender?.skills && request.sender.skills.length > 0 ? 
                                  request.sender.skills.map((skill, index) => (
                                    <Badge key={`${request.id}-${index}`} variant="secondary" className="text-xs">
                                      {skill.skill_name}
                                    </Badge>
                                  )) : 
                                  <span className="text-xs text-gray-500">No skills listed</span>
                                }
                              </div>
                              <p className="text-xs text-gray-500">
                                Requested {formatConnectionDate(request.created_at)}
                              </p>
                            </CardContent>
                            <CardFooter>
                              <div className="flex justify-between w-full">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 mr-2"
                                  onClick={() => handleDeclineRequest(request.id)}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Decline
                                </Button>
                                <Button
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => handleAcceptRequest(request.id)}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Accept
                                </Button>
                              </div>
                            </CardFooter>
                          </Card>
                        );
                      })}
                  </div>
                </div>
              )}
              
              {/* Sent requests */}
              {requests.filter(req => req.sender?.user_id === user?.id).length > 0 && (
                <div className="mt-8">
                  <h3 className="font-medium text-lg mb-4">Requests Sent</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requests
                      .filter(req => req.sender?.user_id === user?.id)
                      .map(request => {
                        const firstLetter = request.receiver?.full_name ? request.receiver.full_name.charAt(0).toUpperCase() : '?';
                        
                        return (
                          <Card key={request.id}>
                            <CardHeader className="pb-2">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full gradient-bg flex items-center justify-center text-white font-medium mr-3">
                                  {firstLetter}
                                </div>
                                <div>
                                  <CardTitle className="text-lg">{request.receiver?.full_name || 'Unknown User'}</CardTitle>
                                  <CardDescription>{request.receiver?.role || 'No role specified'}</CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pb-2">
                              <p className="text-sm text-gray-500 mb-2">
                                {request.receiver?.location || 'Location not specified'}
                              </p>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {request.receiver?.skills && request.receiver.skills.length > 0 ? 
                                  request.receiver.skills.map((skill, index) => (
                                    <Badge key={`${request.id}-${index}`} variant="secondary" className="text-xs">
                                      {skill.skill_name}
                                    </Badge>
                                  )) : 
                                  <span className="text-xs text-gray-500">No skills listed</span>
                                }
                              </div>
                              <p className="text-xs text-gray-500">
                                Sent {formatConnectionDate(request.created_at)}
                              </p>
                            </CardContent>
                            <CardFooter>
                              <div className="flex justify-between w-full">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  asChild
                                  className="flex-1 mr-2"
                                >
                                  <Link to={`/profile/${request.receiver?.user_id}`}>
                                    <User className="h-4 w-4 mr-1" />
                                    View Profile
                                  </Link>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="flex-1 text-gray-600 hover:text-gray-900"
                                  onClick={() => handleCancelRequest(request.id)}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </CardFooter>
                          </Card>
                        );
                      })}
                  </div>
                </div>
              )}
              
              {requests.length === 0 && (
                <div className="text-center py-10">
                  <h3 className="text-lg font-medium mb-2">No pending requests</h3>
                  <p className="text-gray-500 mb-4">
                    You don't have any pending connection requests at the moment
                  </p>
                  <Button asChild>
                    <Link to="/search">Find People</Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConnectionsPage;
