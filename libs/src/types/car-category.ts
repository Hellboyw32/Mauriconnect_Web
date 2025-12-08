export interface CarCategory {
  CategoryId: number;
  Category: string;
  Description?: string | null;
  SortOrder?: number | null;
  IsActive?: boolean | null;
}

export type CarCategories = CarCategory[];

export enum CarCategoryOptions {
  Mini = 1,
  Economy = 2,
  Intermediate = 3,
  Fullsize = 4
}
