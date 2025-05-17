
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase, trackActivity } from '@/integrations/supabase/client';

interface Connection {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  senderName?: string;
  receiverName?: string;
}

export function useConnections() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<Connection[]>([]);
  const [sentRequests, setSentRequests] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all connections
  const fetchConnections = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Get connections where the current user is either sender or receiver
      const { data: connectionData, error: connectionError } = await supabase
        .from('connection_requests')
        .select(`
          id,
          sender_id,
          receiver_id,
          status,
          created_at,
          updated_at,
          senderProfile:sender_id(full_name),
          receiverProfile:receiver_id(full_name)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (connectionError) throw connectionError;

      const connections = connectionData.map(conn => ({
        id: conn.id,
        senderId: conn.sender_id,
        receiverId: conn.receiver_id,
        status: conn.status,
        createdAt: conn.created_at,
        updatedAt: conn.updated_at,
        senderName: conn.senderProfile?.full_name,
        receiverName: conn.receiverProfile?.full_name
      }));

      // Filter by status and role
      const accepted = connections.filter(conn => conn.status === 'accepted');
      const received = connections.filter(conn => 
        conn.status === 'pending' && conn.receiverId === user.id
      );
      const sent = connections.filter(conn => 
        conn.status === 'pending' && conn.senderId === user.id
      );

      setConnections(accepted);
      setReceivedRequests(received);
      setSentRequests(sent);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error('Failed to load connections');
    } finally {
      setIsLoading(false);
    }
  };

  // Send a connection request
  const sendConnectionRequest = async (receiverId: string) => {
    if (!user) {
      toast.error('You must be logged in to send connection requests');
      return false;
    }

    try {
      // Check if a request already exists
      const { data: existingRequest, error: checkError } = await supabase
        .from('connection_requests')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`);

      if (checkError) throw checkError;

      if (existingRequest && existingRequest.length > 0) {
        const request = existingRequest[0];
        
        if (request.status === 'accepted') {
          toast.info('You are already connected with this user');
          return false;
        } else if (request.status === 'pending') {
          if (request.sender_id === user.id) {
            toast.info('You already sent a connection request to this user');
          } else {
            toast.info('This user has already sent you a connection request');
          }
          return false;
        }
      }

      // Create the connection request
      const { error: insertError } = await supabase
        .from('connection_requests')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          status: 'pending'
        });

      if (insertError) throw insertError;

      // Track activity
      await trackActivity(user.id, 'connection_sent', `Sent connection request`, receiverId);
      
      // Refresh connections list
      fetchConnections();
      
      toast.success('Connection request sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error('Failed to send connection request');
      return false;
    }
  };

  // Accept a connection request
  const acceptConnectionRequest = async (requestId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('connection_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', requestId)
        .eq('receiver_id', user.id);

      if (error) throw error;

      // Find the request to get the sender's ID
      const request = receivedRequests.find(r => r.id === requestId);
      if (request) {
        // Track activity
        await trackActivity(
          user.id, 
          'connection_accepted', 
          `Accepted connection request from ${request.senderName || 'a user'}`,
          request.senderId
        );
      }

      // Refresh connections
      fetchConnections();
      toast.success('Connection request accepted');
      return true;
    } catch (error) {
      console.error('Error accepting connection request:', error);
      toast.error('Failed to accept connection request');
      return false;
    }
  };

  // Reject a connection request
  const rejectConnectionRequest = async (requestId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('connection_requests')
        .delete()
        .eq('id', requestId)
        .eq('receiver_id', user.id);

      if (error) throw error;

      // Refresh connections
      fetchConnections();
      toast.success('Connection request rejected');
      return true;
    } catch (error) {
      console.error('Error rejecting connection request:', error);
      toast.error('Failed to reject connection request');
      return false;
    }
  };

  // Cancel a sent connection request
  const cancelConnectionRequest = async (requestId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('connection_requests')
        .delete()
        .eq('id', requestId)
        .eq('sender_id', user.id);

      if (error) throw error;

      // Refresh connections
      fetchConnections();
      toast.success('Connection request canceled');
      return true;
    } catch (error) {
      console.error('Error canceling connection request:', error);
      toast.error('Failed to cancel connection request');
      return false;
    }
  };

  // Listen for real-time connection updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('connection-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'connection_requests' }, 
        (payload) => {
          const data = payload.new || payload.old;
          
          // Only react to changes relevant to the current user
          if (data.sender_id === user.id || data.receiver_id === user.id) {
            fetchConnections();
            
            // Show notifications for new requests
            if (payload.eventType === 'INSERT' && data.receiver_id === user.id) {
              // We'll need to get the sender's name
              const getSenderName = async () => {
                const { data: userData } = await supabase
                  .from('users')
                  .select('full_name')
                  .eq('user_id', data.sender_id)
                  .single();
                  
                if (userData) {
                  toast.info(`New connection request from ${userData.full_name}`);
                }
              };
              
              getSenderName();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchConnections();
  }, [user]);

  return {
    connections,
    receivedRequests,
    sentRequests,
    isLoading,
    sendConnectionRequest,
    acceptConnectionRequest,
    rejectConnectionRequest,
    cancelConnectionRequest,
    refreshConnections: fetchConnections
  };
}
