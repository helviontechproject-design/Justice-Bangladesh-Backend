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
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./app/config/env");
const app_1 = __importDefault(require("./app"));
const createAdmin_1 = require("./app/utils/createAdmin");
const http_1 = __importDefault(require("http"));
const seedServices_1 = require("./app/utils/seedServices");
const seedPlatformSettings_1 = require("./app/utils/seedPlatformSettings");
let server;
let isConnected = false;
const connectToDB = () => __awaiter(void 0, void 0, void 0, function* () {
    if (isConnected)
        return;
    try {
        yield mongoose_1.default.connect(env_1.envVars.DB_URL);
        isConnected = true;
        console.log('Connected to DB!');
    }
    catch (error) {
        console.log('DB connection error:', error);
        throw error;
    }
});
const bootstrap = () => __awaiter(void 0, void 0, void 0, function* () {
    yield connectToDB();
    yield (0, createAdmin_1.createAdmin)();
    yield (0, seedPlatformSettings_1.seedPlatformSettings)();
    yield (0, seedServices_1.seedServices)();
    if (process.env.VERCEL !== '1') {
        server = http_1.default.createServer(app_1.default);
        const port = Number(process.env.PORT) || 5000;
        const host = process.env.HOST || '0.0.0.0';
        server.listen(port, host, () => {
            console.log(`Server is Listening to port ${port}`);
        });
    }
});
bootstrap();
// For Vercel: ensure DB is connected on each cold start
if (process.env.VERCEL === '1') {
    app_1.default.use((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        yield connectToDB();
        next();
    }));
}
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received. Shutting down the server gracefully...');
    if (server) {
        server.close(() => {
            console.log('Server closed.');
            process.exit(0);
        });
    }
    else {
        process.exit(0);
    }
});
process.on('SIGINT', () => {
    console.log('SIGINT signal received (e.g. Ctrl+C). Shutting down the server gracefully...');
    if (server) {
        server.close(() => {
            console.log('Server closed.');
            process.exit(0);
        });
    }
    else {
        process.exit(0);
    }
});
process.on('unhandledRejection', err => {
    console.log('Unhandled Promise Rejection detected. Shutting down the server...', err);
    if (server) {
        server.close(() => process.exit(1));
    }
    else {
        process.exit(1);
    }
});
process.on('uncaughtException', err => {
    console.log('Uncaught Exception detected. Shutting down the server...', err);
    if (server) {
        server.close(() => process.exit(1));
    }
    else {
        process.exit(1);
    }
});
// Export app for Vercel serverless deployment
exports.default = app_1.default;
