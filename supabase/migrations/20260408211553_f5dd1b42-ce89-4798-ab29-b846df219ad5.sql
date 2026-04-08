
DROP POLICY IF EXISTS "Admins can delete school logos" ON storage.objects;

CREATE POLICY "Admins and superadmins can delete school logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'school-logos'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'superadmin'::public.app_role)
  )
);
