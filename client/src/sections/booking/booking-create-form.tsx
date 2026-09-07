import type { BookingFormValues } from '@libs/types';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormLabel from '@mui/material/FormLabel';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { differenceInDays, format } from 'date-fns';
import { useFormik } from 'formik';
import type { ChangeEvent, FC } from 'react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { bookingApi } from 'src/api/booking';
import { DateTimePickerSideBySide } from 'src/components/date-time-picker-side-by-side';
import { RouterLink } from 'src/components/router-link';
import { useAuth } from 'src/hooks/use-auth';
import { useRouter } from 'src/hooks/use-router';
import { carAddOns, carCategories, currencyOptions, paymentMethods } from 'src/mock/booking';
import { paths } from 'src/paths';
import { generateRefNumber } from 'src/utils/generate-ref-number';
import * as Yup from 'yup';

const initialValues: BookingFormValues = {
  CustomerName: '',
  ReferenceNo: '',
  ContactDetails: '',
  FlightNumber: '',
  PickUpDate: new Date(),
  DropOffDate: new Date(),
  CurrencyOption: currencyOptions[0].value as string,
  Price: '',
  Insurance: 0,
  PaymentMethod: paymentMethods[2].value as string,
  CarCategory: '',
  SpecialRequest: '',
  DropOffPlace: '',
  PickupLocation: '',
  IsGps: false,
  IsCarSeat: false,
  IsBoosterSeat: false
};

const validationSchema = Yup.object({
  CustomerName: Yup.string().required('Customer name is required'),
  Price: Yup.string()
    .required('Price is required')
    .matches(/^\d+(\.\d+)?$/, 'Price must be a number (no letters or commas)'),
  CarCategory: Yup.string().required('Car category is required')
});

export const BookingCreateForm: FC = (props) => {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toLocalDateTimeString = (value: Date | null) =>
    value ? format(value, 'yyyy-MM-dd HH:mm:ss') : null;

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);

        // Calculate number of days
        const numberOfDays = differenceInDays(values.DropOffDate, values.PickUpDate);

        // Prepare booking data
        const bookingData = {
          CustomerName: values.CustomerName,
          ContactDetails: values.ContactDetails,
          FlightNumber: values.FlightNumber,
          PickUpDate: toLocalDateTimeString(values.PickUpDate),
          DropOffDate: toLocalDateTimeString(values.DropOffDate),
          NumberOfDays: numberOfDays,
          Price: values.Price,
          CarCategory: values.CarCategory,
          SpecialRequest: values.SpecialRequest,
          ReferenceNo: values.ReferenceNo,
          Insurance: values.Insurance,
          CurrencyOption: values.CurrencyOption,
          PaymentMethod: values.PaymentMethod,
          IsGps: values.IsGps,
          IsCarSeat: values.IsCarSeat,
          IsBoosterSeat: values.IsBoosterSeat,
          DropOffPlace: values.DropOffPlace,
          PickupLocation: values.PickupLocation,
          CreatedBy: user?.email || 'system'
        };

        const response = await bookingApi.createBooking({ booking: bookingData });

        toast.success(response.message || 'Booking created successfully');
        router.push(paths.bookings.index);
      } catch (error: any) {
        console.error('Error creating booking:', error);
        toast.error(error?.message || 'Failed to create booking');
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  const handleGenerateRefNumber = () => {
    const generatedRefNumber = generateRefNumber();
    formik.setFieldValue('ReferenceNo', generatedRefNumber);
  };

  // Only allow digits and a single decimal point (no letters, no commas)
  const handlePriceChange = (event: ChangeEvent<HTMLInputElement>): void => {
    if (/^\d*\.?\d*$/.test(event.target.value)) {
      formik.handleChange(event);
    }
  };

  return (
    <>
      <form
        onSubmit={formik.handleSubmit}
        {...props}
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
                    <Typography variant="h6">Customer details</Typography>
                    <TextField
                      error={!!(formik.touched.CustomerName && formik.errors.CustomerName)}
                      fullWidth
                      helperText={formik.touched.CustomerName && formik.errors.CustomerName}
                      required
                      label="Customer Name"
                      name="CustomerName"
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      value={formik.values.CustomerName}
                    />
                    <Stack
                      spacing={3}
                      direction="row"
                    >
                      <TextField
                        error={!!(formik.touched.ReferenceNo && formik.errors.ReferenceNo)}
                        fullWidth
                        helperText={formik.touched.ReferenceNo && formik.errors.ReferenceNo}
                        label="Reference Number"
                        name="ReferenceNo"
                        onBlur={formik.handleBlur}
                        onChange={formik.handleChange}
                        value={formik.values.ReferenceNo}
                      />
                      <Button
                        variant="contained"
                        onClick={handleGenerateRefNumber}
                      >
                        Generate
                      </Button>
                    </Stack>
                    <TextField
                      error={!!(formik.touched.ContactDetails && formik.errors.ContactDetails)}
                      fullWidth
                      helperText={formik.touched.ContactDetails && formik.errors.ContactDetails}
                      label="Contact"
                      name="ContactDetails"
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      value={formik.values.ContactDetails}
                    />
                    <TextField
                      error={!!(formik.touched.FlightNumber && formik.errors.FlightNumber)}
                      fullWidth
                      helperText={formik.touched.FlightNumber && formik.errors.FlightNumber}
                      label="Flight Number"
                      name="FlightNumber"
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      value={formik.values.FlightNumber}
                    />
                    <DateTimePickerSideBySide
                      label="Pickup Date"
                      onChange={(value) => formik.setFieldValue('PickUpDate', value, true)}
                      value={formik.values.PickUpDate}
                    />
                    <DateTimePickerSideBySide
                      label="Dropoff Date"
                      onChange={(value) => formik.setFieldValue('DropOffDate', value, true)}
                      value={formik.values.DropOffDate}
                    />

                    <FormControl>
                      <FormLabel>Currency</FormLabel>
                      <RadioGroup
                        sx={{ flexDirection: 'row' }}
                        name="CurrencyOption"
                        defaultValue="mur"
                        onChange={formik.handleChange}
                        value={formik.values.CurrencyOption}
                      >
                        {currencyOptions.map((currencyOption) => (
                          <FormControlLabel
                            control={<Radio />}
                            key={currencyOption.value}
                            label={<Typography variant="body2">{currencyOption.label}</Typography>}
                            value={currencyOption.value}
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <TextField
                      error={!!(formik.touched.Price && formik.errors.Price)}
                      fullWidth
                      helperText={formik.touched.Price && formik.errors.Price}
                      label="Price"
                      name="Price"
                      required
                      inputMode="decimal"
                      onBlur={formik.handleBlur}
                      onChange={handlePriceChange}
                      value={formik.values.Price}
                    />
                    <TextField
                      error={!!(formik.touched.Insurance && formik.errors.Insurance)}
                      fullWidth
                      helperText={formik.touched.Insurance && formik.errors.Insurance}
                      label="Insurance"
                      name="Insurance"
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      value={formik.values.Insurance}
                    />
                    <FormControl>
                      <FormLabel>Payment Method</FormLabel>
                      <RadioGroup
                        sx={{ flexDirection: 'row' }}
                        name="PaymentMethod"
                        defaultValue="AlreadyPaid"
                        onChange={formik.handleChange}
                        value={formik.values.PaymentMethod}
                      >
                        {paymentMethods.map((paymentMethod) => (
                          <FormControlLabel
                            control={<Radio />}
                            key={paymentMethod.value}
                            label={<Typography variant="body2">{paymentMethod.label}</Typography>}
                            value={paymentMethod.value}
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
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
                    <Typography variant="h6">Booking / Car Details</Typography>
                    <TextField
                      error={!!(formik.touched.CarCategory && formik.errors.CarCategory)}
                      fullWidth
                      label="Car Category"
                      name="CarCategory"
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      select
                      required
                      value={formik.values.CarCategory}
                      helperText={formik.touched.CarCategory && formik.errors.CarCategory}
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
                    <FormControl
                      sx={{ m: 3 }}
                      component="fieldset"
                      variant="standard"
                    >
                      <FormLabel component="legend">Add Ons</FormLabel>
                      <FormGroup
                        sx={{
                          flexDirection: 'row'
                        }}
                      >
                        {carAddOns.map((carAddOn, index) => (
                          <FormControlLabel
                            key={index}
                            control={
                              <Checkbox
                                name={carAddOn.value as string}
                                value={carAddOn.value}
                                onChange={(event) => {
                                  formik.setFieldValue(
                                    carAddOn.value as string,
                                    event.target.checked
                                  );
                                }}
                              />
                            }
                            label={<Typography variant="body2">{carAddOn.label}</Typography>}
                          />
                        ))}
                      </FormGroup>
                    </FormControl>
                    <TextField
                      error={!!(formik.touched.SpecialRequest && formik.errors.SpecialRequest)}
                      fullWidth
                      helperText={formik.touched.SpecialRequest && formik.errors.SpecialRequest}
                      label="Special Request"
                      name="SpecialRequest"
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      value={formik.values.SpecialRequest}
                      multiline
                      rows={3}
                    />
                    <TextField
                      error={!!(formik.touched.DropOffPlace && formik.errors.DropOffPlace)}
                      fullWidth
                      helperText={formik.touched.DropOffPlace && formik.errors.DropOffPlace}
                      label="Drop Off Place"
                      name="DropOffPlace"
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      value={formik.values.DropOffPlace}
                    />
                    <TextField
                      error={!!(formik.touched.PickupLocation && formik.errors.PickupLocation)}
                      fullWidth
                      helperText={formik.touched.PickupLocation && formik.errors.PickupLocation}
                      label="Pickup Location"
                      name="PickupLocation"
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      value={formik.values.PickupLocation}
                    />
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          <Stack
            alignItems="center"
            direction="row"
            spacing={1}
          >
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
            <Button
              color="inherit"
              component={RouterLink}
              href={paths.bookings.index}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </Stack>
        </Stack>
      </form>
    </>
  );
};
