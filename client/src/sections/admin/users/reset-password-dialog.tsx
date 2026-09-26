import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useFormik } from 'formik';
import type { FC } from 'react';
import { toast } from 'react-hot-toast';
import { usersApi } from 'src/api/users';
import * as Yup from 'yup';

interface ResetPasswordDialogProps {
  open: boolean;
  username?: string;
  userId?: number;
  onClose: () => void;
}

const validationSchema = Yup.object({
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain an uppercase letter')
    .matches(/[a-z]/, 'Password must contain a lowercase letter')
    .matches(/[0-9]/, 'Password must contain a number')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm the password')
});

export const ResetPasswordDialog: FC<ResetPasswordDialogProps> = (props) => {
  const { open, username, userId, onClose } = props;

  const formik = useFormik({
    initialValues: { password: '', confirmPassword: '' },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      if (!userId) return;

      try {
        await usersApi.changePassword(userId, values.password);
        toast.success(`Password reset for "${username}"`);
        resetForm();
        onClose();
      } catch (error: any) {
        toast.error(error.message || 'Failed to reset password');
      } finally {
        setSubmitting(false);
      }
    }
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
    >
      <form
        noValidate
        onSubmit={formik.handleSubmit}
      >
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Set a new password for <strong>{username}</strong>. They will need to use it the
              next time they log in.
            </Typography>
            <TextField
              autoFocus
              fullWidth
              label="New Password"
              name="password"
              type="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={!!(formik.touched.password && formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
            />
            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={!!(formik.touched.confirmPassword && formik.errors.confirmPassword)}
              helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            color="inherit"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={formik.isSubmitting}
          >
            Reset Password
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
