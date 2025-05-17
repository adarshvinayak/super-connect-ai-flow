
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, UserPlus, Shield } from "lucide-react";

// Dummy data for demo purposes
const dummyUsers = [
  {
    id: "1",
    name: "Alex Johnson",
    role: "Frontend Developer",
    location: "San Francisco, CA",
    bio: "Frontend developer specializing in React and TypeScript. Looking for co-founding opportunities in the AI space.",
    skills: ["React", "TypeScript", "UI/UX"],
    portfolioUrl: "https://alexjohnson.dev",
    linkedinUrl: "https://linkedin.com/in/alexjohnson",
    githubUrl: "https://github.com/alexjohnson",
    connectionStatus: "none", // none, pending, connected
  },
  {
    id: "2",
    name: "Taylor Smith",
    role: "Product Manager",
    location: "New York, NY",
    bio: "Experienced product manager with a track record of launching successful SaaS products. Looking for technical co-founders.",
    skills: ["Product Strategy", "User Research", "Agile"],
    portfolioUrl: "https://taylorsmith.io",
    linkedinUrl: "https://linkedin.com/in/taylorsmith",
    githubUrl: "",
    connectionStatus: "pending",
  },
  {
    id: "3",
    name: "Jamie Rivera",
    role: "Marketing Specialist",
    location: "Austin, TX",
    bio: "Growth marketer with a passion for helping startups scale. Seeking partners with technical skills.",
    skills: ["Content Strategy", "SEO", "Social Media"],
    portfolioUrl: "https://jamierivera.com",
    linkedinUrl: "https://linkedin.com/in/jamierivera",
    githubUrl: "",
    connectionStatus: "connected",
  },
];

const ViewProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const [isBlocked, setIsBlocked] = useState(false);
  
  // Find the user by ID
  const user = dummyUsers.find((user) => user.id === id);
  
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h3 className="text-xl font-semibold mb-2">User not found</h3>
        <p className="text-gray-600">The profile you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }
  
  const handleConnect = () => {
    // In a real app, this would send a connection request
    console.log(`Sending connection request to ${user.name}`);
  };
  
  const handleMessage = () => {
    // In a real app, this would navigate to the messaging interface
    console.log(`Starting conversation with ${user.name}`);
  };
  
  const handleBlock = () => {
    // In a real app, this would block the user
    setIsBlocked(!isBlocked);
    console.log(`${isBlocked ? 'Unblocking' : 'Blocking'} ${user.name}`);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{user.name}'s Profile</h1>
        <div className="flex gap-2">
          {user.connectionStatus === "none" && !isBlocked && (
            <Button onClick={handleConnect}>
              <UserPlus className="h-4 w-4 mr-2" />
              Connect
            </Button>
          )}
          
          {user.connectionStatus === "pending" && !isBlocked && (
            <Button variant="outline" disabled>
              Request Pending
            </Button>
          )}
          
          {user.connectionStatus === "connected" && !isBlocked && (
            <Button onClick={handleMessage}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
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
                  <p className="font-medium">{user.role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{user.location}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Bio</p>
                <p className="mt-1">{user.bio}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Skills</p>
                <div className="flex flex-wrap gap-1">
                  {user.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Links */}
          {(user.portfolioUrl || user.linkedinUrl || user.githubUrl) && (
            <Card>
              <CardHeader>
                <CardTitle>Professional Links</CardTitle>
                <CardDescription>Online presence</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {user.portfolioUrl && (
                    <li className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <span className="font-medium">Portfolio</span>
                      <a
                        href={user.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-supernet-blue hover:underline"
                      >
                        {user.portfolioUrl}
                      </a>
                    </li>
                  )}
                  
                  {user.linkedinUrl && (
                    <li className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <span className="font-medium">LinkedIn</span>
                      <a
                        href={user.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-supernet-blue hover:underline"
                      >
                        {user.linkedinUrl}
                      </a>
                    </li>
                  )}
                  
                  {user.githubUrl && (
                    <li className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <span className="font-medium">GitHub</span>
                      <a
                        href={user.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-supernet-blue hover:underline"
                      >
                        {user.githubUrl}
                      </a>
                    </li>
                  )}
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
