let visitCount = 0;

const incrementVisit = () => {
  visitCount++;
  return visitCount;
};

const getVisitCount = () => {
  return visitCount;
};

module.exports = { incrementVisit, getVisitCount };
