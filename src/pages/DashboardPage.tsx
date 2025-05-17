
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, User, Users, Star, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useConnections } from "@/hooks/useConnections";
import { useMessaging } from "@/hooks/useMessaging";
import GlobalSearch from "@/components/GlobalSearch";

const DashboardPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("cofounder");
  const { receivedRequests } = useConnections();
  const { unreadCount } = useMessaging();
  
  return (
    <div className="space-y-8">
      {/* Welcome and search section */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome{user ? `, ${user.email.split('@')[0]}` : ''}!</h1>
          <p className="text-gray-600">Here are your personalized networking suggestions.</p>
        </div>
        
        <div className="w-full max-w-3xl">
          <GlobalSearch />
        </div>
      </div>
      
      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-teal-50 border-none">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-teal-700">Profile Views</p>
                <p className="text-3xl font-bold">24</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-teal-600 flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50 border-none">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-orange-700">Connection Requests</p>
                <p className="text-3xl font-bold">{receivedRequests.length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-600 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-indigo-50 border-none">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-indigo-700">Unread Messages</p>
                <p className="text-3xl font-bold">{unreadCount}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* AI Match suggestions */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">AI-Powered Matches</h2>
          <Button variant="ghost" size="sm" className="text-teal-700" asChild>
            <Link to="/search">
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="cofounder">Co-founders</TabsTrigger>
            <TabsTrigger value="client">Clients</TabsTrigger>
            <TabsTrigger value="teammate">Teammates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cofounder" className="pt-4">
            <EmptyMatchState intent="co-founders" />
          </TabsContent>
          
          <TabsContent value="client" className="pt-4">
            <EmptyMatchState intent="clients" />
          </TabsContent>
          
          <TabsContent value="teammate" className="pt-4">
            <EmptyMatchState intent="teammates" />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Recent Activity</h2>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-gray-500">
                Complete your profile to see activity from your network
              </p>
              <Button className="mt-4" asChild>
                <Link to="/profile">Complete Profile</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Empty state component for match tabs
const EmptyMatchState = ({ intent }: { intent: string }) => (
  <Card className="border-dashed border-2">
    <CardContent className="pt-8 pb-8">
      <div className="text-center">
        <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-medium mb-2">No {intent} matches yet</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Complete your profile with more details about your skills, experience, and what you're looking for to get AI-powered matches.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button asChild>
            <Link to="/profile">Complete Profile</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/search">Browse Professionals</Link>
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default DashboardPage;
