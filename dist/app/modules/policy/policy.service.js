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
exports.policyService = void 0;
const policy_model_1 = require("./policy.model");
const get = (type, role) => __awaiter(void 0, void 0, void 0, function* () {
    let doc = yield policy_model_1.Policy.findOne({ type, role });
    if (!doc)
        doc = yield policy_model_1.Policy.create({ type, role, content: '' });
    return doc;
});
const getAll = (role) => __awaiter(void 0, void 0, void 0, function* () {
    const filter = {};
    if (role)
        filter.role = role;
    return policy_model_1.Policy.find(filter);
});
const upsert = (type, role, content) => __awaiter(void 0, void 0, void 0, function* () { return policy_model_1.Policy.findOneAndUpdate({ type, role }, { content }, { upsert: true, new: true }); });
exports.policyService = { get, getAll, upsert };
