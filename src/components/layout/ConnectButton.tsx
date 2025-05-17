
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ConnectButtonProps {
  receiverId: string;
  onConnect?: () => void;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
}

const ConnectButton = ({ receiverId, onConnect, variant = "default", size = "default" }: ConnectButtonProps) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<"none" | "pending" | "connected" | "loading">("loading");
  
  useEffect(() => {
    const checkConnectionStatus = async () => {
      if (!user || !receiverId) {
        setStatus("none");
        return;
      }
      
      try {
        // Check if there's already a connection request
        const { data, error } = await supabase
          .from('connection_requests')
          .select('status')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .or(`sender_id.eq.${receiverId},receiver_id.eq.${receiverId}`);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          const connectionStatus = data[0].status;
          setStatus(connectionStatus === "accepted" ? "connected" : "pending");
        } else {
          setStatus("none");
        }
      } catch (error) {
        console.error("Error checking connection status:", error);
        setStatus("none");
      }
    };
    
    checkConnectionStatus();
  }, [user, receiverId]);
  
  const sendConnectionRequest = async () => {
    if (!user) {
      toast.error("You must be logged in to send connection requests");
      return;
    }
    
    try {
      setStatus("loading");
      
      // Insert the connection request
      const { error } = await supabase
        .from('connection_requests')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          status: 'pending'
        });
      
      if (error) throw error;
      
      // Create notification by adding to user_activity
      await supabase
        .from('user_activity')
        .insert({
          user_id: receiverId,
          activity_type: 'connection_request',
          description: `New connection request from ${user.email}`,
          entity_id: user.id
        });
      
      setStatus("pending");
      toast.success("Connection request sent!");
      
      if (onConnect) onConnect();
    } catch (error) {
      console.error("Error sending connection request:", error);
      toast.error("Failed to send connection request");
      setStatus("none");
    }
  };
  
  if (status === "loading") {
    return (
      <Button variant={variant} size={size} disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Loading...
      </Button>
    );
  }
  
  if (status === "pending") {
    return (
      <Button variant="outline" size={size} disabled>
        <Send className="h-4 w-4 mr-2" />
        Request Sent
      </Button>
    );
  }
  
  if (status === "connected") {
    return (
      <Button variant="outline" size={size} disabled>
        <Check className="h-4 w-4 mr-2" />
        Connected
      </Button>
    );
  }
  
  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={sendConnectionRequest}
    >
      <Send className="h-4 w-4 mr-2" />
      Connect
    </Button>
  );
};

export default ConnectButton;
