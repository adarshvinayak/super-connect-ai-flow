
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, X, Check, User } from "lucide-react";
import { useConnections } from "@/hooks/useConnections";
import { useUserProfile } from "@/hooks/useUserProfile";

const ConnectionsPage = () => {
  const { connections, receivedRequests, sentRequests, acceptConnectionRequest, rejectConnectionRequest, cancelConnectionRequest } = useConnections();
  const { fetchProfile } = useUserProfile();
  const [connectionProfiles, setConnectionProfiles] = useState<{[key: string]: any}>({});
  
  // Fetch profile details for a connection
  const getConnectionProfile = async (userId: string) => {
    if (connectionProfiles[userId]) {
      return connectionProfiles[userId];
    }
    
    const profile = await fetchProfile(userId);
    if (profile) {
      setConnectionProfiles(prev => ({ ...prev, [userId]: profile }));
      return profile;
    }
    
    return null;
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
            Pending Requests ({receivedRequests.length + sentRequests.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="connections" className="mt-6">
          {connections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connections.map(connection => {
                // Determine which user in the connection is not the current user
                const isUserSender = connection.senderId !== connection.receiverId;
                const otherUserId = isUserSender ? connection.receiverId : connection.senderId;
                const otherUserName = isUserSender ? connection.receiverName : connection.senderName;
                
                // Get profile info if available
                const profile = connectionProfiles[otherUserId];
                
                return (
                  <Card key={connection.id} className="card-hover">
                    <CardHeader className="pb-2">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full gradient-bg flex items-center justify-center text-white font-medium mr-3">
                          {otherUserName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{otherUserName}</CardTitle>
                          <CardDescription>{profile?.role || 'Connection'}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      {profile?.location && (
                        <p className="text-sm text-gray-500 mb-2">
                          {profile.location}
                        </p>
                      )}
                      {profile?.skills && profile.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {profile.skills.slice(0, 3).map(skill => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {profile.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{profile.skills.length - 3} more</Badge>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-gray-500">
                        Connected since {new Date(connection.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/profile/${otherUserId}`}>
                          <User className="h-4 w-4 mr-1" />
                          Profile
                        </Link>
                      </Button>
                      <Button size="sm" asChild>
                        <Link to={`/messaging/${otherUserId}`}>
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
          <div className="space-y-6">
            {/* Received requests */}
            {receivedRequests.length > 0 && (
              <div>
                <h3 className="font-medium text-lg mb-4">Requests Received</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {receivedRequests.map(request => {
                    const profile = connectionProfiles[request.senderId];
                    
                    return (
                      <Card key={request.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full gradient-bg flex items-center justify-center text-white font-medium mr-3">
                              {request.senderName?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{request.senderName}</CardTitle>
                              <CardDescription>{profile?.role || 'Sent you a request'}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          {profile?.location && (
                            <p className="text-sm text-gray-500 mb-2">
                              {profile.location}
                            </p>
                          )}
                          {profile?.skills && profile.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {profile.skills.slice(0, 3).map(skill => (
                                <Badge key={skill} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {profile.skills.length > 3 && (
                                <Badge variant="outline" className="text-xs">+{profile.skills.length - 3} more</Badge>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-gray-500">
                            Requested {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </CardContent>
                        <CardFooter>
                          <div className="flex justify-between w-full">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 mr-2"
                              onClick={() => rejectConnectionRequest(request.id)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => acceptConnectionRequest(request.id)}
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
            {sentRequests.length > 0 && (
              <div className="mt-8">
                <h3 className="font-medium text-lg mb-4">Requests Sent</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sentRequests.map(request => {
                    const profile = connectionProfiles[request.receiverId];
                    
                    return (
                      <Card key={request.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full gradient-bg flex items-center justify-center text-white font-medium mr-3">
                              {request.receiverName?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{request.receiverName}</CardTitle>
                              <CardDescription>{profile?.role || 'Pending request'}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          {profile?.location && (
                            <p className="text-sm text-gray-500 mb-2">
                              {profile.location}
                            </p>
                          )}
                          {profile?.skills && profile.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {profile.skills.slice(0, 3).map(skill => (
                                <Badge key={skill} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-gray-500">
                            Sent {new Date(request.createdAt).toLocaleDateString()}
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
                              <Link to={`/profile/${request.receiverId}`}>
                                <User className="h-4 w-4 mr-1" />
                                View Profile
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="flex-1 text-gray-600 hover:text-gray-900"
                              onClick={() => cancelConnectionRequest(request.id)}
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
            
            {receivedRequests.length === 0 && sentRequests.length === 0 && (
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConnectionsPage;
