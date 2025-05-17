import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase, trackActivity } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  read: boolean;
  senderName?: string;
  receiverName?: string;
}

export interface Conversation {
  userId: string;
  userName: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

export function useMessaging() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch all conversations for the current user
  const fetchConversations = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Get the latest message for each conversation partner
      const { data, error } = await supabase.rpc('get_conversations', {
        user_id: user.id
      });

      if (error) throw error;

      // Format the conversations
      const formattedConversations: Conversation[] = data.map(item => ({
        userId: item.other_user_id,
        userName: item.other_user_name,
        lastMessage: item.last_message,
        timestamp: item.last_message_time,
        unread: item.unread_count
      }));

      setConversations(formattedConversations);
      
      // Calculate total unread count
      const totalUnread = formattedConversations.reduce(
        (sum, conv) => sum + conv.unread, 0
      );
      setUnreadCount(totalUnread);
      
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
      
      // Fallback to direct query if the RPC fails
      try {
        // Get all messages for the current user
        const { data: messagesData, error: messagesError } = await supabase
          .from('chat_messages')
          .select(`
            id,
            content,
            sender_id,
            receiver_id,
            created_at,
            read,
            senderUser:sender_id(full_name),
            receiverUser:receiver_id(full_name)
          `)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (messagesError) throw messagesError;

        // Build conversations from messages
        const userConversations = new Map<string, Conversation>();
        let totalUnread = 0;

        messagesData.forEach(msg => {
          const isCurrentUserSender = msg.sender_id === user.id;
          const otherUserId = isCurrentUserSender ? msg.receiver_id : msg.sender_id;
          const otherUserName = isCurrentUserSender 
            ? msg.receiverUser?.full_name 
            : msg.senderUser?.full_name;

          if (!userConversations.has(otherUserId)) {
            userConversations.set(otherUserId, {
              userId: otherUserId,
              userName: otherUserName || 'Unknown User',
              lastMessage: msg.content,
              timestamp: msg.created_at,
              unread: (!msg.read && !isCurrentUserSender) ? 1 : 0
            });

            if (!msg.read && !isCurrentUserSender) {
              totalUnread++;
            }
          }
        });

        setConversations(Array.from(userConversations.values()));
        setUnreadCount(totalUnread);
      } catch (fallbackError) {
        console.error('Fallback conversation loading failed:', fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch messages for a specific conversation
  const fetchMessages = useCallback(async (otherUserId: string) => {
    if (!user) return;

    try {
      setActiveConversation(otherUserId);
      setMessages([]); // Clear previous messages

      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          content,
          sender_id,
          receiver_id,
          created_at,
          read,
          senderUser:sender_id(full_name),
          receiverUser:receiver_id(full_name)
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Format messages
      const formattedMessages: Message[] = data.map(msg => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.sender_id,
        receiverId: msg.receiver_id,
        createdAt: msg.created_at,
        read: msg.read,
        senderName: msg.senderUser?.full_name,
        receiverName: msg.receiverUser?.full_name
      }));

      setMessages(formattedMessages);

      // Mark unread messages as read
      const unreadMessages = data
        .filter(msg => msg.receiver_id === user.id && !msg.read)
        .map(msg => msg.id);

      if (unreadMessages.length > 0) {
        const { error: updateError } = await supabase
          .from('chat_messages')
          .update({ read: true })
          .in('id', unreadMessages);

        if (updateError) {
          console.error('Error marking messages as read:', updateError);
        } else {
          // Update conversations list to reflect read messages
          fetchConversations();
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  }, [user, fetchConversations]);

  // Send a message
  const sendMessage = useCallback(async (receiverId: string, content: string) => {
    if (!user || !content.trim()) return null;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content: content.trim(),
          read: false
        })
        .select()
        .single();

      if (error) throw error;

      // Track activity
      await trackActivity(user.id, 'message_sent', `Sent a message`, receiverId);

      // Refresh the messages list
      if (activeConversation === receiverId) {
        fetchMessages(receiverId);
      }

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      return null;
    }
  }, [user, activeConversation, fetchMessages]);

  // Set up real-time listener for new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('chat-messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'chat_messages' }, 
        (payload) => {
          const newMessage = payload.new;
          
          // Only process messages related to the current user
          if (newMessage.sender_id === user.id || newMessage.receiver_id === user.id) {
            
            // If this is part of the active conversation, update the messages list
            if (activeConversation === newMessage.sender_id || activeConversation === newMessage.receiver_id) {
              fetchMessages(activeConversation);
            } else {
              // Otherwise, just update the conversations list
              fetchConversations();
              
              // Show notification for new messages
              if (newMessage.receiver_id === user.id) {
                // Get sender name
                supabase
                  .from('users')
                  .select('full_name')
                  .eq('user_id', newMessage.sender_id)
                  .single()
                  .then(({ data }) => {
                    if (data) {
                      toast.info(`New message from ${data.full_name}`, {
                        action: {
                          label: 'View',
                          onClick: () => fetchMessages(newMessage.sender_id)
                        }
                      });
                    }
                  });
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeConversation, fetchMessages, fetchConversations]);

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, [user, fetchConversations]);

  return {
    conversations,
    messages,
    activeConversation,
    isLoading,
    unreadCount,
    fetchMessages,
    sendMessage,
    refreshConversations: fetchConversations
  };
}
