import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMessaging } from "@/hooks/useMessaging";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

const MessagingPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { conversations, messages, fetchMessages, sendMessage, activeConversation } = useMessaging();
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => 
    conv.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Load conversation when ID changes
  useEffect(() => {
    if (id) {
      fetchMessages(id);
    }
  }, [id, fetchMessages]);
  
  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !activeConversation) return;
    
    await sendMessage(activeConversation, newMessage);
    setNewMessage("");
  };
  
  // Find active conversation data
  const activeConversationData = activeConversation ? 
    conversations.find(conv => conv.userId === activeConversation) : null;
  
  // Format timestamp
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If today, show time only
    if (date.toDateString() === now.toDateString()) {
      return format(date, 'h:mm a');
    }
    
    // If this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return format(date, 'MMM d, h:mm a');
    }
    
    // Otherwise show full date
    return format(date, 'MMM d, yyyy, h:mm a');
  };
  
  return (
    <div className="h-[calc(100vh-9rem)] flex overflow-hidden bg-white rounded-lg shadow">
      {/* Sidebar with conversations */}
      <div className="w-full max-w-xs border-r">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg mb-2">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
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
                key={conv.userId}
                onClick={() => fetchMessages(conv.userId)}
                className={cn(
                  "p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors",
                  activeConversation === conv.userId ? "bg-gray-100" : "",
                  conv.unread > 0 ? "bg-blue-50" : ""
                )}
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full gradient-bg flex items-center justify-center text-white font-medium mr-3">
                    {conv.userName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-medium truncate">{conv.userName}</h3>
                      <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                        {formatMessageTime(conv.timestamp)}
                      </span>
                    </div>
                    <p className={cn(
                      "text-sm truncate",
                      conv.unread > 0 ? "font-medium text-gray-900" : "text-gray-500"
                    )}>
                      {conv.lastMessage}
                      {conv.unread > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {conv.unread}
                        </span>
                      )}
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
        {activeConversation && activeConversationData ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b flex items-center">
              <div className="h-10 w-10 rounded-full gradient-bg flex items-center justify-center text-white font-medium mr-3">
                {activeConversationData.userName.charAt(0)}
              </div>
              <div>
                <h3 className="font-medium">{activeConversationData.userName}</h3>
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
                      message.senderId === user?.id
                        ? "ml-auto bg-supernet-purple text-white"
                        : "bg-gray-100 text-gray-800"
                    )}
                  >
                    <p>{message.content}</p>
                    <p className={cn(
                      "text-xs mt-1",
                      message.senderId === user?.id
                        ? "text-white/70"
                        : "text-gray-500"
                    )}>
                      {formatMessageTime(message.createdAt)}
                    </p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
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
              <User className="h-12 w-12 mx-auto text-gray-300 mb-4" />
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
