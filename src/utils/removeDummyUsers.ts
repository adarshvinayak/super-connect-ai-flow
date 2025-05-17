
import { supabase } from "@/integrations/supabase/client";

// Function to remove all dummy users from the system
export const removeDummyUsers = async () => {
  try {
    console.log("Starting to remove dummy users...");
    
    // First get all users with example.com emails (our dummy users)
    const { data: dummyUsers, error: fetchError } = await supabase.auth.admin
      .listUsers();
    
    if (fetchError) {
      throw fetchError;
    }
    
    const dummyUserIds = dummyUsers
      .filter(user => user.email.includes('example.com'))
      .map(user => user.id);
    
    console.log(`Found ${dummyUserIds.length} dummy users to remove`);
    
    // Remove the users one by one
    let successCount = 0;
    let errorCount = 0;
    
    for (const userId of dummyUserIds) {
      try {
        // Delete from auth.users (will cascade to other tables)
        const { error: deleteError } = await supabase.auth.admin
          .deleteUser(userId);
        
        if (deleteError) {
          console.error(`Failed to delete user ${userId}:`, deleteError);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (userError) {
        console.error(`Error processing user ${userId}:`, userError);
        errorCount++;
      }
    }
    
    console.log(`Removed ${successCount} dummy users successfully`);
    if (errorCount > 0) {
      console.warn(`Failed to remove ${errorCount} dummy users`);
    }
    
    return {
      success: true,
      removedCount: successCount,
      failedCount: errorCount
    };
  } catch (error) {
    console.error("Error removing dummy users:", error);
    return {
      success: false,
      error: error.message
    };
  }
};
