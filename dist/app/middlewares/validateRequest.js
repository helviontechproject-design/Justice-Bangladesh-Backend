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
exports.validateRequest = void 0;
const validateRequest = (zodSchema) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('=== VALIDATE REQUEST ===');
        console.log('Route:', req.path);
        console.log('Method:', req.method);
        console.log('Body before validation:', JSON.stringify(req.body, null, 2));
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        console.log('Body to validate:', JSON.stringify(req.body, null, 2));
        req.body = yield zodSchema.parseAsync(req.body);
        console.log('Validation passed');
        next();
    }
    catch (error) {
        console.error('Validation error:', error);
        next(error);
    }
});
exports.validateRequest = validateRequest;
