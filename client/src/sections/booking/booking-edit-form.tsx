import type { Booking, BookingFormValues } from '@libs/types';
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
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { differenceInDays, format } from 'date-fns';
import { useFormik } from 'formik';
import { useState, type FC } from 'react';
import { toast } from 'react-hot-toast';
import { bookingApi } from 'src/api/booking';
import { RouterLink } from 'src/components/router-link';
import { useAuth } from 'src/hooks/use-auth';
import { useRouter } from 'src/hooks/use-router';
import {
  carAddOns,
  carCategories,
  currencyOptions,
  paymentMethods,
  posMachines
} from 'src/mock/booking';
import { cars } from 'src/mock/car';
import { deliveryUsers } from 'src/mock/delivery-user';
import { paths } from 'src/paths';
import * as Yup from 'yup';

interface BookingEditFormProps {
  booking: Booking;
}

const validationSchema = Yup.object({
  CustomerName: Yup.string().required('Customer name is required'),
  Price: Yup.string().required('Price is required'),
  CarCategory: Yup.string().required('Car category is required')
});

export const BookingEditForm: FC<BookingEditFormProps> = ({ booking }) => {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toLocalDateTimeString = (value: Date | null) =>
    value ? format(value, 'yyyy-MM-dd HH:mm:ss') : null;

  const initialValues: BookingFormValues = {
    car: booking?.Car.CarId ?? '',
    CarCategory: booking?.Car.CarCategory.Category ?? '',
    CarInsurance: booking?.CarInsurance ? new Date(booking?.CarInsurance) : new Date(),
    ContactDetails: booking?.ContactDetails ?? '',
    CurrencyOption: (booking?.Currency as string) ?? currencyOptions[0].value,
    CustomerName: booking?.CustomerName ?? '',
    DeliveryUser: booking?.DeliveryUser ?? '',
    DropOffDate: booking?.DropOffDate ? new Date(booking?.DropOffDate) : new Date(),
    DropOffPlace: booking?.DropOffPlace ?? '',
    FlightNumber: booking?.FlightNumber ?? '',
    FuelLevel: booking?.FuelLevel ?? '',
    Insurance: booking?.InsuranceAmount ?? 0,
    IsBoosterSeat: booking?.IsBoosterSeat ?? false,
    IsCarSeat: booking?.IsCarSeat ?? false,
    IsGps: booking?.IsGps ?? false,
    Mileage: booking?.Mileage ?? 0,
    NoShow: booking?.NoShow ?? false,
    PaymentMethod: (booking?.PaymentMethod as string) ?? paymentMethods[2].value,
    PickUpDate: booking?.PickUpDate ? new Date(booking?.PickUpDate) : new Date(),
    POSMachine: booking?.POSMachine ?? '',
    Price: booking?.Price ?? '',
    ReferenceNo: booking?.ReferenceNo ?? '',
    RoadTax: booking?.RoadTax ? new Date(booking?.RoadTax) : new Date(),
    SimCard: booking?.SimCard ?? 0,
    SpecialRequest: booking?.SpecialRequest ?? ''
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);

        const numberOfDays = differenceInDays(values.DropOffDate, values.PickUpDate);

        const bookingData = {
          CustomerName: values.CustomerName,
          ContactDetails: values.ContactDetails,
          FlightNumber: values.FlightNumber,
          PickUpDate: toLocalDateTimeString(values.PickUpDate),
          DropOffDate: toLocalDateTimeString(values.DropOffDate),
          NumberOfDays: numberOfDays,
          Price: values.Price,
          CarId: values.car,
          SpecialRequest: values.SpecialRequest,
          ReferenceNo: values.ReferenceNo,
          NoShow: values.NoShow,
          Mileage: values.Mileage,
          Insurance: values.Insurance,
          CurrencyOption: values.CurrencyOption,
          PaymentMethod: values.PaymentMethod,
          POSMachine: values.POSMachine,
          IsGps: values.IsGps,
          IsCarSeat: values.IsCarSeat,
          IsBoosterSeat: values.IsBoosterSeat,
          DropOffPlace: values.DropOffPlace,
          DeliveryUser: values.DeliveryUser,
          InsuranceAmount: values.Insurance,
          SimCard: values.SimCard,
          HasInsurance: values.Insurance > 0,
          FuelLevel: values.FuelLevel,
          CarInsurance: values.CarInsurance,
          RoadTax: values.RoadTax,
          LastModifiedUserId: user?.email || 'system'
        };

        const response = await bookingApi.updateBooking({
          bookingId: booking.BookingId,
          booking: bookingData
        });

        toast.success(response.message || 'Booking updated successfully');
        router.push(paths.bookings.index);
      } catch (error: any) {
        console.error('Error updating booking:', error);
        toast.error(error?.message || 'Failed to update booking');
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  const [showAllCarsState, setShowAllCarsState] = useState<boolean>(true);
  const [noShowState, setNoShowState] = useState<boolean>(!showAllCarsState);

  return (
    <>
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
                    <DateTimePicker
                      format="dd/MM/yyyy hh:mm a"
                      label="Pickup Date"
                      onChange={(value) => formik.setFieldValue('PickUpDate', value, true)}
                      value={formik.values.PickUpDate}
                    />
                    <DateTimePicker
                      format="dd/MM/yyyy hh:mm a"
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
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
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
                    <TextField
                      error={!!(formik.touched.SimCard && formik.errors.SimCard)}
                      fullWidth
                      helperText={formik.touched.SimCard && formik.errors.SimCard}
                      label="Sim Card"
                      name="SimCard"
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      value={formik.values.SimCard}
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
                    <TextField
                      error={!!(formik.touched.POSMachine && formik.errors.POSMachine)}
                      fullWidth
                      label="POS Machine"
                      name="POSMachine"
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      select
                      value={formik.values.POSMachine}
                      helperText={formik.touched.POSMachine && formik.errors.POSMachine}
                    >
                      {posMachines.map((posMachine) => (
                        <MenuItem
                          key={posMachine.value}
                          value={posMachine.value}
                        >
                          {posMachine.label}
                        </MenuItem>
                      ))}
                    </TextField>
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
                    <Stack>
                      <div>
                        <FormControlLabel
                          control={<Checkbox checked={noShowState} />}
                          label={<Typography variant="body2">No Show</Typography>}
                          name="noShow"
                          disabled={showAllCarsState}
                          onChange={(event) => {
                            formik.handleChange(event);
                            setNoShowState(!noShowState);
                          }}
                        />
                      </div>
                      <div>
                        <FormControlLabel
                          control={<Checkbox checked={showAllCarsState} />}
                          label={<Typography variant="body2">Show All Cars</Typography>}
                          name="showAllCars"
                          disabled={noShowState}
                          onChange={() => setShowAllCarsState(!showAllCarsState)}
                        />
                      </div>
                    </Stack>
                    <TextField
                      disabled={noShowState}
                      error={!!(formik.touched.car && formik.errors.car)}
                      fullWidth
                      label="Car Requested"
                      name="car"
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      select
                      value={formik.values.car}
                      helperText={formik.touched.car && formik.errors.car}
                    >
                      {cars.map((car) => (
                        <MenuItem
                          key={car.CarId}
                          value={car.CarId}
                        >
                          {car.Model}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      error={!!(formik.touched.Mileage && formik.errors.Mileage)}
                      fullWidth
                      helperText={formik.touched.Mileage && formik.errors.Mileage}
                      label="Car Mileage"
                      name="Mileage"
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      value={formik.values.Mileage}
                    />
                    <TextField
                      error={!!(formik.touched.FuelLevel && formik.errors.FuelLevel)}
                      fullWidth
                      helperText={formik.touched.FuelLevel && formik.errors.FuelLevel}
                      label="Fuel Level"
                      name="FuelLevel"
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      value={formik.values.FuelLevel}
                    />
                    <DatePicker
                      format="dd/MM/yyyy"
                      label="Car Insurance"
                      onChange={(value) => formik.setFieldValue('CarInsurance', value, true)}
                      value={formik.values.CarInsurance}
                    />
                    <DatePicker
                      format="dd/MM/yyyy"
                      label="Road Tax"
                      onChange={(value) => formik.setFieldValue('RoadTax', value, true)}
                      value={formik.values.RoadTax}
                    />
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
                        {carAddOns.map((carAddOn, index) => {
                          const defaultCheckedValue = formik.values[
                            carAddOn.value as keyof BookingFormValues
                          ] as boolean;
                          return (
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
                              checked={defaultCheckedValue}
                              label={<Typography variant="body2">{carAddOn.label}</Typography>}
                            />
                          );
                        })}
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
                      error={!!(formik.touched.DeliveryUser && formik.errors.DeliveryUser)}
                      fullWidth
                      label="Delivered By"
                      name="DeliveryUser"
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      select
                      value={formik.values.DeliveryUser}
                      helperText={formik.touched.DeliveryUser && formik.errors.DeliveryUser}
                    >
                      {deliveryUsers.map((deliveryUser) => (
                        <MenuItem
                          key={deliveryUser.DeliveryUserId}
                          value={deliveryUser.DeliveryUserId}
                        >
                          {deliveryUser.Name}
                        </MenuItem>
                      ))}
                    </TextField>
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
                    <Typography variant="h6">Latest Updates</Typography>
                    {booking?.CreatedBy && (
                      <Stack>
                        <Typography variant="subtitle2">Created by</Typography>
                        <Typography variant="body2">{booking?.CreatedBy}</Typography>
                      </Stack>
                    )}
                    {booking?.LastModifiedUserId && booking?.LastModifiedTimeStamp && (
                      <Stack>
                        <Typography variant="subtitle2">Last modified</Typography>
                        <Typography variant="body2">
                          {booking.LastModifiedUserId} on{' '}
                          {format(new Date(booking.LastModifiedTimeStamp)!, 'dd/MM/yyyy, h:mm a')}
                        </Typography>
                      </Stack>
                    )}
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
              {isSubmitting ? 'Updating...' : 'Update'}
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
