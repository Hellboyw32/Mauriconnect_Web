import SvgIcon from '@mui/material/SvgIcon';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import BarChartSquare02Icon from 'src/icons/untitled-ui/duocolor/bar-chart-square-02';
import HomeSmileIcon from 'src/icons/untitled-ui/duocolor/home-smile';
import LayoutAlt02 from 'src/icons/untitled-ui/duocolor/layout-alt-02';
import Truck01 from 'src/icons/untitled-ui/duocolor/truck-01';
import ReceiptCheck from 'src/icons/untitled-ui/duocolor/receipt-check';
import CreditCard01 from 'src/icons/untitled-ui/duocolor/credit-card-01';
import File04 from 'src/icons/untitled-ui/duocolor/file-04';
import Users03 from 'src/icons/untitled-ui/duocolor/users-03';
import LogOut01 from 'src/icons/untitled-ui/duocolor/log-out-01';
import Lock01 from 'src/icons/untitled-ui/duocolor/lock-01';
import Tool01Icon from '@untitled-ui/icons-react/build/esm/Tool01';
import { hasPermission } from '@libs/permissions';
import type { Module } from '@libs/types';
import { tokens } from 'src/locales/tokens';
import { paths } from 'src/paths';
import { useAuth } from 'src/hooks/use-auth';

export interface Item {
  disabled?: boolean;
  external?: boolean;
  icon?: ReactNode;
  items?: Item[];
  label?: ReactNode;
  path?: string;
  title: string;
  // Tags an item as belonging to a gated module - used to filter the nav for
  // Normal users whose View permission for that module is off. Items without
  // this (Overview/Analytics) are always shown to any authenticated user.
  module?: Module;
}

export interface Section {
  items: Item[];
  subheader?: string;
}

export const useSections = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.userType === 'Admin';

  return useMemo(() => {
    const pageItems: Item[] = [
      {
        title: t(tokens.nav.bookings),
        path: paths.bookings.index,
        module: 'Bookings',
        icon: (
          <SvgIcon fontSize="small">
            <Truck01 />
          </SvgIcon>
        )
      },
      {
        title: t(tokens.nav.cars),
        path: paths.cars.index,
        module: 'Cars',
        icon: (
          <SvgIcon fontSize="small">
            <Truck01 />
          </SvgIcon>
        )
      },
      {
        title: t(tokens.nav.carInsurance),
        path: paths.carInsurance.index,
        module: 'CarInsurance',
        icon: (
          <SvgIcon fontSize="small">
            <ReceiptCheck />
          </SvgIcon>
        )
      },
      {
        title: t(tokens.nav.roadTax),
        path: paths.roadTax.index,
        module: 'RoadTax',
        icon: (
          <SvgIcon fontSize="small">
            <CreditCard01 />
          </SvgIcon>
        )
      },
      {
        title: t(tokens.nav.fitnessCertificate),
        path: paths.fitnessCertificate.index,
        module: 'FitnessCertificate',
        icon: (
          <SvgIcon fontSize="small">
            <File04 />
          </SvgIcon>
        )
      },
      {
        // Not permission-gated: Car Servicing predates the RBAC module system
        // (see Module type in @libs/types) and was always unrestricted on main.
        // Leaving it that way here rather than inventing a new Module value as
        // a side effect of this merge.
        title: t(tokens.nav.carServicing),
        path: paths.carServicing.index,
        icon: (
          <SvgIcon fontSize="small">
            <Tool01Icon />
          </SvgIcon>
        )
      },
      {
        title: t(tokens.nav.reports),
        path: paths.reports.index,
        module: 'Reports',
        icon: (
          <SvgIcon fontSize="small">
            <LayoutAlt02 />
          </SvgIcon>
        )
      }
    ];

    const sections: Section[] = [
      {
        items: [
          {
            title: t(tokens.nav.overview),
            path: paths.dashboard.index,
            icon: (
              <SvgIcon fontSize="small">
                <HomeSmileIcon />
              </SvgIcon>
            )
          },
          {
            title: t(tokens.nav.analytics),
            path: paths.dashboard.analytics,
            icon: (
              <SvgIcon fontSize="small">
                <BarChartSquare02Icon />
              </SvgIcon>
            )
          }
        ]
      },

      {
        subheader: t(tokens.nav.pages) ?? undefined,
        items: pageItems.filter((item) => !item.module || hasPermission(user, item.module, 'View'))
      }
    ];

    // Admin-only navigation. This is a UI convenience, not the security
    // boundary - RoleGuard on the routes and requireRole('Admin') on the API
    // are what actually keep normal users out (see src/guards/role-guard.tsx
    // and api/src/middlewares/auth.ts).
    if (isAdmin) {
      sections.push({
        subheader: 'Administration',
        items: [
          {
            title: 'Users',
            path: paths.admin.users.index,
            icon: (
              <SvgIcon fontSize="small">
                <Users03 />
              </SvgIcon>
            )
          },
          {
            title: 'User Activity',
            path: paths.admin.loginLogs.index,
            icon: (
              <SvgIcon fontSize="small">
                <LogOut01 />
              </SvgIcon>
            )
          },
          {
            title: 'Audit Logs',
            path: paths.admin.auditLogs.index,
            icon: (
              <SvgIcon fontSize="small">
                <Lock01 />
              </SvgIcon>
            )
          },
          {
            title: 'Analytics',
            path: paths.admin.analytics.index,
            icon: (
              <SvgIcon fontSize="small">
                <BarChartSquare02Icon />
              </SvgIcon>
            )
          }
        ]
      });
    }

    return sections;
  }, [t, isAdmin, user]);
};
