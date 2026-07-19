import {
  NotificationBell as SharedNotificationBell,
  NotificationBellProvider,
} from '@elite-realty/shared-ui/components/notifications';
import type { NotificationRole } from '@elite-realty/shared-ui/hooks';
import { api } from '@elite-realty/shared-ui/lib/api';
import { useAuth } from '@elite-realty/shared-ui/hooks';

interface NotificationBellProps {
  role: NotificationRole;
  usePortal?: boolean;
}

export default function NotificationBell({ role, usePortal = true }: NotificationBellProps) {
  const { user } = useAuth();
  const authUser = { id: user?.id };
  return (
    <NotificationBellProvider api={api as never} useAuthUser={() => authUser}>
      <SharedNotificationBell role={role} usePortal={usePortal} />
    </NotificationBellProvider>
  );
}
