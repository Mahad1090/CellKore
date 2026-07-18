-- CellKore admin role migration
-- Run this after deploying the two-role app changes.

-- Add the new role to the enum if it does not exist yet.
alter type admin_role add value if not exists 'admin';

-- Convert legacy roles to the new admin role.
update admin_users
set role = 'admin'
where role in ('editor', 'support');

-- Make admin the default for new admin accounts.
alter table admin_users
alter column role set default 'admin';
