export const isGielinorRushEnabled = (user) => {
  return (
    process.env.REACT_APP_GR_ENABLED === true ||
    process.env.REACT_APP_GR_ENABLED === 'true' ||
    user?.admin === true
  );
};

export const isBlindDraftEnabled = (user) => {
  return (
    process.env.REACT_APP_DRAFT_ENABLED === true ||
    process.env.REACT_APP_DRAFT_ENABLED === 'true' ||
    user?.admin === true
  );
};

export const isChampionForgeEnabled = (user) => {
  return (
    process.env.REACT_APP_CF_ENABLED === true ||
    process.env.REACT_APP_CF_ENABLED === 'true' ||
    user?.admin === true
  );
};

export const isGroupDashboardEnabled = (user) => {
  return (
    process.env.REACT_APP_GROUP_ENABLED === true ||
    process.env.REACT_APP_GROUP_ENABLED === 'true' ||
    user?.admin === true
  );
};
