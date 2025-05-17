
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const SettingsPage = () => {
  const { user } = useAuth();
  
  // Account settings state
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Privacy settings state
  const [profileVisibility, setProfileVisibility] = useState("public");
  const [messagePrivacy, setMessagePrivacy] = useState("anyone");
  
  const handleUpdateEmail = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Email cannot be empty.");
      return;
    }
    
    // In a real app, this would update the email in the backend
    toast.success("Email updated successfully!");
  };
  
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    
    // In a real app, this would update the password in the backend
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password updated successfully!");
  };
  
  const handleUpdatePrivacy = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would update privacy settings in the backend
    toast.success("Privacy settings updated successfully!");
  };
  
  const handleExportData = () => {
    // In a real app, this would trigger data export
    toast.success("Your data export has been initiated. You'll receive an email when it's ready.");
  };
  
  const handleDeleteAccount = () => {
    // In a real app, this would show a confirmation dialog and then delete the account
    toast.error("This feature is not implemented yet.");
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account" className="space-y-6">
          {/* Email settings */}
          <Card>
            <CardHeader>
              <CardTitle>Email Address</CardTitle>
              <CardDescription>Update your email address</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateEmail} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button type="submit">Update Email</Button>
              </form>
            </CardContent>
          </Card>
          
          {/* Password settings */}
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>Update your password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button type="submit">Update Password</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control who can see your profile and send you messages</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePrivacy} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Profile Visibility</h3>
                  <RadioGroup
                    value={profileVisibility}
                    onValueChange={setProfileVisibility}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2 rounded-lg border p-4">
                      <RadioGroupItem value="public" id="public" />
                      <Label htmlFor="public" className="flex-1 cursor-pointer">
                        <span className="font-medium">Public</span>
                        <p className="text-sm text-gray-500">
                          Anyone on the platform can find and view your profile
                        </p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-lg border p-4">
                      <RadioGroupItem value="connections" id="connections" />
                      <Label htmlFor="connections" className="flex-1 cursor-pointer">
                        <span className="font-medium">Connections Only</span>
                        <p className="text-sm text-gray-500">
                          Only users you've connected with can see your full profile
                        </p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-lg border p-4">
                      <RadioGroupItem value="private" id="private" />
                      <Label htmlFor="private" className="flex-1 cursor-pointer">
                        <span className="font-medium">Private</span>
                        <p className="text-sm text-gray-500">
                          Your profile is hidden from search and can only be seen when you initiate contact
                        </p>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Messaging Privacy</h3>
                  <RadioGroup
                    value={messagePrivacy}
                    onValueChange={setMessagePrivacy}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2 rounded-lg border p-4">
                      <RadioGroupItem value="anyone" id="msg-anyone" />
                      <Label htmlFor="msg-anyone" className="flex-1 cursor-pointer">
                        <span className="font-medium">Anyone can message me</span>
                        <p className="text-sm text-gray-500">
                          Receive messages from all users on the platform
                        </p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-lg border p-4">
                      <RadioGroupItem value="connections" id="msg-connections" />
                      <Label htmlFor="msg-connections" className="flex-1 cursor-pointer">
                        <span className="font-medium">Connections Only</span>
                        <p className="text-sm text-gray-500">
                          Only receive messages from users you've connected with
                        </p>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <Button type="submit">Save Privacy Settings</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Export or delete your account data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Export Your Data</h3>
                <p className="text-gray-600 mb-4">
                  Download a copy of all your personal data in a machine-readable format.
                </p>
                <Button onClick={handleExportData}>Export Data</Button>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-red-600 mb-2">Delete Account</h3>
                <p className="text-gray-600 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button variant="destructive" onClick={handleDeleteAccount}>Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
