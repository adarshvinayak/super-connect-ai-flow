import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useConnections } from "@/hooks/useConnections";
import { useMessaging } from "@/hooks/useMessaging";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function NotificationsPopover() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { receivedRequests, acceptConnectionRequest, rejectConnectionRequest } = useConnections();
  const { unreadCount } = useMessaging();
  const [activityNotifications, setActivityNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  
  const totalNotifications = (receivedRequests?.length || 0) + (unreadCount || 0) + (activityNotifications?.length || 0);
  
  // Fetch recent activity notifications
  useEffect(() => {
    const fetchRecentActivity = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_activity')
          .select(`
            id,
            activity_type,
            description,
            entity_id,
            created_at,
            user_id
          `)
          .neq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (error) {
          console.error('Error fetching activity notifications:', error);
          return;
        }
        
        // If no data, set empty array
        if (!data || data.length === 0) {
          setActivityNotifications([]);
          return;
        }
        
        // Fetch user names separately
        const userIds = data.map(activity => activity.user_id);
        
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('user_id, full_name')
          .in('user_id', userIds);
          
        if (usersError) {
          console.error('Error fetching user names:', usersError);
          return;
        }
        
        // Create a map of user IDs to names
        const userMap = new Map<string, string>();
        if (usersData) {
          usersData.forEach(u => {
            userMap.set(u.user_id, u.full_name || 'Unknown User');
          });
        }
        
        // Combine activity data with user names
        const activitiesWithUserNames = data.map(activity => ({
          ...activity,
          userName: userMap.get(activity.user_id) || 'Unknown User'
        }));
        
        setActivityNotifications(activitiesWithUserNames);
      } catch (error) {
        console.error('Error in fetchRecentActivity:', error);
      }
    };
    
    fetchRecentActivity();
    
    // Set up realtime subscription for user activity
    if (user) {
      const channel = supabase
        .channel('activity-notifications')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'user_activity' }, 
          (payload) => {
            fetchRecentActivity();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);
  
  // Format relative time (e.g., "2 hours ago")
  const getRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {totalNotifications > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
              {totalNotifications > 99 ? '99+' : totalNotifications}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <Tabs defaultValue="connections">
          <div className="border-b px-3 py-2">
            <h4 className="font-medium text-sm">Notifications</h4>
          </div>
          <TabsList className="w-full">
            <TabsTrigger value="connections" className="flex-1">
              Connections {receivedRequests?.length > 0 && `(${receivedRequests.length})`}
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex-1">
              Messages {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex-1">
              Activity
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="connections" className="max-h-[300px] overflow-y-auto p-0">
            {receivedRequests?.length ? (
              <div className="divide-y divide-gray-100">
                {receivedRequests.map((request) => (
                  <div key={request.id} className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{request.senderName}</p>
                        <p className="text-xs text-gray-500">Sent you a connection request</p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => rejectConnectionRequest(request.id)}
                      >
                        Decline
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => acceptConnectionRequest(request.id)}
                      >
                        Accept
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No pending connection requests
              </div>
            )}
            <div className="p-2 border-t">
              <Button 
                variant="ghost" 
                className="w-full text-sm"
                onClick={() => {
                  navigate('/connections');
                  setOpen(false);
                }}
              >
                View all connections
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="messages" className="max-h-[300px] overflow-y-auto p-0">
            {unreadCount > 0 ? (
              <div className="p-3 text-center">
                <p>You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}</p>
                <Button 
                  className="mt-2"
                  onClick={() => {
                    navigate('/messaging');
                    setOpen(false);
                  }}
                >
                  View Messages
                </Button>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No unread messages
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="activity" className="max-h-[300px] overflow-y-auto p-0">
            {activityNotifications?.length ? (
              <div className="divide-y divide-gray-100">
                {activityNotifications.map((activity) => (
                  <div key={activity.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm">
                          <span className="font-medium">{activity.userName || 'Someone'}</span>
                          {' '}
                          {activity.description.toLowerCase()}
                        </p>
                        <p className="text-xs text-gray-500">{getRelativeTime(activity.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No recent activity
              </div>
            )}
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
