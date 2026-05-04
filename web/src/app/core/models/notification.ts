export type NotificationType =
  | 'loan_due'
  | 'reservation_ready'
  | 'fine_issued'
  | 'order_update'
  | 'system';

export interface Notification {
  id: number;
  user: number;
  user_name: string;
  title: string;
  message: string;
  notification_type: NotificationType;
  related_object_type: string | null;
  related_object_id: number | null;
  is_read: boolean;
  is_unread: boolean;
  created_at: string;
  read_at: string | null;
}
