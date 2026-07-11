import { CAR_STORED_PROCEDURES as STORED_PROCEDURES } from '@/constants';
import type { Response } from '@/types';
import type { Car, Cars, CarFormValues, TopRentedCars } from '@libs/types';
import { Inject, Service } from 'typedi';
import { BaseMSSqlService } from '../base/base-mssql';

export interface ICarService {
  getCars(carNumber?: string, categoryId?: number): Promise<Response<Cars>>;
  getCar(carId: number): Promise<Response<Car>>;
  createCar(car: CarFormValues): Promise<Response>;
  updateCar(carId: number, car: CarFormValues): Promise<Response>;
  deleteCar(carId: number, createdBy: string): Promise<Response>;
  getTopRentedCars(topCount?: number): Promise<Response<TopRentedCars>>;
}

@Service()
export class CarService implements ICarService {
  @Inject()
  private readonly mssqlService: BaseMSSqlService;

  async getCars(carNumber?: string, categoryId?: number): Promise<Response<Cars>> {
    const storedProcedure = STORED_PROCEDURES.GET_CARS_JSON;

    const result = await this.mssqlService.requestByStoredProcedure<Cars>(storedProcedure, [], false);

    let cars: any[] = [];

    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
      // FOR JSON PATH + parseJSON:true returns the entire cars array as result.data[0]
      if (Array.isArray(result.data[0])) {
        cars = result.data[0];
      } else {
        cars = result.data;
      }
    }

    if (categoryId) {
      cars = cars.filter((car) => {
        if (car.CategoryId === categoryId) return true;
        if (!car.CarCategory) return false;
        if (typeof car.CarCategory === 'object') return car.CarCategory.CategoryId === categoryId;
        if (typeof car.CarCategory === 'string') {
          try { return JSON.parse(car.CarCategory).CategoryId === categoryId; } catch { return false; }
        }
        return false;
      });
    }

    if (carNumber) {
      cars = cars.filter((car) =>
        car.CarNumber?.toLowerCase().includes(carNumber.toLowerCase())
      );
    }

    return { ...result, data: cars as Cars };
  }

  async getCar(carId: number): Promise<Response<Car>> {
    const storedProcedure = STORED_PROCEDURES.GET_CAR_JSON;
    const inputs = [{ 'CarId': carId }];

    return await this.mssqlService.requestByStoredProcedure<Car>(storedProcedure, inputs, false);
  }

  async createCar(car: CarFormValues): Promise<Response> {
    const storedProcedure = STORED_PROCEDURES.UPDATE_CAR;
    const inputs = [
      {
        'CarModel': car.Model,
        'CategoryId': car.CategoryId,
        'CarNumber': car.CarNumber,
        'CarDescription': car.Description,
        'CurrentMileage': car.CurrentMileage,
        'ServicingFrequency': car.ServicingFrequency,
        'LastServicedMileage': car.LastServicedMileage,
        'Login': car.CreatedBy || 'system',
        'Action': 'Add',
        'CarId': 0,
        'IsActive': true
      }
    ];

    return await this.mssqlService.requestByStoredProcedure(storedProcedure, inputs);
  }

  async updateCar(carId: number, car: CarFormValues): Promise<Response> {
    const storedProcedure = STORED_PROCEDURES.UPDATE_CAR;
    const inputs = [
      {
        'CarModel': car.Model,
        'CategoryId': car.CategoryId,
        'CarNumber': car.CarNumber,
        'CarDescription': car.Description,
        'CurrentMileage': car.CurrentMileage,
        'ServicingFrequency': car.ServicingFrequency,
        'LastServicedMileage': car.LastServicedMileage,
        'Login': car.CreatedBy || 'system',
        'Action': 'Update',
        'CarId': carId,
        'IsActive': car.IsActive
      }
    ];

    return await this.mssqlService.requestByStoredProcedure(storedProcedure, inputs);
  }

  async deleteCar(carId: number, createdBy: string): Promise<Response> {
    const storedProcedure = STORED_PROCEDURES.UPDATE_CAR;
    const inputs = [
      {
        'CarModel': '',
        'CategoryId': 0,
        'CarNumber': '',
        'CarDescription': '',
        'CurrentMileage': 0,
        'ServicingFrequency': 0,
        'LastServicedMileage': 0,
        'Login': createdBy,
        'Action': 'Update',
        'CarId': carId,
        'IsActive': false
      }
    ];

    return await this.mssqlService.requestByStoredProcedure(storedProcedure, inputs);
  }

  async getTopRentedCars(topCount: number = 8): Promise<Response<TopRentedCars>> {
    const storedProcedure = STORED_PROCEDURES.GET_TOP_RENTED_CARS;
    const inputs = [{ 'TopCount': topCount }];

    return await this.mssqlService.requestByStoredProcedure<TopRentedCars>(
      storedProcedure,
      inputs,
      false
    );
  }

  async getCarCategoryDistribution(): Promise<Response> {
    const storedProcedure = STORED_PROCEDURES.GET_CAR_CATEGORY_DISTRIBUTION;
    return await this.mssqlService.requestByStoredProcedure(storedProcedure);
  }
}
