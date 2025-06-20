import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useEmployees } from './useEmployees';

export interface NotificationCounts {
  notifications: number;
  urgentNotifications: number;
  userApprovals: number;
  pendingDocuments: number;
  expiringVisas: number;
}

export const useNotificationCounts = () => {
  const [counts, setCounts] = useState<NotificationCounts>({
    notifications: 0,
    urgentNotifications: 0,
    userApprovals: 0,
    pendingDocuments: 0,
    expiringVisas: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { employees } = useEmployees();

  const fetchNotificationCounts = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Get urgent visa expiry notifications (within 30 days)
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const expiringVisas = employees.filter(emp => {
        if (!emp.visa_expiry_date) return false;
        const expiryDate = new Date(emp.visa_expiry_date);
        return expiryDate <= thirtyDaysFromNow && expiryDate >= today;
      });

      const urgentVisas = employees.filter(emp => {
        if (!emp.visa_expiry_date) return false;
        const expiryDate = new Date(emp.visa_expiry_date);
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(today.getDate() + 7);
        return expiryDate <= sevenDaysFromNow && expiryDate >= today;
      });

      // 2. Get unread notification logs from database
      const { count: unreadNotificationLogs, error: notificationError } = await supabase
        .from('notification_logs')
        .select('*', { count: 'exact', head: true })
        .eq('email_sent', true)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

      if (notificationError) {
        console.error('Error fetching notification logs:', notificationError);
      }

      // 3. Get pending user approvals (users with public role instead of pending status)
      const { count: pendingUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'public');  // Users with 'public' role are pending approval

      if (usersError) {
        console.error('Error fetching pending users:', usersError);
      }

      // 4. Get pending documents (documents without expiry_date as proxy for unverified)
      // Since there's no verified_at column, we'll count documents without expiry dates
      const { count: pendingDocs, error: docsError } = await supabase
        .from('employee_documents')
        .select('*', { count: 'exact', head: true })
        .is('expiry_date', null); // Documents without expiry dates

      if (docsError) {
        console.error('Error fetching pending documents:', docsError);
      }

      // Calculate total notifications
      const totalNotifications = expiringVisas.length + (unreadNotificationLogs || 0);
      const totalUrgent = urgentVisas.length;

      setCounts({
        notifications: totalNotifications,
        urgentNotifications: totalUrgent,
        userApprovals: pendingUsers || 0,
        pendingDocuments: pendingDocs || 0,
        expiringVisas: expiringVisas.length,
      });

    } catch (err) {
      console.error('Error fetching notification counts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notification counts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employees.length > 0) {
      fetchNotificationCounts();
    }
  }, [employees]);

  // Refresh counts every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (employees.length > 0) {
        fetchNotificationCounts();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [employees]);

  return {
    counts,
    loading,
    error,
    refresh: fetchNotificationCounts,
  };
}; 