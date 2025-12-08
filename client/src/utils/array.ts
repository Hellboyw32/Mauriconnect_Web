export const getByValue = (arr: any[], objectKey: any, value: any) => {
  for (const element of arr) {
    if (element[objectKey] === value) return element;
  }
};
