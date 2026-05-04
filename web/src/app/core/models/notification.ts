export type NotificationType = 'fine_issued' | 'reservation_ready' | 'system';

export interface Notification {
    id: number;
    user: number;
    title: string;
    message: string;
    notification_type: NotificationType;
    is_read: boolean;
    created_at: string;
    read_at: string | null;
}
