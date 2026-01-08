import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

interface AuditLogParams {
  action: string;
  entityType: string;
  entityId?: string;
  oldData?: Json;
  newData?: Json;
}

/**
 * Log an action to the audit_logs table
 */
export async function logAudit({
  action,
  entityType,
  entityId,
  oldData,
  newData,
}: AuditLogParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('audit_logs').insert([{
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      user_id: user?.id || null,
      old_data: oldData || null,
      new_data: newData || null,
    }]);
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
}
