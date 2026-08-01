import Menu from '@mui/material/Menu';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';
import SvgIcon from '@mui/material/SvgIcon';
import Edit02Icon from '@untitled-ui/icons-react/build/esm/Edit02';
import Trash02Icon from '@untitled-ui/icons-react/build/esm/Trash02';
import type { FC } from 'react';
import { RouterLink } from 'src/components/router-link';

interface FitnessCertificateListTableMenuProps {
  anchorEl?: HTMLElement | null;
  editLink: string;
  onClose?: () => void;
  onDelete?: () => void;
  open?: boolean;
}

export const FitnessCertificateListTableMenu: FC<FitnessCertificateListTableMenuProps> = (
  props
) => {
  const { anchorEl, editLink, onDelete, onClose, open = false } = props;

  return (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        horizontal: 'right',
        vertical: 'bottom'
      }}
      onClose={onClose}
      open={open}
      sx={{
        [`& .${menuItemClasses.root}`]: {
          fontSize: 14,
          '& svg': {
            mr: 1
          }
        }
      }}
      transformOrigin={{
        horizontal: 'right',
        vertical: 'top'
      }}
    >
      <MenuItem
        component={RouterLink}
        href={editLink}
      >
        <SvgIcon fontSize="small">
          <Edit02Icon />
        </SvgIcon>
        Edit
      </MenuItem>
      <MenuItem onClick={onDelete}>
        <SvgIcon fontSize="small">
          <Trash02Icon />
        </SvgIcon>
        Delete
      </MenuItem>
    </Menu>
  );
};
