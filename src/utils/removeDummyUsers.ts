
import { supabase } from "@/integrations/supabase/client";

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
      return;
    }
    
    // Safety check - if no users property or it's empty, don't proceed
    if (!data || !data.users || data.users.length === 0) {
      console.log("No users found to check");
      return;
    }
    
    // Filter users with test emails
    const testUsers = data.users.filter(user => {
      // Only target specific test users with a clear pattern to avoid removing real users
      // Ensure user and user.email are defined
      return user && user.email && (
        user.email.includes("test+") || 
        user.email.includes("dummy+") ||
        user.email.startsWith("test_") ||
        user.email.endsWith("@example.com")
      );
    });
    
    console.log(`Found ${testUsers.length} test users to remove`);
    
    for (const user of testUsers) {
      if (user.id) {
        const { error } = await supabase.auth.admin.deleteUser(user.id);
        if (error) {
          console.error(`Failed to delete user ${user.email}:`, error);
        } else {
          console.log(`Successfully removed test user: ${user.email}`);
        }
      }
    }
    
    return testUsers.length;
  } catch (err) {
    console.error("Error in removeDummyUsers:", err);
    return 0;
  }
}
