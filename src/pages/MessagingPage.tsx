
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import MessageThread from "@/components/messaging/MessageThread";

interface Connection {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  unreadCount: number;
}

const MessagingPage = () => {
  const { id: selectedUserId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  
  useEffect(() => {
    if (!user) return;
    
    const loadConnections = async () => {
      try {
        setIsLoading(true);
        
        // Get all accepted connections
        const { data: connectionData, error: connectionError } = await supabase
          .from('connection_requests')
          .select(`
            id,
            status,
            sender_id,
            sender:sender_id(user_id, full_name),
            receiver_id,
            receiver:receiver_id(user_id, full_name)
          `)
          .eq('status', 'accepted')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
        
        if (connectionError) throw connectionError;
        
        const connectionsList: Connection[] = [];
        
        for (const conn of connectionData || []) {
          // Determine the other user in the connection
          const otherUser = conn.sender_id === user.id ? conn.receiver : conn.sender;
          const otherId = otherUser.user_id;
          
          // Get unread message count
          const { count, error: countError } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: false })
            .eq('sender_id', otherId)
            .eq('receiver_id', user.id)
            .eq('is_read', false);
          
          if (countError) throw countError;
          
          // Get last message
          const { data: lastMessageData } = await supabase
            .from('messages')
            .select('content')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
            .order('timestamp', { ascending: false })
            .limit(1);
          
          connectionsList.push({
            id: otherId,
            name: otherUser.full_name,
            lastMessage: lastMessageData && lastMessageData[0]?.content,
            unreadCount: count || 0
          });
        }
        
        setConnections(connectionsList);
        
        // If there's a selectedUserId from URL params, set it as selected
        if (selectedUserId) {
          const selected = connectionsList.find(conn => conn.id === selectedUserId);
          if (selected) {
            setSelectedConnection(selected);
          } else {
            // If the selected user is not in connections, fetch their info
            const { data: userData } = await supabase
              .from('users')
              .select('user_id, full_name')
              .eq('user_id', selectedUserId)
              .single();
              
            if (userData) {
              const newConnection = {
                id: userData.user_id,
                name: userData.full_name,
                unreadCount: 0
              };
              setConnections([...connectionsList, newConnection]);
              setSelectedConnection(newConnection);
            }
          }
        } else if (connectionsList.length > 0) {
          // If no selected user and we have connections, select the first one
          setSelectedConnection(connectionsList[0]);
        }
      } catch (error) {
        console.error("Error loading connections:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadConnections();
    
    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('realtime:messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        () => {
          // Reload connections when a new message arrives
          loadConnections();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedUserId]);
  
  const filteredConnections = connections.filter(conn => 
    conn.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  return (
    <div className="space-y-6 h-[calc(100vh-12rem)]">
      <h1 className="text-2xl font-bold">Messages</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
        {/* Connections list */}
        <div className="border rounded-lg overflow-hidden md:col-span-1">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search conversations..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="h-[calc(100%-69px)] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredConnections.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No conversations yet
              </div>
            ) : (
              <div>
                {filteredConnections.map((connection) => (
                  <Button
                    key={connection.id}
                    variant="ghost"
                    className={`w-full justify-start px-4 py-3 h-auto ${
                      selectedConnection?.id === connection.id ? 'bg-gray-100' : ''
                    }`}
                    onClick={() => setSelectedConnection(connection)}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <Avatar>
                        <AvatarImage src={connection.avatar} />
                        <AvatarFallback>{getInitials(connection.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-grow text-left">
                        <div className="flex justify-between">
                          <span className="font-medium">{connection.name}</span>
                          {connection.unreadCount > 0 && (
                            <span className="h-5 w-5 bg-primary text-xs rounded-full flex items-center justify-center text-primary-foreground">
                              {connection.unreadCount}
                            </span>
                          )}
                        </div>
                        {connection.lastMessage && (
                          <p className="text-sm text-gray-500 truncate">
                            {connection.lastMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Messages area */}
        <div className="border rounded-lg overflow-hidden md:col-span-2 h-full">
          {selectedConnection ? (
            <MessageThread
              recipientId={selectedConnection.id}
              recipientName={selectedConnection.name}
              recipientAvatar={selectedConnection.avatar}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagingPage;
