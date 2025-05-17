
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, Search, MessageSquare, Loader2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ConnectionProfile {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  location: string;
  skills: string[];
  connectionId: string;
  status: string;
}

interface UserData {
  user_id: string;
  full_name: string;
  role: string | null;
  location: string | null;
  skills: Array<{skill?: {skill_name: string}}>;
}

interface SkillData {
  skill?: {
    skill_name: string;
  };
}

const ConnectionsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("connections");
  const [connections, setConnections] = useState<ConnectionProfile[]>([]);
  const [pendingReceived, setPendingReceived] = useState<ConnectionProfile[]>([]);
  const [pendingSent, setPendingSent] = useState<ConnectionProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const loadConnections = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Get accepted connections
      const { data: acceptedData, error: acceptedError } = await supabase
        .from('connection_requests')
        .select(`
          id,
          sender_id,
          sender:sender_id(
            user_id,
            full_name,
            role,
            location,
            skills:user_skills(skill:skills(skill_name))
          ),
          receiver_id,
          receiver:receiver_id(
            user_id,
            full_name,
            role,
            location,
            skills:user_skills(skill:skills(skill_name))
          ),
          status
        `)
        .eq('status', 'accepted')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      
      if (acceptedError) throw acceptedError;
      
      // Get pending sent requests
      const { data: sentData, error: sentError } = await supabase
        .from('connection_requests')
        .select(`
          id,
          sender_id,
          receiver_id,
          receiver:receiver_id(
            user_id,
            full_name,
            role,
            location,
            skills:user_skills(skill:skills(skill_name))
          ),
          status
        `)
        .eq('sender_id', user.id)
        .eq('status', 'pending');
      
      if (sentError) throw sentError;
      
      // Get pending received requests
      const { data: receivedData, error: receivedError } = await supabase
        .from('connection_requests')
        .select(`
          id,
          receiver_id,
          sender_id,
          sender:sender_id(
            user_id,
            full_name,
            role,
            location,
            skills:user_skills(skill:skills(skill_name))
          ),
          status
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending');
      
      if (receivedError) throw receivedError;
      
      // Format the accepted connections
      const acceptedConnections = (acceptedData || []).map(conn => {
        const isCurrentUserSender = conn.sender_id === user.id;
        // Use type assertion to handle the possible error types
        const profile = isCurrentUserSender ? conn.receiver as UserData : conn.sender as UserData;
        
        return {
          id: profile.user_id,
          name: profile.full_name,
          role: profile.role || "Professional",
          location: profile.location || "Location not specified",
          skills: profile.skills?.map(s => s.skill?.skill_name).filter(Boolean) || [],
          connectionId: conn.id,
          status: conn.status
        };
      });
      
      // Format the sent requests
      const formattedSent = (sentData || []).map(conn => ({
        id: (conn.receiver as UserData).user_id,
        name: (conn.receiver as UserData).full_name,
        role: (conn.receiver as UserData).role || "Professional",
        location: (conn.receiver as UserData).location || "Location not specified",
        skills: (conn.receiver as UserData).skills?.map(s => s.skill?.skill_name).filter(Boolean) || [],
        connectionId: conn.id,
        status: conn.status
      }));
      
      // Format the received requests
      const formattedReceived = (receivedData || []).map(conn => ({
        id: (conn.sender as UserData).user_id,
        name: (conn.sender as UserData).full_name,
        role: (conn.sender as UserData).role || "Professional",
        location: (conn.sender as UserData).location || "Location not specified",
        skills: (conn.sender as UserData).skills?.map(s => s.skill?.skill_name).filter(Boolean) || [],
        connectionId: conn.id,
        status: conn.status
      }));
      
      setConnections(acceptedConnections);
      setPendingSent(formattedSent);
      setPendingReceived(formattedReceived);
      
      // Automatically switch to the "Requests" tab if there are pending requests
      if (formattedReceived.length > 0 && activeTab === "connections") {
        setActiveTab("requests");
      }
    } catch (error) {
      console.error("Error loading connections:", error);
      toast.error("Failed to load connections");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadConnections();
    
    // Set up real-time subscriptions for connection requests
    const channel = supabase
      .channel('realtime:connections')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connection_requests',
          filter: `receiver_id=eq.${user?.id}`
        },
        () => {
          // Reload connections when a change happens
          loadConnections();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  const handleResponseToRequest = async (connectionId: string, accept: boolean) => {
    try {
      if (accept) {
        // Accept the connection request
        const { error } = await supabase
          .from('connection_requests')
          .update({ status: 'accepted' })
          .eq('id', connectionId);
        
        if (error) throw error;
        
        toast.success("Connection request accepted");
      } else {
        // Decline the connection request
        const { error } = await supabase
          .from('connection_requests')
          .update({ status: 'declined' })
          .eq('id', connectionId);
        
        if (error) throw error;
        
        toast.success("Connection request declined");
      }
      
      // Reload connections
      loadConnections();
    } catch (error) {
      console.error("Error responding to connection request:", error);
      toast.error("Failed to process request");
    }
  };
  
  const cancelRequest = async (connectionId: string) => {
    try {
      // Delete the connection request
      const { error } = await supabase
        .from('connection_requests')
        .delete()
        .eq('id', connectionId);
      
      if (error) throw error;
      
      toast.success("Connection request cancelled");
      
      // Reload connections
      loadConnections();
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast.error("Failed to cancel request");
    }
  };
  
  const removeConnection = async (connectionId: string) => {
    try {
      // Delete the connection
      const { error } = await supabase
        .from('connection_requests')
        .delete()
        .eq('id', connectionId);
      
      if (error) throw error;
      
      toast.success("Connection removed");
      
      // Reload connections
      loadConnections();
    } catch (error) {
      console.error("Error removing connection:", error);
      toast.error("Failed to remove connection");
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  // Filter connections based on search query
  const filteredConnections = connections.filter(conn => 
    conn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conn.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conn.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Set the badge count for pending requests
  const pendingCount = pendingReceived.length;
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Connections</h1>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          placeholder="Search your connections..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="connections">My Connections</TabsTrigger>
          <TabsTrigger value="requests" className="relative">
            Requests
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-xs rounded-full flex items-center justify-center text-primary-foreground">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="connections" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredConnections.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium">No connections yet</h3>
              <p className="text-gray-500 mt-1">
                Start by searching for people or accepting connection requests
              </p>
              <Button className="mt-4" asChild>
                <Link to="/search">Find People</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredConnections.map((connection) => (
                <Card key={connection.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={connection.avatar} />
                        <AvatarFallback>{getInitials(connection.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{connection.name}</CardTitle>
                        <CardDescription>{connection.role}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-gray-500 mb-2">{connection.location}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {connection.skills.slice(0, 3).map((skill, i) => (
                        <Badge key={i} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                      {connection.skills.length > 3 && (
                        <Badge variant="outline">+{connection.skills.length - 3}</Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/profile/${connection.id}`}>View Profile</Link>
                    </Button>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removeConnection(connection.connectionId)}
                      >
                        Remove
                      </Button>
                      <Button size="sm" asChild>
                        <Link to={`/messaging/${connection.id}`}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message
                        </Link>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="requests" className="mt-6">
          <div className="space-y-8">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Pending received requests */}
                <div>
                  <h2 className="font-medium text-lg mb-4">Received Requests</h2>
                  {pendingReceived.length === 0 ? (
                    <p className="text-gray-500 text-center py-6">
                      No pending requests received
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {pendingReceived.map((request) => (
                        <Card key={request.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarImage src={request.avatar} />
                                <AvatarFallback>{getInitials(request.name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-lg">{request.name}</CardTitle>
                                <CardDescription>{request.role}</CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <p className="text-sm text-gray-500 mb-2">{request.location}</p>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {request.skills.slice(0, 3).map((skill, i) => (
                                <Badge key={i} variant="secondary">
                                  {skill}
                                </Badge>
                              ))}
                              {request.skills.length > 3 && (
                                <Badge variant="outline">+{request.skills.length - 3}</Badge>
                              )}
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-between pt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 mr-2"
                              onClick={() => handleResponseToRequest(request.connectionId, false)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Decline
                            </Button>
                            <Button 
                              size="sm" 
                              className="flex-1"
                              onClick={() => handleResponseToRequest(request.connectionId, true)}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Accept
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Pending sent requests */}
                <div>
                  <h2 className="font-medium text-lg mb-4">Sent Requests</h2>
                  {pendingSent.length === 0 ? (
                    <p className="text-gray-500 text-center py-6">
                      No pending requests sent
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {pendingSent.map((request) => (
                        <Card key={request.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarImage src={request.avatar} />
                                <AvatarFallback>{getInitials(request.name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-lg">{request.name}</CardTitle>
                                <CardDescription>{request.role}</CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <p className="text-sm text-gray-500 mb-2">{request.location}</p>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {request.skills.slice(0, 3).map((skill, i) => (
                                <Badge key={i} variant="secondary">
                                  {skill}
                                </Badge>
                              ))}
                              {request.skills.length > 3 && (
                                <Badge variant="outline">+{request.skills.length - 3}</Badge>
                              )}
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-between pt-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/profile/${request.id}`}>View Profile</Link>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => cancelRequest(request.connectionId)}
                            >
                              Cancel Request
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConnectionsPage;
