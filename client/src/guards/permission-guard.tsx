import PropTypes from 'prop-types';
import type { FC, ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import { hasPermission } from '@libs/permissions';
import type { Module } from '@libs/types';
import { useAuth } from 'src/hooks/use-auth';
import { useRouter } from 'src/hooks/use-router';
import { paths } from 'src/paths';

interface PermissionGuardProps {
  children: ReactNode;
  module: Module;
}

// Runs *inside* AuthGuard - by the time this mounts, isAuthenticated is
// already true. Only checks View access to the module's own screen; the
// Create/Edit/Delete flags are enforced separately, inline in each module's
// list/form components (hiding/disabling the relevant buttons).
export const PermissionGuard: FC<PermissionGuardProps> = (props) => {
  const { children, module } = props;
  const router = useRouter();
  const { user } = useAuth();
  const [checked, setChecked] = useState<boolean>(false);

  const check = useCallback(() => {
    if (!hasPermission(user, module, 'View')) {
      toast.error('You do not have permission to access that page.');
      router.replace(paths.dashboard.index);
      return;
    }

    setChecked(true);
  }, [user, module, router]);

  useEffect(
    () => {
      check();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user]
  );

  if (!checked) {
    return null;
  }

  return <>{children}</>;
};

PermissionGuard.propTypes = {
  children: PropTypes.node,
  module: PropTypes.string as any
};
