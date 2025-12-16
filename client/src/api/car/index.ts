import type { Car, Cars, CarFormValues, CarFilters, TopRentedCars } from '@libs/types';
import { API_ENDPOINTS } from '@libs/constants';
import { cars as mockCars } from 'src/mock/car';
import { api } from 'src/services/api.service';

const useMock = false;

type GetCarsRequest = {
  filters?: CarFilters;
};

type GetCarsResponse = Promise<Cars>;

type GetCarRequest = {
  carId: number;
};

type GetCarResponse = Promise<Car>;

type CreateCarRequest = {
  car: CarFormValues;
};

type CreateCarResponse = Promise<{ success: boolean; message?: string }>;

type UpdateCarRequest = {
  carId: number;
  car: CarFormValues;
};

type UpdateCarResponse = Promise<{ success: boolean; message?: string }>;

type DeleteCarRequest = {
  carId: number;
  createdBy?: string;
};

type DeleteCarResponse = Promise<{ success: boolean; message?: string }>;

class CarsApi {
  async getCars(request: GetCarsRequest = {}): GetCarsResponse {
    if (useMock) {
      return Promise.resolve(mockCars);
    }

    const { filters } = request;
    const params = new URLSearchParams();

    if (filters?.carNumber) {
      params.append('carNumber', filters.carNumber);
    }
    if (filters?.categoryId) {
      params.append('categoryId', filters.categoryId.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `${API_ENDPOINTS.CARS}?${queryString}` : API_ENDPOINTS.CARS;

    const response = await api.get(url);
    const data = response.data;

    // Ensure we always return an array
    return Array.isArray(data) ? data : [];
  }

  async getCar(request: GetCarRequest): GetCarResponse {
    const { carId } = request;

    if (useMock) {
      const car = mockCars.find((c) => c.CarId === carId);
      if (!car) {
        throw new Error('Car not found');
      }
      return Promise.resolve(car);
    }

    const response = await api.get(`${API_ENDPOINTS.CARS}/${carId}`);
    return response.data;
  }

  async createCar(request: CreateCarRequest): CreateCarResponse {
    const { car } = request;

    if (useMock) {
      return Promise.resolve({ success: true, message: 'Car created successfully' });
    }

    const response = await api.post(API_ENDPOINTS.CARS, car);
    return {
      success: response.status === 200 || response.status === 201,
      message: response.message
    };
  }

  async updateCar(request: UpdateCarRequest): UpdateCarResponse {
    const { carId, car } = request;

    if (useMock) {
      return Promise.resolve({ success: true, message: 'Car updated successfully' });
    }

    const response = await api.put(`${API_ENDPOINTS.CARS}/${carId}`, car);
    return {
      success: response.status === 200,
      message: response.message
    };
  }

  async deleteCar(request: DeleteCarRequest): DeleteCarResponse {
    const { carId, createdBy = 'system' } = request;

    if (useMock) {
      return Promise.resolve({ success: true, message: 'Car deleted successfully' });
    }

    const response = await api.delete(`${API_ENDPOINTS.CARS}/${carId}`);
    return {
      success: response.status === 200,
      message: response.message
    };
  }

  async getTopRentedCars(topCount: number = 8): Promise<TopRentedCars> {
    if (useMock) {
      return Promise.resolve([]);
    }

    const response = await api.get(
      `${API_ENDPOINTS.CARS}/analytics/top-rented?topCount=${topCount}`
    );

    // The data might be nested in response.data.data or just response.data
    const data = response.data;

    console.log('Top Rented Cars API Response:', response);
    console.log('Top Rented Cars Data:', data);

    // Ensure we always return an array
    return Array.isArray(data) ? data : [];
  }

  async getCarCategoryDistribution(): Promise<{ Category: string; TotalCars: number }[]> {
    if (useMock) {
      return Promise.resolve([
        { Category: 'Mini', TotalCars: 5 },
        { Category: 'Economy', TotalCars: 10 },
        { Category: 'Intermediate', TotalCars: 8 },
        { Category: 'Fullsize', TotalCars: 6 }
      ]);
    }

    const response = await api.get(`${API_ENDPOINTS.CARS}/analytics/category-distribution`);

    const data = response.data;
    return Array.isArray(data) ? data : [];
  }
}

export const carsApi = new CarsApi();
