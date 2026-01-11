import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  created_at: string;
  is_read: boolean;
}

export function useNotifications() {
  const { user, role, profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user || !role) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Fetch recent announcements as notifications based on role
    let query = supabase
      .from('announcements')
      .select('id, title, content, type, created_at, is_published, target_audience')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(10);

    // Filter by school if user has one
    if (profile?.school_id) {
      query = query.eq('school_id', profile.school_id);
    }

    // Filter by audience based on role
    if (role === 'student') {
      query = query.in('target_audience', ['all', 'students']);
    } else if (role === 'teacher') {
      query = query.in('target_audience', ['all', 'teachers']);
    }
    // Admins and superadmins see all announcements

    const { data: announcements, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      setIsLoading(false);
      return;
    }

    // Fetch read status for current user
    const announcementIds = (announcements || []).map(a => a.id);
    let readIds: string[] = [];
    
    if (announcementIds.length > 0) {
      const { data: readData } = await supabase
        .from('notification_reads')
        .select('announcement_id')
        .eq('user_id', user.id)
        .in('announcement_id', announcementIds);
      
      readIds = (readData || []).map(r => r.announcement_id);
    }

    const formattedNotifications: Notification[] = (announcements || []).map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      type: a.type || 'general',
      created_at: a.created_at || new Date().toISOString(),
      is_read: readIds.includes(a.id),
    }));

    setNotifications(formattedNotifications);
    setUnreadCount(formattedNotifications.filter(n => !n.is_read).length);
    setIsLoading(false);
  }, [user, role, profile?.school_id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    // Optimistically update UI
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    // Persist to database
    const { error } = await supabase
      .from('notification_reads')
      .upsert({
        user_id: user.id,
        announcement_id: notificationId,
      }, { onConflict: 'user_id,announcement_id' });

    if (error) {
      console.error('Error marking notification as read:', error);
      // Revert on error
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const unreadNotifications = notifications.filter(n => !n.is_read);
    
    // Optimistically update UI
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    // Persist all to database
    const inserts = unreadNotifications.map(n => ({
      user_id: user.id,
      announcement_id: n.id,
    }));

    if (inserts.length > 0) {
      const { error } = await supabase
        .from('notification_reads')
        .upsert(inserts, { onConflict: 'user_id,announcement_id' });

      if (error) {
        console.error('Error marking all notifications as read:', error);
        // Revert on error
        fetchNotifications();
      }
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
