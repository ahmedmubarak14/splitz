-- Break RLS recursion for subscriptions and subscription_contributors using security definer functions

-- 1) Helper functions
create or replace function public.is_subscription_owner(_user_id uuid, _subscription_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.subscriptions s
    where s.id = _subscription_id and s.user_id = _user_id
  );
$$;

create or replace function public.is_subscription_contributor(_user_id uuid, _subscription_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.subscription_contributors sc
    where sc.subscription_id = _subscription_id and sc.user_id = _user_id
  );
$$;

create or replace function public.is_subscription_owner_and_shared(_user_id uuid, _subscription_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.subscriptions s
    where s.id = _subscription_id and s.user_id = _user_id and s.is_shared = true
  );
$$;

-- 2) Update policies on subscription_contributors (replace recursive ones)
-- Drop existing policies that cause recursion or reference other tables directly
drop policy if exists "Contributors can view fellow contributors" on public.subscription_contributors;
drop policy if exists "Subscription owners can view all contributors" on public.subscription_contributors;
drop policy if exists "Subscription owners can add contributors" on public.subscription_contributors;
drop policy if exists "Subscription owners can remove contributors" on public.subscription_contributors;

-- Recreate using helper functions
create policy "Subscription owners can add contributors"
on public.subscription_contributors
for insert
to authenticated
with check (public.is_subscription_owner_and_shared(auth.uid(), subscription_id));

create policy "Subscription owners can remove contributors"
on public.subscription_contributors
for delete
to authenticated
using (public.is_subscription_owner(auth.uid(), subscription_id));

create policy "Subscription owners can view all contributors"
on public.subscription_contributors
for select
to authenticated
using (public.is_subscription_owner(auth.uid(), subscription_id));

create policy "Contributors can view fellow contributors"
on public.subscription_contributors
for select
to authenticated
using (public.is_subscription_contributor(auth.uid(), subscription_id));

-- 3) Update policy on subscriptions for contributors viewing shared subs
drop policy if exists "Contributors can view shared subscriptions they are part of" on public.subscriptions;

create policy "Contributors can view shared subscriptions they are part of"
on public.subscriptions
for select
to authenticated
using (
  is_shared = true and public.is_subscription_contributor(auth.uid(), id)
);
