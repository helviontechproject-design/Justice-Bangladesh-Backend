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
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const routes_1 = require("./app/routes");
const globalErrorHandler_1 = require("./app/middlewares/globalErrorHandler");
require("./app/config/passport");
const passport_1 = __importDefault(require("passport"));
const express_session_1 = __importDefault(require("express-session"));
const env_1 = require("./app/config/env");
const notFound_1 = __importDefault(require("./app/middlewares/notFound"));
const node_cron_1 = __importDefault(require("node-cron"));
const appointment_service_1 = require("./app/modules/appointment/appointment.service");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
// Allow multiple origins: production Vercel URL + local dev
const allowedOrigins = [
    env_1.envVars.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://10.0.2.2:5000',
    process.env.ADMIN_URL,
].filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, curl)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error(`CORS blocked: ${origin}`));
        }
    },
    credentials: true,
}));
app.use((0, express_session_1.default)({
    secret: env_1.envVars.EXPRESS_SESSION,
    resave: false,
    saveUninitialized: false,
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.set('trust proxy', 1);
app.use(express_1.default.urlencoded({ extended: true }));
// Enable cron on traditional servers (Hostinger) or when explicitly enabled
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
    node_cron_1.default.schedule('* * * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        yield appointment_service_1.appointmentService.cancelUnpaidAppointments();
    }));
}
app.use('/api/v1', routes_1.router);
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'WelCome to Law Firm API',
    });
});
app.use(globalErrorHandler_1.globalErrorHandler);
app.use(notFound_1.default);
exports.default = app;
