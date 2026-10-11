import type { PsvlFormValues } from '@libs/types';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import { useFormik } from 'formik';
import type { FC } from 'react';
import { toast } from 'react-hot-toast';
import { psvlApi } from 'src/api/psvl';
import { useAuth } from 'src/hooks/use-auth';
import { useRouter } from 'src/hooks/use-router';
import * as Yup from 'yup';

interface PsvlFormProps {
  mode?: 'create' | 'edit';
  carId: number;
  psvlId?: number;
  initialValues?: Partial<PsvlFormValues>;
  backHref: string;
}

const validationSchema = Yup.object({
  StartDate: Yup.date().nullable().required('Start date is required'),
  EndDate: Yup.date()
    .nullable()
    .required('End date is required')
    .min(Yup.ref('StartDate'), 'End date must be on or after the start date'),
  Company: Yup.string().max(200, 'Company must be 200 characters or fewer').optional(),
  Note: Yup.string().optional()
});

const toLocalDateString = (value: Date | null) => (value ? format(value, 'yyyy-MM-dd') : null);

// The car is fixed by the route (PSVL is edited from the car's page), and the
// only editable fields are start date, end date, company and notes.
export const PsvlForm: FC<PsvlFormProps> = (props) => {
  const { mode = 'create', carId, psvlId, initialValues, backHref } = props;
  const router = useRouter();
  const { user } = useAuth();

  const formik = useFormik({
    initialValues: {
      CarId: carId,
      StartDate: null as Date | null,
      EndDate: null as Date | null,
      Company: '',
      Note: '',
      ...initialValues
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const payload = {
          ...values,
          CarId: carId,
          StartDate: toLocalDateString(values.StartDate) as any,
          EndDate: toLocalDateString(values.EndDate) as any,
          CreatedBy: user?.username || 'system'
        };

        if (mode === 'edit' && psvlId) {
          await psvlApi.updatePsvl(psvlId, payload);
          toast.success('PSVL updated successfully');
        } else {
          await psvlApi.createPsvl(payload);
          toast.success('PSVL created successfully');
        }

        router.push(backHref);
      } catch (error: any) {
        toast.error(error.message || `Failed to ${mode} PSVL`);
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
            <Stack spacing={3}>
              <Typography variant="h6">PSVL Details</Typography>

              <DatePicker
                label="Start Date"
                format="dd/MM/yyyy"
                value={formik.values.StartDate}
                onChange={(value) => formik.setFieldValue('StartDate', value, true)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    name: 'StartDate',
                    onBlur: formik.handleBlur,
                    error: !!(formik.touched.StartDate && formik.errors.StartDate),
                    helperText: formik.touched.StartDate && (formik.errors.StartDate as string),
                    inputProps: { readOnly: true }
                  }
                }}
              />

              <DatePicker
                label="End Date"
                format="dd/MM/yyyy"
                value={formik.values.EndDate}
                minDate={formik.values.StartDate ?? undefined}
                onChange={(value) => formik.setFieldValue('EndDate', value, true)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    name: 'EndDate',
                    onBlur: formik.handleBlur,
                    error: !!(formik.touched.EndDate && formik.errors.EndDate),
                    helperText: formik.touched.EndDate && (formik.errors.EndDate as string),
                    inputProps: { readOnly: true }
                  }
                }}
              />

              <TextField
                fullWidth
                label="Company"
                name="Company"
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
                value={formik.values.Company}
                error={!!(formik.touched.Company && formik.errors.Company)}
                helperText={formik.touched.Company && formik.errors.Company}
              />

              <TextField
                fullWidth
                label="Notes"
                name="Note"
                multiline
                rows={3}
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
                value={formik.values.Note}
              />
            </Stack>
          </CardContent>
        </Card>

        <Stack
          alignItems="center"
          direction="row"
          justifyContent="flex-end"
          spacing={1}
        >
          <Button
            color="inherit"
            onClick={() => router.push(backHref)}
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
