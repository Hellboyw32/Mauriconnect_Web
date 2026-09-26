import PropTypes from 'prop-types';
import type { FC, ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import type { UserType } from '@libs/types';
import { useAuth } from 'src/hooks/use-auth';
import { useRouter } from 'src/hooks/use-router';
import { paths } from 'src/paths';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserType[];
}

// Runs *inside* AuthGuard - by the time this mounts, isAuthenticated is
// already true. This only adds the role check on top; it never has to handle
// the unauthenticated case itself.
export const RoleGuard: FC<RoleGuardProps> = (props) => {
  const { children, allowedRoles } = props;
  const router = useRouter();
  const { user } = useAuth();
  const [checked, setChecked] = useState<boolean>(false);

  const check = useCallback(() => {
    if (!user || !allowedRoles.includes(user.userType)) {
      toast.error('You do not have permission to access that page.');
      router.replace(paths.dashboard.index);
      return;
    }

    setChecked(true);
  }, [user, allowedRoles, router]);

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

RoleGuard.propTypes = {
  children: PropTypes.node,
  allowedRoles: PropTypes.array as any
};
