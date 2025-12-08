import { CarCategoryOptions, type Booking, type FieldOptions } from '@libs/types';

export const bookings: Booking[] = [
  {
    BookingId: 1,
    CustomerName: 'Mr. Minesh Patel',
    PickUpDate: new Date('2025-10-18 06:00:00.000'),
    DropOffDate: new Date('2025-10-25 13:00:00.000'),
    FlightNumber: 'EK709',
    NumberOfDays: 8,
    Car: {
      CarId: 1810,
      CarCategory: {
        CategoryId: CarCategoryOptions.Mini,
        Category: CarCategoryOptions[1]
      },
      Model: 'Toyota Rush',
      CarNumber: '835 JN 20',
      Description: '',
      IsActive: true,
      SortOrder: 1,
      LastModifiedTimeStamp: new Date('2025-01-06 09:39:19.737'),
      LastModifiedUserId: 'mc-soummaya',
      CurrentMileage: 60673,
      ServicingFrequency: 0,
      LastServicedMileage: 0
    },
    SpecialRequest: '+44 7712671000',
    Price: '17280',
    IsActive: true,
    LastModifiedTimeStamp: new Date('2025-10-19 10:11:36.263'),
    LastModifiedUserId: 'mc-soummaya',
    ContactDetails: null,
    ReferenceNo: 'DC-4099750-7DQM',
    uploadId: null,
    CreatedBy: 'admin',
    CreatedOn: new Date('2025-10-13 13:25:23.617'),
    AttachmentPath: null,
    NoShow: null,
    Mileage: 45566,
    Insurance: null,
    Currency: 'MUR',
    PaymentMethod: 'Card',
    IsGps: false,
    IsCarSeat: false,
    IsBoosterSeat: false,
    DropOffPlace: 'c1/c3',
    POSMachine: 'N & N Tours',
    DeliveryUser: '3',
    hasInsurance: true,
    InsuranceAmount: 7000,
    SimCard: null,
    FuelLevel: '3',
    CarInsurance: new Date('2025-01-10 00:00:00.000'),
    RoadTax: new Date('2025-01-10 00:00:00.000'),
    documents: [
      {
        createdAt: new Date(),
        directory: '/2023/06/',
        documentId: '719a07ce8e46dee2388d411c',
        extension: 'pdf',
        name: 'minesh-patel-doc.pdf',
        size: 762152011,
        updatedAt: new Date()
      }
    ]
  },
  {
    BookingId: 2,
    CustomerName: 'Suvir Chatrooghoon',
    PickUpDate: new Date('2023-06-10 20:00:00.000'),
    DropOffDate: new Date('2023-06-15 08:30:00.000'),
    FlightNumber: 'MK852',
    NumberOfDays: 5,
    Car: {
      CarId: 1854,
      CarCategory: {
        CategoryId: CarCategoryOptions.Economy,
        Category: CarCategoryOptions[2]
      },
      Model: 'Suzuki Swift',
      CarNumber: '5084 MY 22',
      Description: '',
      IsActive: true,
      SortOrder: 1,
      LastModifiedTimeStamp: new Date('2025-06-10 08:56:05.307'),
      LastModifiedUserId: 'mc-soummaya',
      CurrentMileage: 22315,
      ServicingFrequency: 0,
      LastServicedMileage: 0
    },
    SpecialRequest: '0834541287',
    Price: 'MUR 5,250.00',
    IsActive: true,
    LastModifiedTimeStamp: new Date('2023-06-21 21:57:02.800'),
    LastModifiedUserId: 'admin',
    ContactDetails: '',
    ReferenceNo: 'ECF5E917',
    uploadId: null,
    CreatedBy: 'admin',
    CreatedOn: new Date('2023-05-31 19:29:18.753'),
    AttachmentPath: null,
    NoShow: false,
    Mileage: 22018,
    Insurance: '',
    Currency: 'MUR',
    PaymentMethod: 'Card',
    IsGps: true,
    IsCarSeat: false,
    IsBoosterSeat: false,
    DropOffPlace: 'c1/c3',
    POSMachine: 'N & N Tours',
    DeliveryUser: '2',
    hasInsurance: false,
    InsuranceAmount: 0,
    SimCard: 0,
    FuelLevel: '3 bar',
    CarInsurance: new Date('2024-05-31 00:00:00.000'),
    RoadTax: new Date('2024-05-31 00:00:00.000'),
    documents: [
      {
        createdAt: new Date(),
        directory: '/2023/06/',
        documentId: 'b3acfe9aa417c1f9e1cda220',
        extension: 'png',
        name: 'suvir-image.png',
        size: 762152011,
        updatedAt: new Date()
      },
      {
        createdAt: new Date(),
        directory: '/2023/06/',
        documentId: 'b3acfe9aa417c1f9e1cda221',
        extension: 'jpg',
        name: 'suvir-image-2.jpg',
        size: 7621011,
        updatedAt: new Date()
      }
    ]
  },
  {
    BookingId: 3,
    CustomerName: 'Eric Gavalet',
    PickUpDate: new Date('2023-06-10 13:30:00.000'),
    DropOffDate: new Date('2023-06-17 10:00:00.000'),
    FlightNumber: 'UU 118',
    NumberOfDays: 7,
    Car: {
      CarId: 1760,
      CarCategory: {
        CategoryId: CarCategoryOptions.Fullsize,
        Category: CarCategoryOptions[4]
      },
      Model: 'Suzuki Presso',
      CarNumber: '7438 SP 21',
      Description: '',
      IsActive: true,
      SortOrder: 1,
      LastModifiedTimeStamp: new Date('2021-10-11 09:45:48.597'),
      LastModifiedUserId: 'mc-soummaya',
      CurrentMileage: 61507,
      ServicingFrequency: 0,
      LastServicedMileage: 0
    },
    SpecialRequest: '262692052239',
    Price: 'MUR 8 400,00',
    IsActive: true,
    LastModifiedTimeStamp: new Date('2023-06-21 21:55:32.380'),
    LastModifiedUserId: 'admin',
    ContactDetails: '',
    ReferenceNo: 'CF138F72',
    uploadId: null,
    CreatedBy: 'admin',
    CreatedOn: new Date('2023-02-26 20:54:10.890'),
    AttachmentPath: null,
    NoShow: false,
    Mileage: 44419,
    Insurance: '',
    Currency: 'MUR',
    PaymentMethod: 'Card',
    IsGps: true,
    IsCarSeat: false,
    IsBoosterSeat: false,
    DropOffPlace: 'c1/c3',
    POSMachine: 'InnHolidays',
    DeliveryUser: '9',
    hasInsurance: false,
    InsuranceAmount: 0,
    SimCard: 0,
    FuelLevel: '7bar',
    CarInsurance: new Date('2021-10-11 00:00:00.000'),
    RoadTax: new Date('2021-10-11 00:00:00.000'),
    documents: [
      {
        createdAt: new Date(),
        directory: '/2023/06/',
        documentId: 'afa0412fe4cdb39b3c8b9ad2',
        extension: 'jpeg',
        name: 'eric-image-in-jpeg.jpeg',
        size: 746826456,
        updatedAt: new Date()
      }
    ]
  },
  {
    BookingId: 4,
    CustomerName: 'Mr. Omer Faruk Atilgan ',
    PickUpDate: new Date('2023-06-10 10:30:00.000'),
    DropOffDate: new Date('2023-06-15 17:00:00.000'),
    FlightNumber: '',
    NumberOfDays: 6,
    Car: {
      CarId: 1847,
      CarCategory: {
        CategoryId: CarCategoryOptions.Economy,
        Category: CarCategoryOptions[2]
      },
      Model: 'Suzuki Swift',
      CarNumber: '2422 MR 22',
      Description: '',
      IsActive: true,
      SortOrder: 1,
      LastModifiedTimeStamp: new Date('2025-03-19 17:16:05.450'),
      LastModifiedUserId: 'mc-soummaya',
      CurrentMileage: 29529,
      ServicingFrequency: 0,
      LastServicedMileage: 0
    },
    SpecialRequest: '+90 5067802264 ',
    Price: '96.00',
    IsActive: true,
    LastModifiedTimeStamp: new Date('2023-06-21 21:54:18.380'),
    LastModifiedUserId: 'admin',
    ContactDetails: '',
    ReferenceNo: 'DC-5439415-CDY9',
    uploadId: null,
    CreatedBy: 'admin',
    CreatedOn: new Date('2023-06-09 12:33:41.417'),
    AttachmentPath: null,
    NoShow: false,
    Mileage: 29529,
    Insurance: '',
    Currency: 'MUR',
    PaymentMethod: 'Cash',
    IsGps: false,
    IsCarSeat: false,
    IsBoosterSeat: false,
    DropOffPlace: 'c1/c3',
    POSMachine: 'InnHolidays',
    DeliveryUser: '8',
    hasInsurance: true,
    InsuranceAmount: 3500,
    SimCard: 0,
    FuelLevel: '1/4',
    CarInsurance: new Date('2025-03-19 00:00:00.000'),
    RoadTax: new Date('2025-03-19 00:00:00.000'),
    documents: [
      {
        createdAt: new Date(),
        directory: '/2023/06/',
        documentId: 'b74e2b767d284d4a94de5e3a',
        extension: 'pdf',
        name: 'omer-faruk-document.pdf',
        size: 54765975,
        updatedAt: new Date()
      }
    ]
  },
  {
    BookingId: 5,
    CustomerName: 'Mr. Sanjoy Ghosh',
    PickUpDate: new Date('2023-06-24 08:00:00.000'),
    DropOffDate: new Date('2023-06-27 15:00:00.000'),
    FlightNumber: 'MK749',
    NumberOfDays: 4,
    Car: {
      CarId: 1510,
      CarCategory: {
        CategoryId: CarCategoryOptions.Economy,
        Category: CarCategoryOptions[2]
      },
      Model: 'Grand I10',
      CarNumber: '2689 MR 20',
      Description: 'mauriconnect',
      IsActive: true,
      SortOrder: 1,
      LastModifiedTimeStamp: new Date('2021-09-21 12:29:27.390'),
      LastModifiedUserId: 'mc-soummaya',
      CurrentMileage: 3749748,
      ServicingFrequency: 6700,
      LastServicedMileage: 23318
    },
    SpecialRequest: '+91 9810002485',
    Price: '60.00',
    IsActive: true,
    LastModifiedTimeStamp: new Date('2023-06-21 21:52:43.177'),
    LastModifiedUserId: 'admin',
    ContactDetails: '',
    ReferenceNo: 'DC-5512920-XPRU ',
    uploadId: null,
    CreatedBy: 'admin',
    CreatedOn: new Date('2023-06-20 08:56:19.840'),
    AttachmentPath: null,
    NoShow: false,
    Mileage: null,
    Insurance: '',
    Currency: 'MUR',
    PaymentMethod: 'AlreadyPaid',
    IsGps: false,
    IsCarSeat: false,
    IsBoosterSeat: false,
    DropOffPlace: '',
    POSMachine: null,
    DeliveryUser: null,
    hasInsurance: null,
    InsuranceAmount: null,
    SimCard: null,
    FuelLevel: null,
    CarInsurance: null,
    RoadTax: null
  },
  {
    BookingId: 6,
    CustomerName: 'Mr. Rafik Derichi',
    PickUpDate: new Date('2023-08-28 18:00:00.000'),
    DropOffDate: new Date('2023-09-05 10:30:00.000'),
    FlightNumber: '',
    NumberOfDays: 8,
    Car: {
      CarId: 79,
      CarCategory: {
        CategoryId: CarCategoryOptions.Economy,
        Category: CarCategoryOptions[2]
      },
      Model: 'Grand i10',
      CarNumber: '7480 AG 17',
      Description: 'mauriconnect',
      IsActive: true,
      SortOrder: 1,
      LastModifiedTimeStamp: new Date('2021-09-21 12:55:08.730'),
      LastModifiedUserId: 'mc-soummaya',
      CurrentMileage: 132427,
      ServicingFrequency: 6700,
      LastServicedMileage: 100956
    },
    SpecialRequest: '+33 650369093 ',
    Price: '160.00',
    IsActive: true,
    LastModifiedTimeStamp: new Date('2023-06-21 10:19:03.547'),
    LastModifiedUserId: 'admin',
    ContactDetails: '',
    ReferenceNo: 'DC-5533940-D8AB ',
    uploadId: null,
    CreatedBy: 'admin',
    CreatedOn: new Date('2023-06-21 10:19:03.547'),
    AttachmentPath: null,
    NoShow: false,
    Mileage: null,
    Insurance: '',
    Currency: 'MUR',
    PaymentMethod: 'AlreadyPaid',
    IsGps: false,
    IsCarSeat: false,
    IsBoosterSeat: false,
    DropOffPlace: '',
    POSMachine: null,
    DeliveryUser: null,
    hasInsurance: null,
    InsuranceAmount: null,
    SimCard: null,
    FuelLevel: null,
    CarInsurance: null,
    RoadTax: null
  },
  {
    BookingId: 7,
    CustomerName: 'Mr. Benjamin Bois',
    PickUpDate: new Date('2023-06-24 09:30:00.000'),
    DropOffDate: new Date('2023-07-01 21:30:00.000'),
    FlightNumber: 'EK0701',
    NumberOfDays: 8,
    Car: {
      CarId: 1931,
      CarCategory: {
        CategoryId: CarCategoryOptions.Mini,
        Category: CarCategoryOptions[1]
      },
      Model: 'Kia',
      CarNumber: '9552 OC 18',
      Description: 'N/A',
      IsActive: false,
      SortOrder: 1,
      LastModifiedTimeStamp: new Date('2020-04-01 15:35:46.857'),
      LastModifiedUserId: 'mc-abhishek',
      CurrentMileage: 31007,
      ServicingFrequency: 7000,
      LastServicedMileage: 0
    },
    SpecialRequest: 'TT 	+961 588152515',
    Price: '320.00',
    IsActive: true,
    LastModifiedTimeStamp: new Date('2023-06-21 08:16:03.870'),
    LastModifiedUserId: 'admin',
    ContactDetails: '',
    ReferenceNo: 'DC-5536573-9TJA',
    uploadId: null,
    CreatedBy: 'admin',
    CreatedOn: new Date('2023-06-21 08:16:03.870'),
    AttachmentPath: null,
    NoShow: false,
    Mileage: null,
    Insurance: '',
    Currency: 'MUR',
    PaymentMethod: 'AlreadyPaid',
    IsGps: false,
    IsCarSeat: false,
    IsBoosterSeat: false,
    DropOffPlace: '',
    POSMachine: null,
    DeliveryUser: null,
    hasInsurance: null,
    InsuranceAmount: null,
    SimCard: null,
    FuelLevel: null,
    CarInsurance: null,
    RoadTax: null
  },
  {
    BookingId: 8,
    CustomerName: 'Mr. Tushar Nagpal',
    PickUpDate: new Date('2023-06-22 15:00:00.000'),
    DropOffDate: new Date('2023-06-27 16:00:00.000'),
    FlightNumber: 'MK745',
    NumberOfDays: 6,
    Car: {
      CarId: 1757,
      CarCategory: {
        CategoryId: CarCategoryOptions.Fullsize,
        Category: CarCategoryOptions[4]
      },
      Model: 'Outsource337',
      CarNumber: 'Outsource337',
      Description: 'Outsource337',
      IsActive: true,
      SortOrder: 1,
      LastModifiedTimeStamp: new Date('2021-10-10 16:23:29.640'),
      LastModifiedUserId: 'admin',
      CurrentMileage: null,
      ServicingFrequency: null,
      LastServicedMileage: null
    },
    SpecialRequest: 'TT	+91 8368082090',
    Price: '200.00',
    IsActive: true,
    LastModifiedTimeStamp: new Date('2023-06-21 10:07:57.003'),
    LastModifiedUserId: 'admin',
    ContactDetails: '',
    ReferenceNo: 'DC-5483429-QC8D',
    uploadId: null,
    CreatedBy: 'admin',
    CreatedOn: new Date('2023-06-14 20:43:31.613'),
    AttachmentPath: null,
    NoShow: false,
    Mileage: 0,
    Insurance: '',
    Currency: 'MUR',
    PaymentMethod: 'AlreadyPaid',
    IsGps: false,
    IsCarSeat: false,
    IsBoosterSeat: false,
    DropOffPlace: 'c1/c3',
    POSMachine: '',
    DeliveryUser: '4',
    hasInsurance: false,
    InsuranceAmount: 0,
    SimCard: 0,
    FuelLevel: '0',
    CarInsurance: new Date('2025-07-19 00:00:00.000'),
    RoadTax: new Date('2025-07-19 00:00:00.000')
  },
  {
    BookingId: 9,
    CustomerName: 'Mr. Pascal Weinholz',
    PickUpDate: new Date('2023-06-19 17:00:00.000'),
    DropOffDate: new Date('2023-06-26 17:00:00.000'),
    FlightNumber: 'EK703',
    NumberOfDays: 7,
    Car: {
      CarId: 2017,
      CarCategory: {
        CategoryId: CarCategoryOptions.Mini,
        Category: CarCategoryOptions[1]
      },
      Model: 'Suzuki Swift',
      CarNumber: '2133 FB 23',
      Description: '',
      IsActive: true,
      SortOrder: 1,
      LastModifiedTimeStamp: new Date('2023-03-05 10:35:18.077'),
      LastModifiedUserId: 'mc-soummaya',
      CurrentMileage: 6512,
      ServicingFrequency: 0,
      LastServicedMileage: 0
    },
    SpecialRequest: '0049 17620009126 ',
    Price: '147.00',
    IsActive: true,
    LastModifiedTimeStamp: new Date('2023-06-20 22:38:31.410'),
    LastModifiedUserId: 'admin',
    ContactDetails: '',
    ReferenceNo: 'DC-5351413-W8B7',
    uploadId: null,
    CreatedBy: 'admin',
    CreatedOn: new Date('2023-05-30 13:33:28.710'),
    AttachmentPath: null,
    NoShow: false,
    Mileage: 6512,
    Insurance: '',
    Currency: 'MUR',
    PaymentMethod: 'Card',
    IsGps: true,
    IsCarSeat: false,
    IsBoosterSeat: false,
    DropOffPlace: 'c1/c3',
    POSMachine: 'Tan & Tej',
    DeliveryUser: '9',
    hasInsurance: false,
    InsuranceAmount: 0,
    SimCard: 0,
    FuelLevel: '9 bar',
    CarInsurance: new Date('2023-03-07 00:00:00.000'),
    RoadTax: new Date('2023-03-07 00:00:00.000')
  }
];

export const currencyOptions: FieldOptions = [
  {
    label: 'Mur',
    value: 'MUR'
  },
  {
    label: 'Eur',
    value: 'EUR'
  }
];

export const paymentMethods: FieldOptions = [
  {
    label: 'Card',
    value: 'Card'
  },
  {
    label: 'Cash',
    value: 'Cash'
  },
  {
    label: 'Already Paid',
    value: 'AlreadyPaid'
  },
  {
    label: 'Paypal',
    value: 'Paypal'
  }
];

export const carCategories: FieldOptions = [
  {
    label: 'Mini Cars',
    value: CarCategoryOptions['Mini']
  },
  {
    label: 'Economy Cars',
    value: CarCategoryOptions['Economy']
  },
  {
    label: 'Intermediate Cars',
    value: CarCategoryOptions['Intermediate']
  },
  {
    label: 'Fullsize Cars',
    value: CarCategoryOptions['Fullsize']
  }
];

export const carAddOns: FieldOptions = [
  {
    label: 'GPS',
    value: 'IsGps'
  },
  {
    label: 'Car Seat',
    value: 'IsCarSeat'
  },
  {
    label: 'Booster Seat',
    value: 'IsBoosterSeat'
  }
];

export const posMachines: FieldOptions = [
  {
    label: 'Tan & Tej',
    value: 'Tan & Tej'
  },
  {
    label: 'N & N Tours',
    value: 'N & N Tours'
  },
  {
    label: 'InnHolidays',
    value: 'InnHolidays'
  },
  {
    label: 'CASA TOURS',
    value: 'CASA TOURS'
  }
];
