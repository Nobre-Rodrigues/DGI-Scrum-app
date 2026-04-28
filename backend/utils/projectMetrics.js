const roundToTwo = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const calculatePercentage = (completed, total) => {
  if (!total) {
    return 0;
  }

  return roundToTwo((completed / total) * 100);
};

const calculateProgressDelta = (currentPercentage, previousPercentage) => roundToTwo(currentPercentage - previousPercentage);

const getTrendStatus = (delta) => {
  if (delta > 0) {
    return 'positive';
  }

  if (delta < 0) {
    return 'negative';
  }

  return 'neutral';
};

const getLoadStatus = (occupationPercentage) => {
  if (occupationPercentage > 100) {
    return 'sobrecarregado';
  }

  if (occupationPercentage >= 70) {
    return 'equilibrado';
  }

  return 'disponível';
};

module.exports = {
  calculatePercentage,
  calculateProgressDelta,
  getTrendStatus,
  getLoadStatus,
};

