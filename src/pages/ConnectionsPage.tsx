
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, X, Check, User } from "lucide-react";

// Dummy data for connected users
const connectedUsers = [
  {
    id: "1",
    name: "Jamie Rivera",
    role: "Marketing Specialist",
    location: "Austin, TX",
    skills: ["Content Strategy", "SEO", "Social Media"],
    connectionDate: "Jun 15, 2023",
    avatar: "J"
  },
  {
    id: "2",
    name: "Morgan Lee",
    role: "UX Designer",
    location: "Seattle, WA",
    skills: ["UI Design", "User Research", "Figma"],
    connectionDate: "Aug 22, 2023",
    avatar: "M"
  },
  {
    id: "3",
    name: "Casey Wong",
    role: "Project Manager",
    location: "Chicago, IL",
    skills: ["Agile", "Scrum", "Team Leadership"],
    connectionDate: "Oct 5, 2023",
    avatar: "C"
  },
];

// Dummy data for pending requests
const pendingRequests = [
  {
    id: "4",
    name: "Alex Johnson",
    role: "Frontend Developer",
    location: "San Francisco, CA",
    skills: ["React", "TypeScript", "UI/UX"],
    requestDate: "2 days ago",
    type: "received", // received or sent
    avatar: "A"
  },
  {
    id: "5",
    name: "Taylor Smith",
    role: "Product Manager",
    location: "New York, NY",
    skills: ["Product Strategy", "User Research", "Agile"],
    requestDate: "1 week ago",
    type: "sent",
    avatar: "T"
  },
  {
    id: "6",
    name: "Jordan Taylor",
    role: "CTO",
    location: "Boston, MA",
    skills: ["System Architecture", "Team Building", "Strategic Planning"],
    requestDate: "3 days ago",
    type: "received",
    avatar: "J"
  },
];

const ConnectionsPage = () => {
  const [connections, setConnections] = useState(connectedUsers);
  const [requests, setRequests] = useState(pendingRequests);
  
  const handleAcceptRequest = (id: string) => {
    const acceptedRequest = requests.find(req => req.id === id);
    if (acceptedRequest) {
      // Remove from requests
      setRequests(prevRequests => prevRequests.filter(req => req.id !== id));
      
      // Add to connections
      setConnections(prevConnections => [
        ...prevConnections,
        {
          ...acceptedRequest,
          connectionDate: "Just now"
        }
      ]);
    }
  };
  
  const handleDeclineRequest = (id: string) => {
    setRequests(prevRequests => prevRequests.filter(req => req.id !== id));
  };
  
  const handleCancelRequest = (id: string) => {
    setRequests(prevRequests => prevRequests.filter(req => req.id !== id));
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
          {connections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connections.map(connection => (
                <Card key={connection.id} className="card-hover">
                  <CardHeader className="pb-2">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full gradient-bg flex items-center justify-center text-white font-medium mr-3">
                        {connection.avatar}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{connection.name}</CardTitle>
                        <CardDescription>{connection.role}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-gray-500 mb-2">
                      {connection.location}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {connection.skills.map(skill => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      Connected since {connection.connectionDate}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/profile/${connection.id}`}>
                        <User className="h-4 w-4 mr-1" />
                        Profile
                      </Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link to={`/messaging/${connection.id}`}>
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Message
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
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
            {requests.filter(req => req.type === "received").length > 0 && (
              <div>
                <h3 className="font-medium text-lg mb-4">Requests Received</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {requests
                    .filter(req => req.type === "received")
                    .map(request => (
                      <Card key={request.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full gradient-bg flex items-center justify-center text-white font-medium mr-3">
                              {request.avatar}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{request.name}</CardTitle>
                              <CardDescription>{request.role}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <p className="text-sm text-gray-500 mb-2">
                            {request.location}
                          </p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {request.skills.map(skill => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500">
                            Requested {request.requestDate}
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
                    ))}
                </div>
              </div>
            )}
            
            {/* Sent requests */}
            {requests.filter(req => req.type === "sent").length > 0 && (
              <div className="mt-8">
                <h3 className="font-medium text-lg mb-4">Requests Sent</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {requests
                    .filter(req => req.type === "sent")
                    .map(request => (
                      <Card key={request.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full gradient-bg flex items-center justify-center text-white font-medium mr-3">
                              {request.avatar}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{request.name}</CardTitle>
                              <CardDescription>{request.role}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <p className="text-sm text-gray-500 mb-2">
                            {request.location}
                          </p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {request.skills.map(skill => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500">
                            Sent {request.requestDate}
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
                              <Link to={`/profile/${request.id}`}>
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
                    ))}
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConnectionsPage;
