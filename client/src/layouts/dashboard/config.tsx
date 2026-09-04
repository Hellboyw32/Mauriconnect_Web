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
import Tool01Icon from '@untitled-ui/icons-react/build/esm/Tool01';
import { tokens } from 'src/locales/tokens';
import { paths } from 'src/paths';

export interface Item {
  disabled?: boolean;
  external?: boolean;
  icon?: ReactNode;
  items?: Item[];
  label?: ReactNode;
  path?: string;
  title: string;
}

export interface Section {
  items: Item[];
  subheader?: string;
}

export const useSections = () => {
  const { t } = useTranslation();

  return useMemo(() => {
    return [
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
        subheader: t(tokens.nav.pages),
        items: [
          {
            title: t(tokens.nav.bookings),
            path: paths.bookings.index,
            icon: (
              <SvgIcon fontSize="small">
                <Truck01 />
              </SvgIcon>
            )
          },
          {
            title: t(tokens.nav.cars),
            path: paths.cars.index,
            icon: (
              <SvgIcon fontSize="small">
                <Truck01 />
              </SvgIcon>
            )
          },
          {
            title: t(tokens.nav.carInsurance),
            path: paths.carInsurance.index,
            icon: (
              <SvgIcon fontSize="small">
                <ReceiptCheck />
              </SvgIcon>
            )
          },
          {
            title: t(tokens.nav.roadTax),
            path: paths.roadTax.index,
            icon: (
              <SvgIcon fontSize="small">
                <CreditCard01 />
              </SvgIcon>
            )
          },
          {
            title: t(tokens.nav.fitnessCertificate),
            path: paths.fitnessCertificate.index,
            icon: (
              <SvgIcon fontSize="small">
                <File04 />
              </SvgIcon>
            )
          },
          {
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
            icon: (
              <SvgIcon fontSize="small">
                <LayoutAlt02 />
              </SvgIcon>
            )
          }
        ]
      }
    ];
  }, [t]);
};
