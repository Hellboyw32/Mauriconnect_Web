import type { ManagedUser, ManagedUsers } from '@libs/types';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Edit02Icon from '@untitled-ui/icons-react/build/esm/Edit02';
import Key01Icon from '@untitled-ui/icons-react/build/esm/Key01';
import LockUnlocked01Icon from '@untitled-ui/icons-react/build/esm/LockUnlocked01';
import Lock01Icon from '@untitled-ui/icons-react/build/esm/Lock01';
import { format } from 'date-fns';
import type { FC } from 'react';
import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import { RouterLink } from 'src/components/router-link';
import { Scrollbar } from 'src/components/scrollbar';
import { usersApi } from 'src/api/users';
import { paths } from 'src/paths';
import { replaceIdPath } from 'src/utils/replace-id-path';
import { LockConfirmDialog } from './lock-confirm-dialog';
import { ResetPasswordDialog } from './reset-password-dialog';

interface UserListTableProps {
  items?: ManagedUsers;
  isLoading?: boolean;
  currentUserId?: number;
  onRefresh?: () => void;
}

const formatDate = (value?: string | null): string => {
  if (!value) return '—';
  try {
    return format(new Date(value), 'dd MMM yyyy HH:mm');
  } catch {
    return '—';
  }
};

export const UserListTable: FC<UserListTableProps> = (props) => {
  const { items = [], isLoading = false, currentUserId, onRefresh } = props;
  const [lockTarget, setLockTarget] = useState<ManagedUser | null>(null);
  const [resetTarget, setResetTarget] = useState<ManagedUser | null>(null);
  const [isSubmittingLock, setIsSubmittingLock] = useState(false);

  const handleConfirmLockToggle = useCallback(async () => {
    if (!lockTarget) return;

    setIsSubmittingLock(true);
    try {
      if (lockTarget.IsAccountLocked) {
        await usersApi.unlockUser(lockTarget.UserId);
        toast.success(`Unlocked "${lockTarget.Username}"`);
      } else {
        await usersApi.lockUser(lockTarget.UserId);
        toast.success(`Locked "${lockTarget.Username}"`);
      }
      setLockTarget(null);
      onRefresh?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update account status');
    } finally {
      setIsSubmittingLock(false);
    }
  }, [lockTarget, onRefresh]);

  return (
    <Box sx={{ position: 'relative' }}>
      <Scrollbar>
        <Table sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Logged In</TableCell>
              <TableCell>Last Modified</TableCell>
              <TableCell>Modified By</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  align="center"
                >
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  align="center"
                >
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              items.map((user) => {
                const isSelf = user.UserId === currentUserId;

                return (
                  <TableRow key={user.UserId}>
                    <TableCell>{user.Username}</TableCell>
                    <TableCell>{user.EmailAccount}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={user.UserType}
                        color={user.UserType === 'Admin' ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {user.IsAccountLocked ? (
                        <Chip
                          size="small"
                          color="error"
                          label="Locked"
                        />
                      ) : user.IsActive ? (
                        <Chip
                          size="small"
                          color="success"
                          label="Active"
                        />
                      ) : (
                        <Chip
                          size="small"
                          label="Inactive"
                        />
                      )}
                    </TableCell>
                    <TableCell>{formatDate(user.LastLoggedIn)}</TableCell>
                    <TableCell>{formatDate(user.LastModifiedTimeStamp)}</TableCell>
                    <TableCell>{user.LastModifiedByUsername || '—'}</TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="flex-end"
                      >
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            component={RouterLink}
                            href={replaceIdPath(paths.admin.users.edit, ':userId', user.UserId)}
                          >
                            <SvgIcon fontSize="small">
                              <Edit02Icon />
                            </SvgIcon>
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reset Password">
                          <IconButton
                            size="small"
                            onClick={() => setResetTarget(user)}
                          >
                            <SvgIcon fontSize="small">
                              <Key01Icon />
                            </SvgIcon>
                          </IconButton>
                        </Tooltip>
                        <Tooltip
                          title={
                            isSelf
                              ? 'You cannot lock your own account'
                              : user.IsAccountLocked
                                ? 'Unlock'
                                : 'Lock'
                          }
                        >
                          <span>
                            <IconButton
                              size="small"
                              disabled={isSelf}
                              onClick={() => setLockTarget(user)}
                            >
                              <SvgIcon fontSize="small">
                                {user.IsAccountLocked ? <LockUnlocked01Icon /> : <Lock01Icon />}
                              </SvgIcon>
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Scrollbar>

      <LockConfirmDialog
        open={!!lockTarget}
        username={lockTarget?.Username}
        action={lockTarget?.IsAccountLocked ? 'unlock' : 'lock'}
        isSubmitting={isSubmittingLock}
        onClose={() => setLockTarget(null)}
        onConfirm={handleConfirmLockToggle}
      />

      <ResetPasswordDialog
        open={!!resetTarget}
        username={resetTarget?.Username}
        userId={resetTarget?.UserId}
        onClose={() => setResetTarget(null)}
      />
    </Box>
  );
};
