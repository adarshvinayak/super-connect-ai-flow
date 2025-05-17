
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, SearchIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserData {
  user_id: string;
  full_name: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  timestamp: string;
  is_read: boolean;
}

interface Conversation {
  id: string;
  user: UserData | null;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

// Type guard to check if an object is a valid UserData
function isValidUserData(obj: any): obj is UserData {
  return obj && typeof obj === 'object' && 'user_id' in obj && 'full_name' in obj;
}

const MessagingPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | undefined>(id);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);
  
  useEffect(() => {
    if (selectedConversation && user) {
      fetchMessages(selectedConversation);
      
      // Mark messages as read
      markMessagesAsRead(selectedConversation);
      
      // Update the conversation list to mark as read
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === selectedConversation ? { ...conv, unread: false } : conv
        )
      );
    }
  }, [selectedConversation, user]);
  
  // Set selected conversation from URL param
  useEffect(() => {
    if (id) {
      setSelectedConversation(id);
    }
  }, [id]);
  
  const fetchConversations = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Get unique users the current user has messaged with
      const { data: connections, error: connectionsError } = await supabase
        .from('connection_requests')
        .select(`
          id, 
          sender:sender_id(user_id:user_id, full_name),
          receiver:receiver_id(user_id:user_id, full_name)
        `)
        .eq('status', 'accepted')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      
      if (connectionsError) {
        toast.error("Failed to fetch connections");
        console.error(connectionsError);
        setIsLoading(false);
        return;
      }
      
      if (!connections) {
        setIsLoading(false);
        return;
      }
      
      // Transform connections to conversations
      const conversationPromises = connections.map(async (conn) => {
        // Get the other user in the conversation
        let otherUser: UserData | null = null;
        
        if (conn.sender && isValidUserData(conn.sender) && conn.sender.user_id === user.id) {
          // Current user is sender, other user is receiver
          otherUser = isValidUserData(conn.receiver) ? conn.receiver : null;
        } else {
          // Current user is receiver, other user is sender
          otherUser = isValidUserData(conn.sender) ? conn.sender : null;
        }
        
        if (!otherUser || !otherUser.user_id) return null;
        
        // Get the last message between the two users
        const { data: lastMessageData, error: lastMessageError } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUser.user_id}),and(sender_id.eq.${otherUser.user_id},receiver_id.eq.${user.id})`)
          .order('timestamp', { ascending: false })
          .limit(1);
          
        if (lastMessageError) {
          console.error("Error fetching last message:", lastMessageError);
          return null;
        }
        
        // Count unread messages from the other user
        const { count, error: countError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', otherUser.user_id)
          .eq('receiver_id', user.id)
          .eq('is_read', false);
          
        if (countError) {
          console.error("Error counting unread messages:", countError);
        }
        
        const lastMessage = lastMessageData && lastMessageData.length > 0 ? lastMessageData[0] : null;
        
        return {
          id: otherUser.user_id,
          user: otherUser,
          lastMessage: lastMessage ? lastMessage.content : "No messages yet",
          timestamp: lastMessage ? lastMessage.timestamp : new Date().toISOString(),
          unread: count ? count > 0 : false
        };
      });
      
      const conversationsResult = await Promise.all(conversationPromises);
      const validConversations = conversationsResult.filter(Boolean) as Conversation[];
      
      // Sort conversations by timestamp, newest first
      validConversations.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setConversations(validConversations);
      
      // If we have a selected conversation from URL param, ensure it exists
      if (id && !validConversations.some(conv => conv.id === id)) {
        setSelectedConversation(undefined);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load your conversations");
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchMessages = async (conversationUserId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${conversationUserId}),and(sender_id.eq.${conversationUserId},receiver_id.eq.${user.id})`)
        .order('timestamp', { ascending: true });
        
      if (error) {
        toast.error("Failed to load messages");
        console.error(error);
      } else if (data) {
        setMessages(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Something went wrong while loading messages");
    }
  };
  
  const markMessagesAsRead = async (conversationUserId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', conversationUserId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);
        
      if (error) {
        console.error("Error marking messages as read:", error);
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation || !user) return;
    
    try {
      // Insert message into database
      const { data: messageData, error } = await supabase
        .from('messages')
        .insert({
          content: newMessage,
          sender_id: user.id,
          receiver_id: selectedConversation,
          is_read: false
        })
        .select()
        .single();
      
      if (error) {
        toast.error("Failed to send message");
        console.error(error);
        return;
      }
      
      // Add message to local state
      if (messageData) {
        setMessages(prev => [...prev, messageData]);
      }
      
      // Clear input
      setNewMessage("");
      
      // Update the conversation list
      setConversations(prev => {
        const updatedConversations = prev.map(conv => 
          conv.id === selectedConversation 
            ? { ...conv, lastMessage: newMessage, timestamp: new Date().toISOString() }
            : conv
        );
        
        // Sort conversations by timestamp, newest first
        return updatedConversations.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send your message");
    }
  };
  
  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => 
    conv.user?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Get the selected conversation data
  const activeConversation = conversations.find(conv => conv.id === selectedConversation);
  
  // Format timestamp for display
  const formatTimestamp = (timestamp: string): string => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    
    // If today, show time
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this year, show day and month
    if (messageDate.getFullYear() === now.getFullYear()) {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // Otherwise show date
    return messageDate.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
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
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map(conv => {
              const firstLetter = conv.user?.full_name ? conv.user.full_name.charAt(0).toUpperCase() : '?';
              
              return (
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
                      {firstLetter}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h3 className="font-medium truncate">{conv.user?.full_name || "Unknown User"}</h3>
                        <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                          {formatTimestamp(conv.timestamp)}
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
              );
            })
          ) : (
            <div className="p-4 text-center text-gray-500">
              {searchQuery ? "No conversations found" : "No conversations yet"}
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
                {activeConversation.user?.full_name ? activeConversation.user.full_name.charAt(0).toUpperCase() : '?'}
              </div>
              <div>
                <h3 className="font-medium">{activeConversation.user?.full_name || "Unknown User"}</h3>
              </div>
            </div>
            
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "max-w-md rounded-lg p-3",
                        message.sender_id === user?.id
                          ? "ml-auto bg-supernet-purple text-white"
                          : "bg-gray-100 text-gray-800"
                      )}
                    >
                      <p>{message.content}</p>
                      <p className={cn(
                        "text-xs mt-1",
                        message.sender_id === user?.id
                          ? "text-white/70"
                          : "text-gray-500"
                      )}>
                        {formatTimestamp(message.timestamp)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No messages yet. Start the conversation!
                  </div>
                )}
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
                <Button type="submit" size="icon" disabled={!newMessage.trim()}>
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
