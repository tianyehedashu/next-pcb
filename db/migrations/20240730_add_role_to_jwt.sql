-- Function to update the user's role in auth.users from public.profiles
create or replace function public.update_user_role_from_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update auth.users
  set raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', new.role)
  where id = new.id;
  return new;
end;
$$;

-- Trigger to call the function when a profile's role is updated
create trigger on_profile_role_update
  after insert or update of role on public.profiles
  for each row
  execute function public.update_user_role_from_profile(); 