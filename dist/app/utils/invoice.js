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
exports.generatePdf = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const pdfkit_1 = __importDefault(require("pdfkit"));
const AppError_1 = __importDefault(require("../errorHelpers/AppError"));
const generatePdf = (invoiceData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({ size: 'A4', margin: 50 });
            const buffer = [];
            doc.on('data', chunk => buffer.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffer)));
            doc.on('error', err => reject(err));
            //PDF Content
            doc.fontSize(20).text('Payment Invoice', { align: 'center' });
            doc.moveDown();
            doc.fontSize(14).text(`Transaction ID: ${invoiceData.transactionId}`);
            doc.text(`Date: ${new Date(invoiceData.AppointmentDate).toLocaleDateString()}`);
            doc.text(`Name: ${invoiceData.clientName}`);
            doc.text(`Email: ${invoiceData.clientEmail}`);
            doc.text(`Payment Method: ${invoiceData.paymentMethod}`);
            doc.text(`Approved By: ${invoiceData.approvedBy || 'N/A'}`);
            doc.moveDown();
            doc.text(`Total Amount: $${invoiceData.totalAmount.toFixed(2)}`, {
                align: 'right',
            });
            doc.moveDown();
            doc.fontSize(12).text('Status: Payment Successfully Processed', { align: 'center' });
            doc.moveDown();
            doc.text('Thank you for being a valued Client!', { align: 'center' });
            doc.end();
        });
    }
    catch (error) {
        console.log(error);
        throw new AppError_1.default(401, `Pdf creation error ${error.message}`);
    }
});
exports.generatePdf = generatePdf;
