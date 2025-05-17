
-- Create a function to get all conversations for a user with the latest message and unread count
CREATE OR REPLACE FUNCTION public.get_conversations(user_id UUID)
RETURNS TABLE (
  other_user_id UUID,
  other_user_name TEXT,
  last_message TEXT,
  last_message_time TIMESTAMPTZ,
  unread_count BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH user_messages AS (
    -- Get all messages where the user is either sender or receiver
    SELECT 
      CASE 
        WHEN sender_id = user_id THEN receiver_id 
        ELSE sender_id 
      END as other_id,
      content,
      created_at,
      read,
      sender_id = user_id as is_sender
    FROM 
      chat_messages
    WHERE 
      sender_id = user_id OR receiver_id = user_id
  ),
  latest_messages AS (
    -- Get the latest message per conversation partner
    SELECT 
      other_id,
      content,
      created_at,
      read,
      is_sender,
      ROW_NUMBER() OVER (PARTITION BY other_id ORDER BY created_at DESC) as rn
    FROM 
      user_messages
  ),
  unread_counts AS (
    -- Count unread messages per conversation partner
    SELECT
      other_id,
      COUNT(*) as unread_count
    FROM
      user_messages
    WHERE
      NOT read AND NOT is_sender
    GROUP BY
      other_id
  )
  -- Join with users table to get names and combine with unread counts
  SELECT
    lm.other_id,
    u.full_name,
    lm.content,
    lm.created_at,
    COALESCE(uc.unread_count, 0)
  FROM
    latest_messages lm
  JOIN
    users u ON lm.other_id = u.user_id
  LEFT JOIN
    unread_counts uc ON lm.other_id = uc.other_id
  WHERE
    lm.rn = 1
  ORDER BY
    lm.created_at DESC;
END;
$$;
