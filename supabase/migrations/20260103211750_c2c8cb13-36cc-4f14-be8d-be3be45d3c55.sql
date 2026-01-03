-- Create profile for existing superadmin user if missing
INSERT INTO profiles (id, full_name, email)
VALUES (
  'b4816a4f-3ffc-42e0-95e5-a2d8c2435ddc',
  'Pastor Ebike Akpo',
  'pastorebikeakpo@gmail.com'
) ON CONFLICT (id) DO NOTHING;

-- Remove duplicate admin role since superadmin has full access
DELETE FROM user_roles 
WHERE user_id = 'b4816a4f-3ffc-42e0-95e5-a2d8c2435ddc' 
AND role = 'admin';