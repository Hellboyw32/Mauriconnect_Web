export const isMockData = () => {
  const flag = import.meta.env.VITE_API_MOCK_DATA;
  return JSON.parse(flag);
};
