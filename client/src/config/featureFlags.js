export const isGielinorRushEnabled = (user) => {
  return process.env.REACT_APP_GR_ENABLED === true || process.env.REACT_APP_GR_ENABLED === 'true' || user?.admin === true;
};
