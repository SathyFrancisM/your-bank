export const calculateFdMaturity = ({ principal, annualRate, tenureMonths, compoundingPerYear = 4 }) => {
  const rate = annualRate / 100;
  const years = tenureMonths / 12;
  const maturityAmount = principal * Math.pow(1 + rate / compoundingPerYear, compoundingPerYear * years);
  return {
    maturityAmount: Number(maturityAmount.toFixed(2)),
    maturityDate: new Date(Date.now() + tenureMonths * 30 * 24 * 60 * 60 * 1000).toISOString(),
    lockPeriodMonths: Math.max(3, Math.min(tenureMonths, 12))
  };
};

export const calculateRdMaturity = ({ monthlyDeposit, annualRate, tenureMonths }) => {
  const rate = annualRate / 100;
  const months = tenureMonths;
  const maturityAmount = monthlyDeposit * months + monthlyDeposit * rate * (months / 12) * (months + 1) / 2;
  return {
    maturityAmount: Number(maturityAmount.toFixed(2)),
    maturityDate: new Date(Date.now() + tenureMonths * 30 * 24 * 60 * 60 * 1000).toISOString()
  };
};

export const calculateEmi = ({ principal, annualRate, tenureMonths }) => {
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate === 0) {
    return Number((principal / tenureMonths).toFixed(2));
  }
  const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Number(emi.toFixed(2));
};
