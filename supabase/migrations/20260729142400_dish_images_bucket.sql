-- Private bucket for dish catalog photos, mirroring transaction-attachments
-- exactly: path convention {user_id}/{dish_id}/{filename}, folder-scoped
-- storage RLS, no metadata table needed since the path lives directly on
-- dishes.image_storage_path.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dish-images',
  'dish-images',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do nothing;

create policy "Users can view their own dish images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'dish-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can upload their own dish images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'dish-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own dish images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'dish-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own dish images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'dish-images' and (storage.foldername(name))[1] = auth.uid()::text);
