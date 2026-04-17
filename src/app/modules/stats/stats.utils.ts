import { IPaginationMeta } from './stats.interface';

export const buildDateRangeFilter = (
  startDate?: string,
  endDate?: string,
  fieldName: string = 'createdAt'
): any => {
  const filter: any = {};

  // If no dates provided, default to current year
  if (!startDate && !endDate) {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    filter[fieldName] = {
      $gte: startOfYear,
      $lte: endOfYear,
    };
    return filter;
  }

  // Validate date formats
  if (startDate && isNaN(Date.parse(startDate))) {
    throw new Error('Invalid startDate format. Use ISO 8601 format.');
  }

  if (endDate && isNaN(Date.parse(endDate))) {
    throw new Error('Invalid endDate format. Use ISO 8601 format.');
  }

  // Validate startDate is before endDate
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      throw new Error('startDate must be before endDate');
    }
  }

  // Build filter
  if (startDate || endDate) {
    filter[fieldName] = {};

    if (startDate) {
      filter[fieldName].$gte = new Date(startDate);
    }

    if (endDate) {
      filter[fieldName].$lte = new Date(endDate);
    }
  }

  return filter;
};


export const buildPaginationMeta = (
  total: number,
  page: number = 1,
  limit: number = 10
): IPaginationMeta => {
  // Ensure positive integers
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.max(1, Math.floor(limit));
  const safeTotal = Math.max(0, Math.floor(total));

  const totalPages = Math.ceil(safeTotal / safeLimit);

  return {
    total: safeTotal,
    page: safePage,
    limit: safeLimit,
    totalPages: totalPages,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
  };
};


export const getCurrentYearRange = () => {
  const currentYear = new Date().getFullYear();
  return {
    start: new Date(currentYear, 0, 1),
    end: new Date(currentYear, 11, 31, 23, 59, 59, 999),
  };
};

export const getCurrentMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
};


export const formatMonthString = (year: number, month: number): string => {
  const monthStr = month.toString().padStart(2, '0');
  return `${year}-${monthStr}`;
};
