
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Download, ChevronRight } from "lucide-react";

// Placeholder user data
const userData = {
  id: "current-user",
  name: "Sam Taylor",
  role: "Full Stack Developer",
  location: "Seattle, WA",
  bio: "Passionate developer with 5+ years of experience building web applications. Looking to connect with potential co-founders for my next venture in AI-powered tools.",
  skills: ["React", "Node.js", "TypeScript", "Python", "AI/ML"],
  email: "sam@example.com",
  profileVisibility: "public",
  networkingIntent: "cofounder",
  workingStyle: "remote",
  availability: "full-time",
  portfolioUrl: "https://samtaylor.dev",
  linkedinUrl: "https://linkedin.com/in/samtaylor",
  githubUrl: "https://github.com/samtaylor",
  connections: 7,
  profileViews: 24,
  blockedUsers: [],
};

const ProfilePage = () => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="blocked">Blocked Users</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-4">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Your personal and professional details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">{userData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{userData.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Professional Role</p>
                  <p className="font-medium">{userData.role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{userData.location}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Bio</p>
                <p className="mt-1">{userData.bio}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Skills</p>
                <div className="flex flex-wrap gap-1">
                  {userData.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Links */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Links</CardTitle>
              <CardDescription>Your online presence</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <span className="font-medium">Portfolio</span>
                  <a
                    href={userData.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-supernet-blue hover:underline flex items-center"
                  >
                    {userData.portfolioUrl}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </a>
                </li>
                <li className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <span className="font-medium">LinkedIn</span>
                  <a
                    href={userData.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-supernet-blue hover:underline flex items-center"
                  >
                    {userData.linkedinUrl}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </a>
                </li>
                <li className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <span className="font-medium">GitHub</span>
                  <a
                    href={userData.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-supernet-blue hover:underline flex items-center"
                  >
                    {userData.githubUrl}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </a>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Networking Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Networking Preferences</CardTitle>
              <CardDescription>How you prefer to connect with others</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Primary Networking Intent</p>
                  <p className="font-medium capitalize">{userData.networkingIntent}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Working Style</p>
                  <p className="font-medium capitalize">{userData.workingStyle}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Availability</p>
                  <p className="font-medium capitalize">{userData.availability}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Profile Visibility</p>
                  <p className="font-medium capitalize">{userData.profileVisibility}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control who can see your profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Profile Visibility</h3>
                <div className="flex items-center space-x-2 rounded-lg border p-4">
                  <input
                    type="radio"
                    id="public"
                    name="visibility"
                    value="public"
                    checked={userData.profileVisibility === "public"}
                    readOnly
                    className="text-supernet-purple"
                  />
                  <label htmlFor="public" className="flex-1 cursor-pointer">
                    <span className="font-medium">Public</span>
                    <p className="text-sm text-gray-500">
                      Anyone on the platform can find and view your profile
                    </p>
                  </label>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Message Privacy</h3>
                <div className="flex items-center space-x-2 rounded-lg border p-4">
                  <input
                    type="radio"
                    id="anyone"
                    name="message-privacy"
                    value="anyone"
                    checked={true}
                    readOnly
                    className="text-supernet-purple"
                  />
                  <label htmlFor="anyone" className="flex-1 cursor-pointer">
                    <span className="font-medium">Anyone can message me</span>
                    <p className="text-sm text-gray-500">
                      Receive messages from all users on the platform
                    </p>
                  </label>
                </div>
              </div>
              
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blocked" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Blocked Users</CardTitle>
              <CardDescription>Manage the users you've blocked</CardDescription>
            </CardHeader>
            <CardContent>
              {userData.blockedUsers.length > 0 ? (
                <ul className="divide-y">
                  {userData.blockedUsers.map((user: any) => (
                    <li key={user.id} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <Button variant="outline" size="sm">Unblock</Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">You haven't blocked any users yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
