import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (user && role) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
    }
  }, [user, role, profile?.school_id]);

  const fetchNotifications = async () => {
    if (!user || !role) return;

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

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      setIsLoading(false);
      return;
    }

    const formattedNotifications: Notification[] = (data || []).map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      type: a.type || 'general',
      created_at: a.created_at || new Date().toISOString(),
      is_read: false, // We could track this in a separate table for per-user read status
    }));

    setNotifications(formattedNotifications);
    setUnreadCount(formattedNotifications.length);
    setIsLoading(false);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
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
