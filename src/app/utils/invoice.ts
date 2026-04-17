/* eslint-disable @typescript-eslint/no-explicit-any */
import PDFDocument from 'pdfkit';
import AppError from '../errorHelpers/AppError';

export interface IInvoiceData {
  transactionId: string;
  AppointmentDate: Date;
  clientName: string;
  clientEmail: string;
  paymentMethod: string;
  totalAmount: number;
  status: 'PAID' | 'UNPAID';
  approvedBy?: string;
}

export const generatePdf = async (
  invoiceData: IInvoiceData
): Promise<Buffer<ArrayBufferLike>> => {
  try {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffer: Uint8Array[] = [];

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
  } catch (error: any) {
    console.log(error);
    throw new AppError(401, `Pdf creation error ${error.message}`);
  }
};
