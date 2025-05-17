
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Search, User, Users, Star, MessageCircle } from "lucide-react";

// Placeholder data for the demo
const dummyMatches = [
  {
    id: "1",
    name: "Alex Johnson",
    role: "Frontend Developer",
    location: "San Francisco, CA",
    skills: ["React", "TypeScript", "UI/UX"],
    matchReason: "Alex's frontend skills complement your backend experience, and you're both interested in AI applications.",
    intent: "cofounder"
  },
  {
    id: "2",
    name: "Taylor Smith",
    role: "Product Manager",
    location: "New York, NY",
    skills: ["Product Strategy", "User Research", "Agile"],
    matchReason: "Taylor's product experience aligns with your technical skills, making for a potential strong founding team.",
    intent: "cofounder"
  },
  {
    id: "3",
    name: "Jamie Rivera",
    role: "Marketing Specialist",
    location: "Austin, TX",
    skills: ["Content Strategy", "SEO", "Social Media"],
    matchReason: "Jamie is looking for technical partners for their marketing agency, which matches your client-seeking goals.",
    intent: "client"
  },
  {
    id: "4",
    name: "Morgan Lee",
    role: "UX Designer",
    location: "Seattle, WA",
    skills: ["UI Design", "User Research", "Figma"],
    matchReason: "Morgan needs development help on client projects, which aligns with your technical skills.",
    intent: "client"
  },
  {
    id: "5",
    name: "Casey Wong",
    role: "Project Manager",
    location: "Chicago, IL",
    skills: ["Agile", "Scrum", "Team Leadership"],
    matchReason: "Casey's team is looking for developers with your exact skill set for ongoing projects.",
    intent: "teammate"
  },
  {
    id: "6",
    name: "Jordan Taylor",
    role: "CTO",
    location: "Boston, MA",
    skills: ["System Architecture", "Team Building", "Strategic Planning"],
    matchReason: "Jordan's startup is expanding and needs developers with your specialized skills.",
    intent: "teammate"
  },
];

const DashboardPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  
  return (
    <div className="space-y-8">
      {/* Welcome and search section */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-gray-600">Here are your personalized networking suggestions.</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input 
            placeholder="Find connections using natural language... (e.g., 'React developers in San Francisco')" 
            className="pl-10 py-6"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                // In a real app, this would navigate to search results
                console.log("Searching for:", searchQuery);
              }
            }}
          />
        </div>
      </div>
      
      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-supernet-lightpurple border-none">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-supernet-purple">Profile Views</p>
                <p className="text-3xl font-bold">24</p>
              </div>
              <div className="h-10 w-10 rounded-full gradient-bg flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-supernet-lightpurple border-none">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-supernet-purple">Connections</p>
                <p className="text-3xl font-bold">7</p>
              </div>
              <div className="h-10 w-10 rounded-full gradient-bg flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-supernet-lightpurple border-none">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-supernet-purple">Unread Messages</p>
                <p className="text-3xl font-bold">3</p>
              </div>
              <div className="h-10 w-10 rounded-full gradient-bg flex items-center justify-center">
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
          <Button variant="ghost" size="sm" className="text-supernet-purple" asChild>
            <Link to="/search">
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        <Tabs defaultValue="cofounder" className="w-full">
          <TabsList>
            <TabsTrigger value="cofounder">Co-founders</TabsTrigger>
            <TabsTrigger value="client">Clients</TabsTrigger>
            <TabsTrigger value="teammate">Teammates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cofounder" className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {dummyMatches
                .filter((match) => match.intent === "cofounder")
                .map((match) => (
                  <Card key={match.id} className="card-hover">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <div>
                          <CardTitle>{match.name}</CardTitle>
                          <CardDescription>{match.role} • {match.location}</CardDescription>
                        </div>
                        <div className="flex">
                          <Star className="text-yellow-400" size={18} />
                          <Star className="text-yellow-400" size={18} />
                          <Star className="text-yellow-400" size={18} />
                          <Star className="text-yellow-400" size={18} />
                          <Star className="text-gray-300" size={18} />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {match.skills.map((skill) => (
                          <Badge key={skill} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">AI Match Reason:</span> {match.matchReason}
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" className="mr-2" asChild>
                        <Link to={`/profile/${match.id}`}>
                          View Profile
                        </Link>
                      </Button>
                      <Button size="sm" asChild>
                        <Link to={`/messaging/${match.id}`}>
                          Connect
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          </TabsContent>
          
          <TabsContent value="client" className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {dummyMatches
                .filter((match) => match.intent === "client")
                .map((match) => (
                  <Card key={match.id} className="card-hover">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <div>
                          <CardTitle>{match.name}</CardTitle>
                          <CardDescription>{match.role} • {match.location}</CardDescription>
                        </div>
                        <div className="flex">
                          <Star className="text-yellow-400" size={18} />
                          <Star className="text-yellow-400" size={18} />
                          <Star className="text-yellow-400" size={18} />
                          <Star className="text-gray-300" size={18} />
                          <Star className="text-gray-300" size={18} />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {match.skills.map((skill) => (
                          <Badge key={skill} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">AI Match Reason:</span> {match.matchReason}
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" className="mr-2" asChild>
                        <Link to={`/profile/${match.id}`}>
                          View Profile
                        </Link>
                      </Button>
                      <Button size="sm" asChild>
                        <Link to={`/messaging/${match.id}`}>
                          Connect
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          </TabsContent>
          
          <TabsContent value="teammate" className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {dummyMatches
                .filter((match) => match.intent === "teammate")
                .map((match) => (
                  <Card key={match.id} className="card-hover">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <div>
                          <CardTitle>{match.name}</CardTitle>
                          <CardDescription>{match.role} • {match.location}</CardDescription>
                        </div>
                        <div className="flex">
                          <Star className="text-yellow-400" size={18} />
                          <Star className="text-yellow-400" size={18} />
                          <Star className="text-yellow-400" size={18} />
                          <Star className="text-yellow-400" size={18} />
                          <Star className="text-gray-300" size={18} />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {match.skills.map((skill) => (
                          <Badge key={skill} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">AI Match Reason:</span> {match.matchReason}
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" className="mr-2" asChild>
                        <Link to={`/profile/${match.id}`}>
                          View Profile
                        </Link>
                      </Button>
                      <Button size="sm" asChild>
                        <Link to={`/messaging/${match.id}`}>
                          Connect
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardPage;
