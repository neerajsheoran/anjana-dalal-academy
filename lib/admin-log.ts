import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export type AdminAction =
  | 'delete_user'
  | 'restore_user'
  | 'permanent_delete_user'
  | 'change_role'
  | 'extend_subscription'
  | 'approve_application'
  | 'reject_application'
  | 'mark_commission_paid'
  | 'update_config';

interface LogEntry {
  action: AdminAction;
  adminUid: string;
  targetUid?: string;
  targetName?: string;
  details?: string;
}

export async function logAdminAction(entry: LogEntry) {
  try {
    await adminDb.collection('adminLogs').add({
      ...entry,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to write admin log:', err);
  }
}
