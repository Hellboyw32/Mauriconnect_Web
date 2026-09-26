import type { RoadTaxFormValues } from '@libs/types';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import { useFormik } from 'formik';
import type { FC } from 'react';
import { toast } from 'react-hot-toast';
import { roadTaxesApi } from 'src/api/road-tax';
import { useAuth } from 'src/hooks/use-auth';
import { useCars } from 'src/hooks/cars/use-cars';
import { useRouter } from 'src/hooks/use-router';
import { paths } from 'src/paths';
import * as Yup from 'yup';

interface RoadTaxFormProps {
  mode?: 'create' | 'edit';
  initialValues?: Partial<RoadTaxFormValues>;
  roadTaxId?: number;
  presetCarId?: number;
  backHref?: string;
}

const defaultInitialValues: RoadTaxFormValues = {
  CarId: '',
  StartDate: null,
  EndDate: null,
  Note: '',
  IsActive: true,
  CreatedBy: 'system'
};

const validationSchema = Yup.object({
  CarId: Yup.number().required('Car is required'),
  StartDate: Yup.date().nullable().required('Start date is required'),
  EndDate: Yup.date()
    .nullable()
    .required('End date is required')
    .min(Yup.ref('StartDate'), 'End date must be on or after the start date'),
  Note: Yup.string().optional()
});

const toLocalDateString = (value: Date | null) => (value ? format(value, 'yyyy-MM-dd') : null);

export const RoadTaxForm: FC<RoadTaxFormProps> = (props) => {
  const { mode = 'create', initialValues, roadTaxId, presetCarId, backHref } = props;
  const router = useRouter();
  const { user } = useAuth();
  const { cars } = useCars();

  const formik = useFormik({
    initialValues: {
      ...defaultInitialValues,
      ...(presetCarId ? { CarId: presetCarId } : {}),
      ...initialValues
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const payload = {
          ...values,
          StartDate: toLocalDateString(values.StartDate) as any,
          EndDate: toLocalDateString(values.EndDate) as any,
          CreatedBy: user?.username || 'system'
        };

        if (mode === 'edit' && roadTaxId) {
          await roadTaxesApi.updateRoadTax({ roadTaxId, roadTax: payload });
          toast.success('Road tax record updated successfully');
        } else {
          await roadTaxesApi.createRoadTax({ roadTax: payload });
          toast.success('Road tax record created successfully');
        }
        router.push(backHref || paths.roadTax.index);
      } catch (error: any) {
        toast.error(error.message || `Failed to ${mode} road tax record`);
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
                  <Typography variant="h6">Road Tax Details</Typography>

                  <Autocomplete
                    disabled={!!presetCarId}
                    options={cars}
                    getOptionLabel={(car) => `${car.Model} - ${car.CarNumber}`}
                    value={cars.find((c) => c.CarId === formik.values.CarId) ?? null}
                    onChange={(_, selected) => {
                      formik.setFieldValue('CarId', selected?.CarId ?? '');
                    }}
                    onBlur={() => formik.setFieldTouched('CarId', true)}
                    isOptionEqualToValue={(option, value) => option.CarId === value.CarId}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        required
                        label="Car"
                        error={!!(formik.touched.CarId && formik.errors.CarId)}
                        helperText={formik.touched.CarId && (formik.errors.CarId as string)}
                      />
                    )}
                  />

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
                    label="Comments"
                    name="Note"
                    multiline
                    rows={3}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    value={formik.values.Note}
                  />

                  {mode === 'edit' && (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formik.values.IsActive}
                          name="IsActive"
                          onChange={formik.handleChange}
                        />
                      }
                      label="Is Active"
                    />
                  )}
                </Stack>
              </Grid>
            </Grid>
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
            onClick={() => router.push(backHref || paths.roadTax.index)}
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
