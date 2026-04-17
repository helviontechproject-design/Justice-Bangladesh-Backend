"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedServices = void 0;
const service_model_1 = require("../modules/service/service.model");
const services = [
    { name: 'Separation', price: 199, isFeatured: true },
    { name: 'Divorce', price: 299, isFeatured: true },
    { name: 'Criminal', price: 399, isFeatured: false },
    { name: 'Property', price: 249, isFeatured: true },
    { name: 'Family', price: 199, isFeatured: false },
    { name: 'Business', price: 349, isFeatured: true },
    { name: 'Civil', price: 219, isFeatured: false },
    { name: 'Tax Law', price: 279, isFeatured: false },
];
const seedServices = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const existing = yield service_model_1.ServiceModel.countDocuments();
        if (existing > 0) {
            console.log('Services already seeded!');
            return;
        }
        yield service_model_1.ServiceModel.insertMany(services.map(s => ({
            name: s.name,
            price: s.price,
            isFeatured: s.isFeatured,
            isActive: true,
        })));
        console.log('✅ Services seeded successfully!');
    }
    catch (error) {
        console.log('Error seeding services:', error);
    }
});
exports.seedServices = seedServices;
