export const isMockData = () => {
  const flag = import.meta.env.VITE_API_MOCK_DATA;
  if (flag === undefined || flag === '') return false;
  return JSON.parse(flag);
};
