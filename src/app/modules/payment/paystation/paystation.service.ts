import axios from 'axios';
import FormData from 'form-data';
import { envVars } from '../../../config/env';
import AppError from '../../../errorHelpers/AppError';
import { StatusCodes } from 'http-status-codes';
import {
  IPayStationInitiatePayment,
  IPayStationInitiateResponse,
  IPayStationTransactionStatus,
  IPayStationTransactionStatusResponse,
} from './paystation.interface';

const PAYSTATION_BASE_URL = envVars.PAYSTATION.BASE_URL;
const MERCHANT_ID = envVars.PAYSTATION.MERCHANT_ID;
const MERCHANT_PASSWORD = envVars.PAYSTATION.PASSWORD;

/**
 * Initiate PayStation payment
 * Official API: https://api.paystation.com.bd/initiate-payment
 * Returns payment URL for user to complete payment
 */
export const initiatePayment = async (
  payload: Omit<IPayStationInitiatePayment, 'merchantId' | 'password'>
): Promise<IPayStationInitiateResponse> => {
  try {
    const formData = new FormData();
    
    // Required fields according to PayStation documentation
    formData.append('merchantId', MERCHANT_ID);
    formData.append('password', MERCHANT_PASSWORD);
    formData.append('invoice_number', payload.invoice_number);
    formData.append('currency', payload.currency || 'BDT');
    formData.append('payment_amount', payload.payment_amount.toString());
    formData.append('cust_name', payload.cust_name);
    formData.append('cust_phone', payload.cust_phone);
    formData.append('cust_email', payload.cust_email);
    formData.append('callback_url', payload.callback_url);
    
    // Optional fields
    if (payload.reference) formData.append('reference', payload.reference);
    if (payload.cust_address) formData.append('cust_address', payload.cust_address);
    if (payload.checkout_items) formData.append('checkout_items', payload.checkout_items);

    console.log('[PayStation] Initiating payment with data:', {
      merchantId: MERCHANT_ID,
      invoice_number: payload.invoice_number,
      payment_amount: payload.payment_amount,
      cust_name: payload.cust_name,
      cust_phone: payload.cust_phone,
      cust_email: payload.cust_email,
      callback_url: payload.callback_url,
    });

    const response = await axios.post(
      `${PAYSTATION_BASE_URL}/initiate-payment`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000, // 30 seconds timeout
      }
    );

    console.log('[PayStation] Raw Response:', response.data);

    // PayStation official response format:
    // Success: { status_code: "200", status: "success", message: "Payment Link Created Successfully.", payment_amount: "1", invoice_number: "xxx", payment_url: "https://..." }
    // Failed: { status_code: "1008", status: "failed", message: "Duplicate invoice number." }
    
    const data = response.data as any;

    // Check if response is successful
    if (data.status_code === '200' && data.status === 'success' && data.payment_url) {
      console.log('[PayStation] ✅ Payment URL generated successfully:', data.payment_url);
      return {
        success: true,
        message: data.message || 'Payment initiated successfully',
        payment_url: data.payment_url,
        invoice_number: data.invoice_number || payload.invoice_number,
        payment_amount: data.payment_amount,
      };
    }

    // Handle failed response
    console.error('[PayStation] ❌ Payment initiation failed:', data);
    throw new Error(data.message || 'Payment initiation failed');

  } catch (error: any) {
    console.error('[PayStation] Payment initiation error:', error);
    
    if (error.isAxiosError) {
      const errorData = error.response?.data;
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `PayStation Error: ${errorData?.message || error.message}`
      );
    }
    
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Payment initiation failed: ${error.message}`
    );
  }
};

/**
 * Check transaction status
 * Official API: https://api.paystation.com.bd/transaction-status
 * Verify if payment was successful
 */
export const checkTransactionStatus = async (
  payload: IPayStationTransactionStatus
): Promise<IPayStationTransactionStatusResponse> => {
  try {
    console.log('[PayStation] Checking transaction status for invoice:', payload.invoice_number);

    const response = await axios.post(
      `${PAYSTATION_BASE_URL}/transaction-status`,
      {
        invoice_number: payload.invoice_number,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'merchantId': MERCHANT_ID,
        },
        timeout: 15000, // 15 seconds timeout
      }
    );

    console.log('[PayStation] Transaction status response:', response.data);

    // PayStation official response format:
    // Success: { status_code: "200", status: "success", message: "Transaction found.", data: { invoice_number, trx_status: "Success", trx_id, payment_amount, order_date_time, payer_mobile_no, payment_method, reference, checkout_items } }
    // Failed: { status_code: "2001", status: "failed", message: "Invalid Token." }
    
    const responseData = response.data as any;

    if (responseData.status_code === '200' && responseData.status === 'success' && responseData.data) {
      const data = responseData.data;
      
      // Check trx_status
      const isSuccess = data.trx_status && (
        data.trx_status.toLowerCase() === 'success' || 
        data.trx_status.toLowerCase() === 'successful'
      );

      console.log('[PayStation] Transaction status:', {
        invoice: data.invoice_number,
        status: data.trx_status,
        trx_id: data.trx_id,
        amount: data.payment_amount,
        method: data.payment_method,
      });

      return {
        success: isSuccess,
        invoice_number: data.invoice_number,
        status: data.trx_status?.toLowerCase() || 'unknown',
        amount: parseFloat(data.payment_amount) || 0,
        currency: 'BDT',
        payment_method: data.payment_method,
        transaction_id: data.trx_id,
        payment_date: data.order_date_time,
        payer_mobile: data.payer_mobile_no,
        reference: data.reference,
      };
    }

    // Failed response
    console.error('[PayStation] ❌ Transaction check failed:', responseData);
    return {
      success: false,
      invoice_number: payload.invoice_number,
      status: 'failed',
      amount: 0,
      currency: 'BDT',
      payment_method: undefined,
      transaction_id: undefined,
      payment_date: undefined,
    };

  } catch (error: any) {
    console.error('[PayStation] Status check error:', error);
    
    if (error.isAxiosError) {
      const errorData = error.response?.data;
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `PayStation Status Error: ${errorData?.message || error.message}`
      );
    }
    
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Status check failed: ${error.message}`
    );
  }
};

/**
 * Validate payment callback
 * Called from PayStation callback URL
 */
export const validateCallback = async (callbackData: any): Promise<boolean> => {
  try {
    // Extract invoice number from callback
    const invoiceNumber = callbackData.invoice_number || callbackData.invoice;
    
    if (!invoiceNumber) {
      console.error('[PayStation] No invoice number in callback');
      return false;
    }

    // Check transaction status to verify
    const status = await checkTransactionStatus({ invoice_number: invoiceNumber });
    
    return status.success && (status.status === 'success' || status.status === 'completed');
  } catch (error) {
    console.error('[PayStation] Callback validation error:', error);
    return false;
  }
};

export const PayStationService = {
  initiatePayment,
  checkTransactionStatus,
  validateCallback,
};
