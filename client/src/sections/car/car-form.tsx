import type { CarFormValues } from '@libs/types';
import { CarCategoryOptions } from '@libs/types';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
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
import { useRouter } from 'src/hooks/use-router';
import { paths } from 'src/paths';
import * as Yup from 'yup';
import { carsApi } from 'src/api/car';

interface CarCreateFormProps {
  mode?: 'create' | 'edit';
  initialValues?: Partial<CarFormValues>;
  carId?: number;
}

const defaultInitialValues: CarFormValues = {
  Model: '',
  CategoryId: CarCategoryOptions.Economy,
  CarNumber: '',
  Description: '',
  CurrentMileage: 0,
  ServicingFrequency: 0,
  LastServicedMileage: 0,
  IsActive: true,
  CreatedBy: 'system'
};

const validationSchema = Yup.object({
  Model: Yup.string().required('Model is required'),
  CategoryId: Yup.number().required('Category is required'),
  CarNumber: Yup.string().required('Car number is required'),
  CurrentMileage: Yup.number()
    .min(0, 'Mileage cannot be negative')
    .required('Current mileage is required'),
  ServicingFrequency: Yup.number()
    .min(0, 'Frequency cannot be negative')
    .required('Servicing frequency is required'),
  LastServicedMileage: Yup.number()
    .min(0, 'Mileage cannot be negative')
    .required('Last serviced mileage is required')
});

const carCategories = [
  { value: CarCategoryOptions.Mini, label: 'Mini' },
  { value: CarCategoryOptions.Economy, label: 'Economy' },
  { value: CarCategoryOptions.Intermediate, label: 'Intermediate' },
  { value: CarCategoryOptions.Fullsize, label: 'Fullsize' }
];

export const CarForm: FC<CarCreateFormProps> = (props) => {
  const { mode = 'create', initialValues, carId } = props;
  const router = useRouter();

  const formik = useFormik({
    initialValues: { ...defaultInitialValues, ...initialValues },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        if (mode === 'edit' && carId) {
          await carsApi.updateCar({ carId, car: values });
          toast.success('Car updated successfully');
        } else {
          await carsApi.createCar({ car: values });
          toast.success('Car created successfully');
        }
        router.push(paths.cars.index);
      } catch (error) {
        toast.error(error.message || `Failed to ${mode} car`);
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
                  <Typography variant="h6">Car Details</Typography>

                  <TextField
                    error={!!(formik.touched.Model && formik.errors.Model)}
                    fullWidth
                    helperText={formik.touched.Model && formik.errors.Model}
                    required
                    label="Model"
                    name="Model"
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    value={formik.values.Model}
                  />

                  <TextField
                    error={!!(formik.touched.CategoryId && formik.errors.CategoryId)}
                    fullWidth
                    helperText={formik.touched.CategoryId && formik.errors.CategoryId}
                    required
                    label="Category"
                    name="CategoryId"
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    select
                    value={formik.values.CategoryId}
                  >
                    {carCategories.map((category) => (
                      <MenuItem
                        key={category.value}
                        value={category.value}
                      >
                        {category.label}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    error={!!(formik.touched.CarNumber && formik.errors.CarNumber)}
                    fullWidth
                    helperText={formik.touched.CarNumber && formik.errors.CarNumber}
                    required
                    label="Car Number"
                    name="CarNumber"
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    value={formik.values.CarNumber}
                  />

                  <TextField
                    fullWidth
                    label="Description"
                    name="Description"
                    multiline
                    rows={3}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    value={formik.values.Description}
                  />
                </Stack>
              </Grid>

              <Grid
                xs={12}
                md={12}
              >
                <Stack spacing={3}>
                  <Typography variant="h6">Mileage & Servicing</Typography>

                  <TextField
                    error={!!(formik.touched.CurrentMileage && formik.errors.CurrentMileage)}
                    fullWidth
                    helperText={formik.touched.CurrentMileage && formik.errors.CurrentMileage}
                    required
                    label="Current Mileage"
                    name="CurrentMileage"
                    type="number"
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    value={formik.values.CurrentMileage}
                  />

                  <TextField
                    error={
                      !!(formik.touched.ServicingFrequency && formik.errors.ServicingFrequency)
                    }
                    fullWidth
                    helperText={
                      formik.touched.ServicingFrequency && formik.errors.ServicingFrequency
                    }
                    required
                    label="Servicing Frequency (km)"
                    name="ServicingFrequency"
                    type="number"
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    value={formik.values.ServicingFrequency}
                  />

                  <TextField
                    error={
                      !!(formik.touched.LastServicedMileage && formik.errors.LastServicedMileage)
                    }
                    fullWidth
                    helperText={
                      formik.touched.LastServicedMileage && formik.errors.LastServicedMileage
                    }
                    required
                    label="Last Serviced Mileage"
                    name="LastServicedMileage"
                    type="number"
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    value={formik.values.LastServicedMileage}
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
            onClick={() => router.push(paths.cars.index)}
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
