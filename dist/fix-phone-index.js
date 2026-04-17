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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Run this script once to fix existing null phoneNo.value documents
 * Command: npx ts-node src/fix-phone-index.ts
 */
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function fix() {
    return __awaiter(this, void 0, void 0, function* () {
        yield mongoose_1.default.connect(process.env.DB_URL);
        console.log('Connected to MongoDB');
        const db = mongoose_1.default.connection.db;
        const users = db.collection('users');
        // Remove phoneNo field entirely from docs where phoneNo.value is null or empty
        const result = yield users.updateMany({ $or: [{ 'phoneNo.value': null }, { 'phoneNo.value': '' }, { 'phoneNo': null }] }, { $unset: { phoneNo: '' } });
        console.log(`Fixed ${result.modifiedCount} documents`);
        // Drop and recreate the index as sparse
        try {
            yield users.dropIndex('phoneNo.value_1');
            console.log('Dropped old index');
        }
        catch (e) {
            console.log('Index may not exist:', e.message);
        }
        yield users.createIndex({ 'phoneNo.value': 1 }, { unique: true, sparse: true });
        console.log('Recreated sparse unique index on phoneNo.value');
        yield mongoose_1.default.disconnect();
        console.log('Done!');
    });
}
fix().catch(console.error);
