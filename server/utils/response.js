export const buildResponse = (data = {}, message = 'Success') => ({
  message,
  ...data
});
