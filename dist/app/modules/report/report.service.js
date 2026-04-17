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
exports.reportService = void 0;
const report_model_1 = require("./report.model");
const mongoose_1 = require("mongoose");
const create = (payload) => __awaiter(void 0, void 0, void 0, function* () { return report_model_1.Report.create(payload); });
const getMyReports = (userId) => __awaiter(void 0, void 0, void 0, function* () { return report_model_1.Report.find({ userId: new mongoose_1.Types.ObjectId(userId) }).sort({ createdAt: -1 }); });
const getAll = (status) => __awaiter(void 0, void 0, void 0, function* () {
    const filter = {};
    if (status)
        filter.status = status;
    return report_model_1.Report.find(filter)
        .populate('userId', 'email phoneNo profilePhoto role')
        .sort({ createdAt: -1 });
});
const reply = (id, adminReply) => __awaiter(void 0, void 0, void 0, function* () {
    return report_model_1.Report.findByIdAndUpdate(id, { adminReply, status: 'resolved', repliedAt: new Date() }, { new: true }).populate('userId', 'email phoneNo profilePhoto role fcmTokens');
});
exports.reportService = { create, getMyReports, getAll, reply };
