export const excludeField = ['searchTerm', 'sort', 'fields', 'page', 'limit'];
export const availabilitiesSearchableFields = ['bookingType', 'month', 'lawyerId.categories', 'lawyerId.specialties'];

export const ClientSearchableFields = [
  'profileInfo.first_name',
  'profileInfo.last_name',
  'profileInfo.email',
];


export const lawyerSearchableFields = [
  'profile_Details.first_name',
  'profile_Details.last_name',
  'profile_Details.email',
];
export const userSearchableFields = ['name', 'email', 'role', 'status'];
export const userFilterableFields = ['role', 'status'];