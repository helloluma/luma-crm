-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain'
  ]
);

-- Create storage policies for documents bucket
CREATE POLICY "Users can upload documents for their clients" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = 'client-documents'
  );

CREATE POLICY "Users can view documents for their clients" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND
    auth.uid() IS NOT NULL AND
    (
      -- User uploaded the document
      owner = auth.uid() OR
      -- User has access to the client (check via documents table)
      EXISTS (
        SELECT 1 FROM public.documents d
        JOIN public.clients c ON d.client_id = c.id
        WHERE d.file_path = name
        AND (
          c.assigned_agent = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('SuperAdmin', 'Admin')
          )
        )
      )
    )
  );

CREATE POLICY "Users can delete their uploaded documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND
    auth.uid() IS NOT NULL AND
    (
      owner = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('SuperAdmin', 'Admin')
      )
    )
  );

CREATE POLICY "Users can update their uploaded documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents' AND
    auth.uid() IS NOT NULL AND
    (
      owner = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('SuperAdmin', 'Admin')
      )
    )
  );