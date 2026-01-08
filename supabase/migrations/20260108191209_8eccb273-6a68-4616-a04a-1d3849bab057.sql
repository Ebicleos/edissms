-- Enable realtime for tables used by SuperAdmin pages
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE user_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE schools;
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;