export const generateRefNumber = () => {
  const randomNumber = Math.floor(Math.random() * (99999999 - 999999 + 1)) + 999999;
  const mcPrefix = 'MC';

  return `${mcPrefix}${randomNumber}`;
};
