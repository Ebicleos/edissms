-- Create school-logos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-logos', 'school-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for school logos
CREATE POLICY "Anyone can view school logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'school-logos');

CREATE POLICY "Admins can upload school logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'school-logos' 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update school logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'school-logos' 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete school logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'school-logos' 
  AND has_role(auth.uid(), 'admin')
);

-- Insert superadmin role for pastorebikeakpo@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('b4816a4f-3ffc-42e0-95e5-a2d8c2435ddc', 'superadmin')
ON CONFLICT (user_id, role) DO NOTHING;