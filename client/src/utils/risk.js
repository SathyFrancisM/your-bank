export const riskBand = (score) => {
  if (score > 60) return { label: 'High Risk', tone: 'danger' };
  if (score >= 30) return { label: 'Medium', tone: 'warning' };
  return { label: 'Safe', tone: 'success' };
};
