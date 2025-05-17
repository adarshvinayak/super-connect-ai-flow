
import { supabase } from "@/integrations/supabase/client";

// Define a type for the user object returned by Supabase auth.admin.listUsers
interface SupabaseUser {
  id: string;
  email?: string;
  [key: string]: any; // For other properties that might be present
}

/**
 * Removes any dummy test user accounts from the authentication system that match a known test pattern
 * For safety, this only removes users that have emails matching the test pattern
 */
export async function removeDummyUsers() {
  try {
    // Get all users
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    
    if (error) {
      console.error("Error fetching users:", error);
      return 0;
    }
    
    // Safety check - if no users property or it's empty, don't proceed
    if (!data || !data.users || data.users.length === 0) {
      console.log("No users found to check");
      return 0;
    }
    
    // Filter users with test emails
    // Explicitly type the users array to avoid 'never' type inference
    const users = data.users as SupabaseUser[];
    const testUsers = users.filter(user => {
      // Only target specific test users with a clear pattern to avoid removing real users
      // Ensure user and user.email are defined
      if (!user || !user.email) return false;
      
      return (
        user.email.includes("test+") || 
        user.email.includes("dummy+") ||
        user.email.startsWith("test_") ||
        user.email.endsWith("@example.com")
      );
    });
    
    console.log(`Found ${testUsers.length} test users to remove`);
    
    let removedCount = 0;
    for (const user of testUsers) {
      if (user.id) {
        const { error } = await supabase.auth.admin.deleteUser(user.id);
        if (error) {
          console.error(`Failed to delete user ${user.email}:`, error);
        } else {
          console.log(`Successfully removed test user: ${user.email}`);
          removedCount++;
        }
      }
    }
    
    return removedCount;
  } catch (err) {
    console.error("Error in removeDummyUsers:", err);
    return 0;
  }
}
