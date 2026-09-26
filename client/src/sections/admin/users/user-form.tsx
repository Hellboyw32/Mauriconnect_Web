import { ALL_MODULES, ALL_REPORT_TYPES } from '@libs/permissions';
import type {
  ManagedUser,
  ModulePermission,
  ReportTypePermission,
  UserFormValues
} from '@libs/types';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { useFormik } from 'formik';
import type { FC } from 'react';
import { toast } from 'react-hot-toast';
import { usersApi } from 'src/api/users';
import { useAuth } from 'src/hooks/use-auth';
import { useRouter } from 'src/hooks/use-router';
import { paths } from 'src/paths';
import { PermissionsMatrix } from './permissions-matrix';
import * as Yup from 'yup';

interface UserFormProps {
  mode?: 'create' | 'edit';
  user?: ManagedUser | null;
}

// Matches the default-allow model (see database/add_user_permissions.sql) -
// a brand-new Normal user starts with full access, same as before this
// feature existed, until an admin explicitly restricts something.
const allTruePermissions = (): ModulePermission[] =>
  ALL_MODULES.map((module) => ({
    module,
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    maxDaysBeforeToday: null,
    maxDaysAfterToday: null
  }));

const allTrueReportTypes = (): ReportTypePermission[] =>
  ALL_REPORT_TYPES.map((reportType) => ({ reportType, isAllowed: true }));

const defaultInitialValues: UserFormValues = {
  Username: '',
  EmailAccount: '',
  Password: '',
  ConfirmPassword: '',
  UserType: 'Normal',
  IsActive: true,
  IsAccountLocked: false,
  Permissions: allTruePermissions(),
  ReportTypes: allTrueReportTypes()
};

const buildValidationSchema = (mode: 'create' | 'edit') =>
  Yup.object({
    Username: Yup.string().max(100).required('Username is required'),
    EmailAccount: Yup.string().email('Must be a valid email').max(255).required('Email is required'),
    UserType: Yup.string().oneOf(['Normal', 'Admin']).required('User type is required'),
    IsActive: Yup.boolean().required(),
    IsAccountLocked: Yup.boolean().required(),
    Password:
      mode === 'create'
        ? Yup.string()
            .min(8, 'Password must be at least 8 characters')
            .matches(/[A-Z]/, 'Password must contain an uppercase letter')
            .matches(/[a-z]/, 'Password must contain a lowercase letter')
            .matches(/[0-9]/, 'Password must contain a number')
            .required('Password is required')
        : Yup.string().notRequired(),
    ConfirmPassword:
      mode === 'create'
        ? Yup.string()
            .oneOf([Yup.ref('Password')], 'Passwords must match')
            .required('Please confirm the password')
        : Yup.string().notRequired()
  });

export const UserForm: FC<UserFormProps> = (props) => {
  const { mode = 'create', user } = props;
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const isSelf = mode === 'edit' && user?.UserId === currentUser?.userId;

  const initialValues: UserFormValues = user
    ? {
        UserId: user.UserId,
        Username: user.Username,
        EmailAccount: user.EmailAccount,
        UserType: user.UserType,
        IsActive: user.IsActive,
        IsAccountLocked: user.IsAccountLocked,
        // Missing/empty rows mean "allowed" (default-allow model) - fall
        // back to all-true rather than leaving the matrix showing nothing.
        Permissions: user.Permissions?.length
          ? user.Permissions.map((row) => ({
              module: row.Module as ModulePermission['module'],
              canView: row.CanView,
              canCreate: row.CanCreate,
              canEdit: row.CanEdit,
              canDelete: row.CanDelete,
              maxDaysBeforeToday: row.MaxDaysBeforeToday ?? null,
              maxDaysAfterToday: row.MaxDaysAfterToday ?? null
            }))
          : allTruePermissions(),
        ReportTypes: user.ReportTypes?.length
          ? user.ReportTypes.map((row) => ({
              reportType: row.ReportType as ReportTypePermission['reportType'],
              isAllowed: row.IsAllowed
            }))
          : allTrueReportTypes()
      }
    : defaultInitialValues;

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema: buildValidationSchema(mode),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        if (mode === 'edit' && user) {
          await usersApi.updateUser(user.UserId, values);
          toast.success('User updated successfully');
        } else {
          await usersApi.createUser(values);
          toast.success('User created successfully');
        }
        router.push(paths.admin.users.index);
      } catch (error: any) {
        toast.error(error.message || `Failed to ${mode} user`);
      } finally {
        setSubmitting(false);
      }
    }
  });

  return (
    <form
      onSubmit={formik.handleSubmit}
      noValidate
    >
      <Stack spacing={4}>
        <Card>
          <CardContent>
            <Grid
              container
              spacing={3}
            >
              <Grid
                xs={12}
                md={12}
              >
                <Stack spacing={3}>
                  <Typography variant="h6">Account Information</Typography>

                  <TextField
                    fullWidth
                    required
                    label="Username"
                    name="Username"
                    value={formik.values.Username}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={!!(formik.touched.Username && formik.errors.Username)}
                    helperText={formik.touched.Username && formik.errors.Username}
                  />

                  <TextField
                    fullWidth
                    required
                    label="Email Account"
                    name="EmailAccount"
                    type="email"
                    value={formik.values.EmailAccount}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={!!(formik.touched.EmailAccount && formik.errors.EmailAccount)}
                    helperText={formik.touched.EmailAccount && formik.errors.EmailAccount}
                  />

                  {mode === 'create' && (
                    <>
                      <TextField
                        fullWidth
                        required
                        label="Password"
                        name="Password"
                        type="password"
                        value={formik.values.Password}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={!!(formik.touched.Password && formik.errors.Password)}
                        helperText={formik.touched.Password && formik.errors.Password}
                      />
                      <TextField
                        fullWidth
                        required
                        label="Confirm Password"
                        name="ConfirmPassword"
                        type="password"
                        value={formik.values.ConfirmPassword}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={!!(formik.touched.ConfirmPassword && formik.errors.ConfirmPassword)}
                        helperText={formik.touched.ConfirmPassword && formik.errors.ConfirmPassword}
                      />
                    </>
                  )}

                  <TextField
                    select
                    fullWidth
                    required
                    label="User Type"
                    name="UserType"
                    value={formik.values.UserType}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={isSelf}
                    helperText={
                      isSelf
                        ? 'You cannot change your own user type'
                        : formik.touched.UserType && (formik.errors.UserType as string)
                    }
                    error={!!(formik.touched.UserType && formik.errors.UserType)}
                  >
                    <MenuItem value="Normal">Normal</MenuItem>
                    <MenuItem value="Admin">Admin</MenuItem>
                  </TextField>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={formik.values.IsActive}
                        name="IsActive"
                        onChange={formik.handleChange}
                      />
                    }
                    label="Active"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={formik.values.IsAccountLocked}
                        name="IsAccountLocked"
                        onChange={formik.handleChange}
                        disabled={isSelf}
                      />
                    }
                    label={isSelf ? 'Account Locked (cannot lock your own account)' : 'Account Locked'}
                  />
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {formik.values.UserType === 'Normal' && (
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6">Module Permissions</Typography>
                <Typography
                  color="text.secondary"
                  variant="body2"
                >
                  Controls which screens this user can see and what they can do on each. Admins
                  always have full access, so this only applies to Normal users.
                </Typography>
                <Divider />
                <PermissionsMatrix
                  value={formik.values.Permissions ?? []}
                  onChange={(permissions) => formik.setFieldValue('Permissions', permissions)}
                  reportTypes={formik.values.ReportTypes ?? []}
                  onReportTypesChange={(reportTypes) =>
                    formik.setFieldValue('ReportTypes', reportTypes)
                  }
                />
              </Stack>
            </CardContent>
          </Card>
        )}

        <Stack
          alignItems="center"
          direction="row"
          justifyContent="flex-end"
          spacing={1}
        >
          <Button
            color="inherit"
            onClick={() => router.push(paths.admin.users.index)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={formik.isSubmitting}
          >
            {mode === 'edit' ? 'Update' : 'Create'}
          </Button>
        </Stack>
      </Stack>
    </form>
  );
};
