import { ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CarCard } from '../src/components/CarCard';
import { theme } from '../src/theme/theme';
import type { SearchCar } from '../src/types/api';

const car: SearchCar = {
  slug: 'suzuki-ertiga',
  name: 'Suzuki Ertiga',
  description: null,
  category: 'Full Size',
  categorySlug: 'full-size',
  imageUrl: '/cars/full-size.svg',
  transmission: 'Automatic',
  fuelType: 'Petrol',
  passengers: 7,
  doors: 5,
  luggage: 3,
  airConditioning: true,
  securityDeposit: null,
  rentalDays: 5,
  dailyRate: 43,
  subTotal: 215,
  additionalCharges: 15,
  total: 230,
  currency: 'EUR',
  charges: [
    { type: 'Rental', description: 'Car rental: 5 days × €43.00', quantity: 5, amount: 215 },
    { type: 'Delivery', description: 'Delivery: Hotel Delivery – North', quantity: 1, amount: 15 },
  ],
  fleetAvailable: true,
  rating: null,
  badges: [],
};

describe('CarCard', () => {
  it('shows the vehicle details, the daily rate, the total and the additional charges', () => {
    render(
      <ThemeProvider theme={theme}>
        <CarCard car={car} onSelect={() => undefined} />
      </ThemeProvider>,
    );
    expect(screen.getByRole('heading', { name: 'Suzuki Ertiga' })).toBeInTheDocument();
    for (const text of ['Automatic', '7 seats', '5 doors', '3 bags', 'Air con', 'Petrol', 'Unlimited mileage', '€43 / day', '€230.00']) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
    expect(screen.getByText(/Total for 5 days, incl\. delivery: hotel delivery – north/)).toBeInTheDocument();
  });

  it('shows the star rating, badges and labels demo ratings', () => {
    render(
      <ThemeProvider theme={theme}>
        <CarCard car={{ ...car, rating: { average: 4.3, count: 163, sample: true }, badges: ['MostRented', 'MostLiked'] }} onSelect={() => undefined} />
      </ThemeProvider>,
    );
    expect(screen.getByRole('img', { name: 'Rated 4.3 out of 5 from 163 ratings' })).toBeInTheDocument();
    expect(screen.getByText('(163 ratings)')).toBeInTheDocument();
    expect(screen.getByText('Most rented')).toBeInTheDocument();
    expect(screen.getByText('Most liked')).toBeInTheDocument();
    expect(screen.getByText('Demo ratings')).toBeInTheDocument();
  });

  it('shows no rating or demo label when there are no ratings', () => {
    render(
      <ThemeProvider theme={theme}>
        <CarCard car={car} onSelect={() => undefined} />
      </ThemeProvider>,
    );
    expect(screen.queryByText(/ratings/)).not.toBeInTheDocument();
    expect(screen.queryByText('Demo ratings')).not.toBeInTheDocument();
  });

  it('calls onSelect with the car', async () => {
    const onSelect = vi.fn();
    render(
      <ThemeProvider theme={theme}>
        <CarCard car={car} onSelect={onSelect} />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Select this car' }));
    expect(onSelect).toHaveBeenCalledWith(car);
  });
});
