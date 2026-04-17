"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userFilterableFields = exports.userSearchableFields = exports.lawyerSearchableFields = exports.ClientSearchableFields = exports.availabilitiesSearchableFields = exports.excludeField = void 0;
exports.excludeField = ['searchTerm', 'sort', 'fields', 'page', 'limit'];
exports.availabilitiesSearchableFields = ['bookingType', 'month', 'lawyerId.categories', 'lawyerId.specialties'];
exports.ClientSearchableFields = [
    'profileInfo.first_name',
    'profileInfo.last_name',
    'profileInfo.email',
];
exports.lawyerSearchableFields = [
    'profile_Details.first_name',
    'profile_Details.last_name',
    'profile_Details.email',
];
exports.userSearchableFields = ['name', 'email', 'role', 'status'];
exports.userFilterableFields = ['role', 'status'];
