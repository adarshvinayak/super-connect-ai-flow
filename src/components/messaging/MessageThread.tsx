
import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { toast } from "sonner";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  timestamp: string;
  is_read: boolean;
}

interface MessageThreadProps {
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
}

const MessageThread = ({ recipientId, recipientName, recipientAvatar }: MessageThreadProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Load existing messages
  useEffect(() => {
    if (!user || !recipientId) return;
    
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user.id})`)
          .order('timestamp', { ascending: true });
        
        if (error) throw error;
        
        setMessages(data || []);
        
        // Mark messages as read
        if (data && data.length > 0) {
          const unreadMessages = data
            .filter(msg => msg.sender_id === recipientId && !msg.is_read)
            .map(msg => msg.id);
          
          if (unreadMessages.length > 0) {
            await supabase
              .from('messages')
              .update({ is_read: true })
              .in('id', unreadMessages);
          }
        }
      } catch (error) {
        console.error("Error loading messages:", error);
        toast.error("Failed to load messages");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMessages();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('realtime:messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${recipientId},receiver_id=eq.${user.id}`
        },
        (payload) => {
          // Add new message to the thread
          setMessages(prevMessages => [...prevMessages, payload.new as Message]);
          
          // Mark as read immediately
          supabase
            .from('messages')
            .update({ is_read: true })
            .eq('id', payload.new.id);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, recipientId]);
  
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || !recipientId) return;
    
    try {
      setIsSending(true);
      
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: recipientId,
          content: newMessage.trim(),
          timestamp: new Date().toISOString(),
          is_read: false
        });
      
      if (error) throw error;
      
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'h:mm a');
    } catch {
      return "";
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="border-b p-4 flex items-center">
        <Avatar className="h-10 w-10 mr-3">
          <AvatarImage src={recipientAvatar} />
          <AvatarFallback>{getInitials(recipientName)}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium">{recipientName}</h3>
        </div>
      </div>
      
      {/* Messages container */}
      <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p>No messages yet</p>
            <p className="text-sm">Send a message to start the conversation</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex items-end gap-2 max-w-[80%]">
                  {message.sender_id !== user?.id && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={recipientAvatar} />
                      <AvatarFallback>{getInitials(recipientName)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex flex-col">
                    <Card
                      className={`px-3 py-2 ${
                        message.sender_id === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-white'
                      }`}
                    >
                      {message.content}
                    </Card>
                    <span className="text-xs text-gray-500 mt-1">
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Message input */}
      <form onSubmit={sendMessage} className="border-t p-4 flex gap-2">
        <Input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={isSending}
          className="flex-grow"
        />
        <Button type="submit" disabled={isSending || !newMessage.trim()}>
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
};

export default MessageThread;
