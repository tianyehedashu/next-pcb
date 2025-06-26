-- =================================================================
--  Admin Order UUID Search Function
-- =================================================================
--  This function enables searching for orders using a partial UUID string.
--  It takes a text search term and returns a set of matching UUIDs.
--
--  Version: 1.0
--  Date: 2024-08-01
-- =================================================================

-- Drop the function if it exists to ensure a clean setup
DROP FUNCTION IF EXISTS search_orders_by_uuid(TEXT);

-- Create the function
CREATE OR REPLACE FUNCTION search_orders_by_uuid(search_text TEXT)
RETURNS TABLE(id uuid)
LANGUAGE sql
STABLE
AS $$
    -- Securely search for UUIDs by casting the id to text and using ILIKE
    -- This is safe from SQL injection as the input is treated as a single string literal
    SELECT id FROM pcb_quotes WHERE id::text ILIKE ('%' || search_text || '%');
$$;

-- Grant usage to authenticated users and the service role
GRANT EXECUTE ON FUNCTION search_orders_by_uuid(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_orders_by_uuid(TEXT) TO service_role;

-- Log success
SELECT 'Function search_orders_by_uuid created successfully' as status; 