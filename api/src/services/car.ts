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

// The deployed spGetAllCarDetailsJson/spGetSingleCarDetailsJson procedures return CarCategory
// as an escaped JSON string instead of a nested JSON object (unlike the RoadTax/CarInsurance/
// FitnessCertificate procedures, which embed their nested Car object correctly) — normalize it
// here so callers always get a real object.
const normalizeCarCategory = (car: any) => {
  if (car && typeof car.CarCategory === 'string') {
    try {
      car.CarCategory = JSON.parse(car.CarCategory);
    } catch {
      car.CarCategory = null;
    }
  }
  return car;
};

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

    cars = cars.map(normalizeCarCategory);

    return { ...result, data: cars as Cars };
  }

  async getCar(carId: number): Promise<Response<Car>> {
    const storedProcedure = STORED_PROCEDURES.GET_CAR_JSON;
    const inputs = [{ 'CarId': carId }];

    const result = await this.mssqlService.requestByStoredProcedure<Car>(
      storedProcedure,
      inputs,
      false
    );

    // FOR JSON PATH, WITHOUT_ARRAY_WRAPPER + parseJSON:true returns the object as result.data[0]
    const item = Array.isArray(result.data) ? result.data[0] : result.data;

    return { ...result, data: normalizeCarCategory(item) as Car };
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
