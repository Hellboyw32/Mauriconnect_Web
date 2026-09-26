import Menu from '@mui/material/Menu';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';
import SvgIcon from '@mui/material/SvgIcon';
import Edit02Icon from '@untitled-ui/icons-react/build/esm/Edit02';
import Trash02Icon from '@untitled-ui/icons-react/build/esm/Trash02';
import { hasPermission } from '@libs/permissions';
import type { FC } from 'react';
import { RouterLink } from 'src/components/router-link';
import { useAuth } from 'src/hooks/use-auth';

interface RoadTaxListTableMenuProps {
  anchorEl?: HTMLElement | null;
  editLink: string;
  onClose?: () => void;
  onDelete?: () => void;
  open?: boolean;
}

export const RoadTaxListTableMenu: FC<RoadTaxListTableMenuProps> = (props) => {
  const { anchorEl, editLink, onDelete, onClose, open = false } = props;
  const { user } = useAuth();
  const canEdit = hasPermission(user, 'RoadTax', 'Edit');
  const canDelete = hasPermission(user, 'RoadTax', 'Delete');

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
      {canEdit && (
        <MenuItem
          component={RouterLink}
          href={editLink}
        >
          <SvgIcon fontSize="small">
            <Edit02Icon />
          </SvgIcon>
          Edit
        </MenuItem>
      )}
      {canDelete && (
        <MenuItem onClick={onDelete}>
          <SvgIcon fontSize="small">
            <Trash02Icon />
          </SvgIcon>
          Delete
        </MenuItem>
      )}
    </Menu>
  );
};
