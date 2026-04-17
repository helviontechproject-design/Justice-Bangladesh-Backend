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
exports.faqService = void 0;
const faq_model_1 = require("./faq.model");
const getAll = (role) => __awaiter(void 0, void 0, void 0, function* () {
    const filter = { isActive: true };
    if (role)
        filter.role = role;
    return faq_model_1.Faq.find(filter).sort({ order: 1, createdAt: 1 });
});
const getAllAdmin = (role) => __awaiter(void 0, void 0, void 0, function* () {
    const filter = {};
    if (role)
        filter.role = role;
    return faq_model_1.Faq.find(filter).sort({ order: 1, createdAt: 1 });
});
const create = (payload) => __awaiter(void 0, void 0, void 0, function* () { return faq_model_1.Faq.create(payload); });
const update = (id, payload) => __awaiter(void 0, void 0, void 0, function* () { return faq_model_1.Faq.findByIdAndUpdate(id, payload, { new: true }); });
const remove = (id) => __awaiter(void 0, void 0, void 0, function* () { return faq_model_1.Faq.findByIdAndDelete(id); });
exports.faqService = { getAll, getAllAdmin, create, update, remove };
