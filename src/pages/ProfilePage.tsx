
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Download, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const { user } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    id: "",
    name: "",
    role: "",
    location: "",
    bio: "",
    skills: [],
    email: "",
    profileVisibility: "public",
    networkingIntent: "cofounder",
    workingStyle: "remote",
    availability: "full-time",
    portfolioUrl: "",
    linkedinUrl: "",
    githubUrl: "",
    connections: 0,
    profileViews: 0,
    blockedUsers: [],
  });
  
  const [formData, setFormData] = useState({
    full_name: "",
    role: "",
    location: "",
    bio: "",
    profileVisibility: "public",
    networkingIntent: "cofounder",
    workingStyle: "remote",
    availability: "full-time",
    portfolioUrl: "",
    linkedinUrl: "",
    githubUrl: "",
  });

  // Fetch user data on component mount
  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      // Fetch user profile data
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (userError) throw userError;

      // Fetch skills
      const { data: userSkills, error: skillsError } = await supabase
        .from('user_skills')
        .select('skill:skills(skill_name)')
        .eq('user_id', user.id);

      if (skillsError) throw skillsError;

      // Fetch social profiles
      const { data: socialProfiles, error: socialError } = await supabase
        .from('social_profiles')
        .select('*')
        .eq('user_id', user.id);

      if (socialError) throw socialError;

      // Process social profiles
      let portfolioUrl = "";
      let linkedinUrl = "";
      let githubUrl = "";

      socialProfiles.forEach(profile => {
        if (profile.platform === "portfolio") portfolioUrl = profile.profile_url;
        if (profile.platform === "linkedin") linkedinUrl = profile.profile_url;
        if (profile.platform === "github") githubUrl = profile.profile_url;
      });

      // Map the skills array to just the name strings
      const skills = userSkills.map(item => item.skill.skill_name);

      setUserData({
        id: user.id,
        name: userProfile.full_name,
        role: userProfile.role || "Professional Role Not Set",
        location: userProfile.location || "Location Not Set",
        bio: userProfile.bio || "No bio added yet",
        skills: skills,
        email: user.email,
        profileVisibility: "public", // Default values if not available in DB
        networkingIntent: "cofounder",
        workingStyle: "remote",
        availability: "full-time",
        portfolioUrl,
        linkedinUrl,
        githubUrl,
        connections: 0, // These would come from actual DB count in a real app
        profileViews: 0,
        blockedUsers: [],
      });

      // Set form data for edit dialog
      setFormData({
        full_name: userProfile.full_name,
        role: userProfile.role || "",
        location: userProfile.location || "",
        bio: userProfile.bio || "",
        profileVisibility: "public",
        networkingIntent: "cofounder",
        workingStyle: "remote",
        availability: "full-time",
        portfolioUrl,
        linkedinUrl,
        githubUrl,
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load profile data");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEditProfile = () => {
    setIsEditDialogOpen(true);
  };

  const handleSaveProfile = async () => {
    try {
      // Update user profile
      const { error: profileError } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          role: formData.role,
          location: formData.location,
          bio: formData.bio,
          updated_at: new Date(),
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Update social profiles
      // First, delete existing profiles
      await supabase
        .from('social_profiles')
        .delete()
        .eq('user_id', user.id);

      // Then insert new profiles if URLs are provided
      const socialProfilesToInsert = [];
      
      if (formData.portfolioUrl) {
        socialProfilesToInsert.push({
          user_id: user.id,
          platform: 'portfolio',
          profile_url: formData.portfolioUrl,
        });
      }
      
      if (formData.linkedinUrl) {
        socialProfilesToInsert.push({
          user_id: user.id,
          platform: 'linkedin',
          profile_url: formData.linkedinUrl,
        });
      }
      
      if (formData.githubUrl) {
        socialProfilesToInsert.push({
          user_id: user.id,
          platform: 'github',
          profile_url: formData.githubUrl,
        });
      }
      
      if (socialProfilesToInsert.length > 0) {
        const { error: socialError } = await supabase
          .from('social_profiles')
          .insert(socialProfilesToInsert);
          
        if (socialError) throw socialError;
      }

      // Refresh user data
      await fetchUserData();
      toast.success("Profile updated successfully");
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const handleExportData = async () => {
    try {
      // Fetch all user data for export
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (userError) throw userError;

      const { data: userSkills, error: skillsError } = await supabase
        .from('user_skills')
        .select('skill:skills(skill_name)')
        .eq('user_id', user.id);

      if (skillsError) throw skillsError;

      const { data: socialProfiles, error: socialError } = await supabase
        .from('social_profiles')
        .select('*')
        .eq('user_id', user.id);

      if (socialError) throw socialError;

      // Combine all data into a single object
      const exportData = {
        profile: userProfile,
        skills: userSkills.map(item => item.skill.skill_name),
        socialProfiles: socialProfiles,
        timestamp: new Date().toISOString()
      };

      // Convert to JSON and create download link
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `profile-data-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Data exported successfully");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export data");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={handleEditProfile}>
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
                {userData.portfolioUrl && (
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
                )}
                
                {userData.linkedinUrl && (
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
                )}
                
                {userData.githubUrl && (
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
                )}
                
                {!userData.portfolioUrl && !userData.linkedinUrl && !userData.githubUrl && (
                  <li className="p-3 text-center text-gray-500">
                    No professional links added yet
                  </li>
                )}
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
                  {userData.blockedUsers.map((user) => (
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

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your personal and professional information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="full_name" className="text-sm font-medium">Full Name</label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">Professional Role</label>
              <Input
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium">Location</label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="bio" className="text-sm font-medium">Bio</label>
              <Textarea
                id="bio"
                name="bio"
                rows={4}
                value={formData.bio}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="portfolioUrl" className="text-sm font-medium">Portfolio URL</label>
              <Input
                id="portfolioUrl"
                name="portfolioUrl"
                type="url"
                value={formData.portfolioUrl}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="linkedinUrl" className="text-sm font-medium">LinkedIn URL</label>
              <Input
                id="linkedinUrl"
                name="linkedinUrl"
                type="url"
                value={formData.linkedinUrl}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="githubUrl" className="text-sm font-medium">GitHub URL</label>
              <Input
                id="githubUrl"
                name="githubUrl"
                type="url"
                value={formData.githubUrl}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;
