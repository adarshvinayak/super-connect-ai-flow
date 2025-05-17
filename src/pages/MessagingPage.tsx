
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Dummy data for conversations
const dummyConversations = [
  {
    id: "1",
    name: "Alex Johnson",
    lastMessage: "Sounds great! Let's connect next week.",
    timestamp: "10:30 AM",
    unread: true,
    avatar: "A"
  },
  {
    id: "2",
    name: "Taylor Smith",
    lastMessage: "I'm interested in your proposal.",
    timestamp: "Yesterday",
    unread: false,
    avatar: "T"
  },
  {
    id: "3",
    name: "Jamie Rivera",
    lastMessage: "Can you share more details about your project?",
    timestamp: "Monday",
    unread: false,
    avatar: "J"
  },
];

// Dummy data for messages
const dummyMessages = {
  "1": [
    { id: "1", sender: "user", text: "Hey Alex, I saw your profile and I'm interested in your AI project.", timestamp: "10:00 AM" },
    { id: "2", sender: "other", text: "Hi there! Thanks for reaching out. Yes, I'm looking for a technical co-founder with backend experience.", timestamp: "10:15 AM" },
    { id: "3", sender: "user", text: "That sounds perfect. I have 5+ years of backend development with Node.js and Python.", timestamp: "10:20 AM" },
    { id: "4", sender: "other", text: "Sounds great! Let's connect next week.", timestamp: "10:30 AM" },
  ],
  "2": [
    { id: "1", sender: "user", text: "Hello Taylor, I'm interested in discussing potential collaboration.", timestamp: "Yesterday" },
    { id: "2", sender: "other", text: "I'm interested in your proposal.", timestamp: "Yesterday" },
  ],
  "3": [
    { id: "1", sender: "other", text: "Can you share more details about your project?", timestamp: "Monday" },
  ]
};

const MessagingPage = () => {
  const { id } = useParams<{ id: string }>();
  const [conversations, setConversations] = useState(dummyConversations);
  const [selectedConversation, setSelectedConversation] = useState<string | undefined>(id);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Set messages when conversation changes
  useEffect(() => {
    if (selectedConversation && dummyMessages[selectedConversation as keyof typeof dummyMessages]) {
      setMessages(dummyMessages[selectedConversation as keyof typeof dummyMessages]);
      
      // Mark as read
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === selectedConversation ? { ...conv, unread: false } : conv
        )
      );
    } else {
      setMessages([]);
    }
  }, [selectedConversation]);
  
  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => 
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation) return;
    
    const newMsg = {
      id: `new-${Date.now()}`,
      sender: "user",
      text: newMessage,
      timestamp: "Just now"
    };
    
    setMessages(prev => [...prev, newMsg]);
    setNewMessage("");
    
    // Update the conversation list
    setConversations(prev => 
      prev.map(conv => 
        conv.id === selectedConversation 
          ? { ...conv, lastMessage: newMessage, timestamp: "Just now" }
          : conv
      )
    );
  };
  
  // Get the selected conversation data
  const activeConversation = conversations.find(conv => conv.id === selectedConversation);
  
  return (
    <div className="h-[calc(100vh-9rem)] flex overflow-hidden bg-white rounded-lg shadow">
      {/* Sidebar with conversations */}
      <div className="w-full max-w-xs border-r">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg mb-2">Messages</h2>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input 
              placeholder="Search conversations" 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <ScrollArea className="h-[calc(100vh-13rem)]">
          {filteredConversations.length > 0 ? (
            filteredConversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={cn(
                  "p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors",
                  selectedConversation === conv.id ? "bg-gray-100" : "",
                  conv.unread ? "bg-blue-50" : ""
                )}
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full gradient-bg flex items-center justify-center text-white font-medium mr-3">
                    {conv.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-medium truncate">{conv.name}</h3>
                      <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                        {conv.timestamp}
                      </span>
                    </div>
                    <p className={cn(
                      "text-sm truncate",
                      conv.unread ? "font-medium text-gray-900" : "text-gray-500"
                    )}>
                      {conv.lastMessage}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              No conversations found
            </div>
          )}
        </ScrollArea>
      </div>
      
      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation && activeConversation ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b flex items-center">
              <div className="h-10 w-10 rounded-full gradient-bg flex items-center justify-center text-white font-medium mr-3">
                {activeConversation.avatar}
              </div>
              <div>
                <h3 className="font-medium">{activeConversation.name}</h3>
              </div>
            </div>
            
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "max-w-md rounded-lg p-3",
                      message.sender === "user"
                        ? "ml-auto bg-supernet-purple text-white"
                        : "bg-gray-100 text-gray-800"
                    )}
                  >
                    <p>{message.text}</p>
                    <p className={cn(
                      "text-xs mt-1",
                      message.sender === "user"
                        ? "text-white/70"
                        : "text-gray-500"
                    )}>
                      {message.timestamp}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            {/* Message input */}
            <div className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex items-center">
                <Input
                  placeholder="Type your message..."
                  className="flex-1 mr-2"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <Button type="submit" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p className="text-gray-500">
                Choose a conversation from the sidebar or start a new one
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingPage;
