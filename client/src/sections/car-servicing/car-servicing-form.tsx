import type { Car, ServicingFormValues } from '@libs/types';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import { useFormik } from 'formik';
import { useMemo, type FC } from 'react';
import { toast } from 'react-hot-toast';
import { servicingApi } from 'src/api/servicing';
import { useAuth } from 'src/hooks/use-auth';
import { useCars } from 'src/hooks/cars/use-cars';
import { useRouter } from 'src/hooks/use-router';
import { paths } from 'src/paths';
import * as Yup from 'yup';

interface CarServicingFormProps {
  mode?: 'create' | 'edit';
  initialValues?: Partial<ServicingFormValues>;
  servicingId?: number;
  onCreated?: () => void;
}

const defaultInitialValues: ServicingFormValues = {
  CarId: '',
  DateServiced: new Date(),
  MileageServiced: '',
  ServicingFrequency: '',
  Note: '',
  CreatedBy: 'system',
  IsCompleted: true
};

const buildValidationSchema = (cars: Car[]) =>
  Yup.object({
    CarId: Yup.number().required('Car is required'),
    DateServiced: Yup.date()
      .nullable()
      .required('Servicing date is required')
      .max(new Date(), 'Servicing date cannot be in the future'),
    MileageServiced: Yup.number()
      .required('Current servicing mileage is required')
      .integer('Mileage must be a whole number')
      .positive('Mileage must be a positive number')
      .test(
        'not-less-than-current-mileage',
        'Servicing mileage cannot be less than the car\'s current mileage',
        function (value) {
          const car = cars.find((c) => c.CarId === this.parent.CarId);

          if (!car || car.CurrentMileage == null || value == null) {
            return true;
          }

          return value >= car.CurrentMileage;
        }
      ),
    ServicingFrequency: Yup.number()
      .required('Servicing frequency is required')
      .integer('Servicing frequency must be a whole number')
      .positive('Servicing frequency must be a positive number'),
    Note: Yup.string().optional()
  });

const toLocalDateString = (value: Date | null) => (value ? format(value, 'yyyy-MM-dd') : null);

export const CarServicingForm: FC<CarServicingFormProps> = (props) => {
  const { mode = 'create', initialValues, servicingId, onCreated } = props;
  const router = useRouter();
  const { user } = useAuth();
  const { cars } = useCars();

  const validationSchema = useMemo(() => buildValidationSchema(cars), [cars]);

  const formik = useFormik({
    initialValues: { ...defaultInitialValues, ...initialValues },
    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const payload = {
          ...values,
          DateServiced: toLocalDateString(values.DateServiced) as any,
          CreatedBy: user?.email || 'system'
        };

        if (mode === 'edit' && servicingId) {
          await servicingApi.updateServicingRecord({ servicingId, servicing: payload });
          toast.success('Servicing record updated successfully');
        } else {
          await servicingApi.addServicingRecord({ servicing: payload });
          toast.success('Servicing record created successfully');
          resetForm();
        }

        onCreated?.();
        router.push(paths.carServicing.index);
      } catch (error: any) {
        toast.error(error.message || `Failed to ${mode} servicing record`);
      } finally {
        setSubmitting(false);
      }
    }
  });

  const selectedCar = cars.find((c) => c.CarId === formik.values.CarId) ?? null;

  const nextServicingMileage = useMemo(() => {
    const mileage = Number(formik.values.MileageServiced);
    const frequency = Number(formik.values.ServicingFrequency);

    if (!mileage || !frequency || Number.isNaN(mileage) || Number.isNaN(frequency)) {
      return null;
    }

    return mileage + frequency;
  }, [formik.values.MileageServiced, formik.values.ServicingFrequency]);

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
                  <Typography variant="h6">Vehicle</Typography>

                  <Autocomplete
                    options={cars}
                    getOptionLabel={(car) => `${car.CarNumber} - ${car.Model}`}
                    value={selectedCar}
                    onChange={(_, selected) => {
                      formik.setFieldValue('CarId', selected?.CarId ?? '');

                      // Pre-fill from the car's current settings; the agent can still adjust them.
                      if (selected?.CurrentMileage) {
                        formik.setFieldValue('MileageServiced', selected.CurrentMileage);
                      }
                      if (selected?.ServicingFrequency) {
                        formik.setFieldValue('ServicingFrequency', selected.ServicingFrequency);
                      }
                    }}
                    onBlur={() => formik.setFieldTouched('CarId', true)}
                    isOptionEqualToValue={(option, value) => option.CarId === value.CarId}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        required
                        label="Choose Car"
                        error={!!(formik.touched.CarId && formik.errors.CarId)}
                        helperText={
                          (formik.touched.CarId && (formik.errors.CarId as string)) ||
                          'Registration number - Model'
                        }
                      />
                    )}
                  />

                  <TextField
                    fullWidth
                    label="Current Mileage (km)"
                    value={
                      selectedCar?.CurrentMileage != null
                        ? selectedCar.CurrentMileage.toLocaleString()
                        : ''
                    }
                    InputProps={{ readOnly: true }}
                    helperText="The car's current recorded mileage"
                  />
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

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
                  <Typography variant="h6">Servicing Details</Typography>

                  <DatePicker
                    label="Servicing Date"
                    format="dd/MM/yyyy"
                    value={formik.values.DateServiced}
                    maxDate={new Date()}
                    onChange={(value) => formik.setFieldValue('DateServiced', value, true)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        name: 'DateServiced',
                        onBlur: formik.handleBlur,
                        error: !!(formik.touched.DateServiced && formik.errors.DateServiced),
                        helperText:
                          formik.touched.DateServiced && (formik.errors.DateServiced as string),
                        inputProps: { readOnly: true }
                      }
                    }}
                  />

                  <TextField
                    error={!!(formik.touched.MileageServiced && formik.errors.MileageServiced)}
                    fullWidth
                    helperText={
                      (formik.touched.MileageServiced && formik.errors.MileageServiced) ||
                      'The odometer reading at the time of servicing'
                    }
                    label="Current Servicing Mileage (km)"
                    name="MileageServiced"
                    required
                    type="number"
                    inputProps={{ min: 1, step: 1 }}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    value={formik.values.MileageServiced}
                  />

                  <TextField
                    error={!!(formik.touched.ServicingFrequency && formik.errors.ServicingFrequency)}
                    fullWidth
                    helperText={
                      (formik.touched.ServicingFrequency && formik.errors.ServicingFrequency) ||
                      'How often (in km) this vehicle should be serviced'
                    }
                    label="Servicing Frequency (km)"
                    name="ServicingFrequency"
                    required
                    type="number"
                    inputProps={{ min: 1, step: 1 }}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    value={formik.values.ServicingFrequency}
                  />

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!formik.values.IsCompleted}
                        name="IsCompleted"
                        onChange={formik.handleChange}
                      />
                    }
                    label="Please confirm if servicing is done"
                  />
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">Next Service</Typography>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  backgroundColor: 'neutral.100'
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Next Servicing Mileage (automatically calculated)
                </Typography>
                <Typography variant="h5">
                  {nextServicingMileage !== null
                    ? `${nextServicingMileage.toLocaleString()} km`
                    : '—'}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Typography variant="h6">Notes</Typography>
              <TextField
                fullWidth
                label="Parts changed / servicing details"
                name="Note"
                multiline
                rows={4}
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
                value={formik.values.Note}
              />
            </Stack>
          </CardContent>
        </Card>

        <Divider />

        <Stack
          alignItems="center"
          direction="row"
          justifyContent="flex-end"
          spacing={1}
        >
          <Button
            color="inherit"
            onClick={() => router.push(paths.carServicing.index)}
            disabled={formik.isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={formik.isSubmitting}
          >
            {formik.isSubmitting
              ? 'Saving...'
              : mode === 'edit'
                ? 'Update Servicing Record'
                : 'Save Servicing Record'}
          </Button>
        </Stack>
      </Stack>
    </form>
  );
};
