# CampusBoard student and administrator access

## Before applying the SQL

1. In Supabase, create the first CampusBoard account you intend to use as an administrator. This must be done **before** applying `setup.sql`; the migration blocks new accounts unless their email has been approved.
2. Run the entire contents of [`setup.sql`](./setup.sql) in the Supabase SQL Editor. Do not run only part of it; the app calls database functions created by this script.
3. Promote that existing account by running this query, replacing the email with the administrator's exact account email:

   ```sql
   update public.profiles
   set role = 'admin'
   where lower(email) = lower('admin@your-university.edu');
   ```

4. Confirm exactly one row was updated. Do not grant admin access through app registration or client-side profile edits.
5. Sign out and back in so the app reloads the account role.

The script asks PostgREST to reload its schema cache. If the app still reports that `get_my_profile` is missing, verify the SQL Editor ran successfully, then run `notify pgrst, 'reload schema';` in a new SQL query and restart/reload the app.

If the SQL fails, stop and resolve the schema mismatch before continuing. The app expects the existing `public.profiles` table to have `id`, `email`, `full_name`, and `created_at`, and `public.notices` to have `user_id` referencing `profiles.id`.

## Notice reactions and comments

After applying `setup.sql`, run the entire contents of [`notice-engagement.sql`](./notice-engagement.sql) in the Supabase SQL Editor. This creates the reaction and comment tables, enables row-level access rules, and adds the read functions used by the app. It is safe to run again if it has already been applied.

Signed-in users can read comments and reaction totals, add comments and set one reaction per notice. Users can delete their own comments; admins can also remove comments. Reactions are private to their owner except for aggregate counts.

## Approving students

1. Sign in as an admin and open the **Admin** tab.
2. Add the student's university email. Approval is limited to that exact address; the student can then use **Create an account** with that email.
3. The database consumes the approval when signup succeeds. Admins can revoke approvals that have not yet been used.

This approval flow does not independently verify university enrollment. Admins should approve only addresses they have verified. Email confirmation should also be enabled in Supabase Auth.

## Access rules

- Students may create, edit, and delete their own notices. Admins may moderate any notice.
- All signed-in users can read notices.
- Public signup is blocked unless the address has an unused admin approval.
- Admin role changes are performed manually in Supabase, never by the app.
- Student discovery is limited to signed-in students who share a selected interest. Students can opt out. Discovery returns only their name and shared interests; email addresses are not exposed.
- Connection requests are limited to shared-interest students and can be accepted, declined, or cancelled. Database functions verify participants and permissions.

The SQL replaces existing RLS policies on `profiles`, `notices`, `student_invites`, and `connection_requests` with the policies used by this app. Review any custom policies on those tables before running it.
