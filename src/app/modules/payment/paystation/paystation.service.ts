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

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Initiate PayStation payment
 * Official API: https://api.paystation.com.bd/initiate-payment
 * Returns payment URL for user to complete payment
 * 
 * PRODUCTION READY with:
 * - Retry logic for network failures
 * - Comprehensive error handling
 * - Request validation
 * - Detailed logging
 */
export const initiatePayment = async (
  payload: Omit<IPayStationInitiatePayment, 'merchantId' | 'password'>
): Promise<IPayStationInitiateResponse> => {
  // Validate payload
  if (!payload.invoice_number || payload.invoice_number.trim().length === 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invoice number is required');
  }
  
  if (!payload.cust_phone || payload.cust_phone.trim().length === 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Customer phone is required');
  }
  
  if (!payload.cust_email || payload.cust_email.trim().length === 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Customer email is required');
  }
  
  if (payload.payment_amount <= 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Payment amount must be greater than 0');
  }

  try {
    const formData = new FormData();
    
    // Required fields according to PayStation documentation
    formData.append('merchantId', MERCHANT_ID);
    formData.append('password', MERCHANT_PASSWORD);
    formData.append('invoice_number', payload.invoice_number.trim());
    formData.append('currency', payload.currency || 'BDT');
    formData.append('payment_amount', payload.payment_amount.toString());
    formData.append('cust_name', (payload.cust_name || 'Customer').trim());
    formData.append('cust_phone', payload.cust_phone.trim());
    formData.append('cust_email', payload.cust_email.trim());
    formData.append('callback_url', payload.callback_url);
    
    // Optional fields
    if (payload.reference) formData.append('reference', payload.reference.trim());
    if (payload.cust_address) formData.append('cust_address', payload.cust_address.trim());
    if (payload.checkout_items) formData.append('checkout_items', payload.checkout_items.trim());

    console.log('[PayStation] 🔄 Initiating payment request', {
      invoice: payload.invoice_number,
      amount: payload.payment_amount,
      phone: payload.cust_phone,
      email: payload.cust_email,
      timestamp: new Date().toISOString(),
    });

    let response;
    let lastError: any;
    
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        response = await axios.post(
          `${PAYSTATION_BASE_URL}/initiate-payment`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
            },
            timeout: 30000, // 30 seconds timeout
          }
        );
        break; // Success, exit retry loop
      } catch (error: any) {
        lastError = error;
        if (attempt < MAX_RETRIES && (error.code === 'ECONNABORTED' || error.code === 'ECONNREFUSED')) {
          console.warn(`[PayStation] Retry attempt ${attempt + 1}/${MAX_RETRIES}`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        } else {
          throw error; // No retry or max retries reached
        }
      }
    }

    if (!response) {
      throw lastError || new Error('Failed to get response from PayStation');
    }

    const data = response.data as any;
    
    console.log('[PayStation] 📨 API Response received', {
      statusCode: data.status_code,
      status: data.status,
      invoice: data.invoice_number,
    });

    // PayStation official response format:
    // Success: { status_code: "200", status: "success", message: "Payment Link Created Successfully.", payment_amount: "1", invoice_number: "xxx", payment_url: "https://..." }
    // Failed: { status_code: "1008", status: "failed", message: "Duplicate invoice number." }
    
    // Check if response is successful
    if (data.status_code === '200' && data.status === 'success' && data.payment_url) {
      console.log('[PayStation] ✅ Payment URL generated successfully for invoice:', payload.invoice_number);
      return {
        success: true,
        message: data.message || 'Payment initiated successfully',
        payment_url: data.payment_url,
        invoice_number: data.invoice_number || payload.invoice_number,
        payment_amount: data.payment_amount,
      };
    }

    // Handle duplicate invoice error (can retry with different invoice)
    if (data.status_code === '1008') {
      console.warn('[PayStation] ⚠️ Duplicate invoice number:', payload.invoice_number);
      throw new AppError(
        StatusCodes.CONFLICT,
        'Payment link for this transaction already exists. Please try again.'
      );
    }

    // Handle other failed responses
    console.error('[PayStation] ❌ Payment initiation failed:', {
      statusCode: data.status_code,
      status: data.status,
      message: data.message,
      invoice: payload.invoice_number,
    });
    
    throw new Error(data.message || `PayStation error (${data.status_code})`);

  } catch (error: any) {
    console.error('[PayStation] 💥 Payment initiation error:', {
      message: error.message,
      code: error.code,
      invoice: payload.invoice_number,
      timestamp: new Date().toISOString(),
    });
    
    if (error.isAxiosError) {
      const errorData = error.response?.data;
      const statusCode = error.response?.status || StatusCodes.BAD_REQUEST;
      
      // Handle specific HTTP errors
      if (statusCode === 401 || statusCode === 403) {
        throw new AppError(
          StatusCodes.UNAUTHORIZED,
          'PayStation authentication failed. Please check merchant credentials.'
        );
      }
      
      if (statusCode === 429) {
        throw new AppError(
          StatusCodes.TOO_MANY_REQUESTS,
          'Too many requests to PayStation. Please try again later.'
        );
      }

      throw new AppError(
        statusCode,
        `PayStation Error: ${errorData?.message || error.message}`
      );
    }
    
    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new AppError(
        StatusCodes.SERVICE_UNAVAILABLE,
        'Cannot connect to PayStation. Please try again later.'
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
 * 
 * PRODUCTION READY with:
 * - Retry logic for network failures
 * - Comprehensive error handling
 * - Status verification
 * - Detailed logging
 */
export const checkTransactionStatus = async (
  payload: IPayStationTransactionStatus
): Promise<IPayStationTransactionStatusResponse> => {
  if (!payload.invoice_number || payload.invoice_number.trim().length === 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invoice number is required');
  }

  try {
    console.log('[PayStation] 🔍 Checking transaction status for invoice:', payload.invoice_number);

    let response;
    let lastError: any;
    
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        response = await axios.post(
          `${PAYSTATION_BASE_URL}/transaction-status`,
          {
            invoice_number: payload.invoice_number.trim(),
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'merchantId': MERCHANT_ID,
            },
            timeout: 15000, // 15 seconds timeout
          }
        );
        break; // Success, exit retry loop
      } catch (error: any) {
        lastError = error;
        if (attempt < MAX_RETRIES && (error.code === 'ECONNABORTED' || error.code === 'ECONNREFUSED')) {
          console.warn(`[PayStation] Retry attempt ${attempt + 1}/${MAX_RETRIES}`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        } else {
          throw error; // No retry or max retries reached
        }
      }
    }

    if (!response) {
      throw lastError || new Error('Failed to get response from PayStation');
    }

    const responseData = response.data as any;
    
    console.log('[PayStation] 📨 Status API Response received', {
      statusCode: responseData.status_code,
      status: responseData.status,
      invoice: payload.invoice_number,
    });

    // PayStation official response format:
    // Success: { status_code: "200", status: "success", message: "Transaction found.", data: { invoice_number, trx_status: "Success", trx_id, payment_amount, order_date_time, payer_mobile_no, payment_method, reference, checkout_items } }
    // Failed: { status_code: "2001", status: "failed", message: "Invalid Token." }
    
    if (responseData.status_code === '200' && responseData.status === 'success' && responseData.data) {
      const data = responseData.data;
      
      // Check trx_status - can be: Success, Failed, Pending, Canceled, etc
      const isSuccess = data.trx_status && (
        data.trx_status.toLowerCase() === 'success' || 
        data.trx_status.toLowerCase() === 'successful' ||
        data.trx_status.toLowerCase() === 'completed'
      );

      console.log('[PayStation] ✅ Transaction status retrieved', {
        invoice: data.invoice_number,
        status: data.trx_status,
        trxId: data.trx_id,
        amount: data.payment_amount,
        method: data.payment_method,
        isSuccess,
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

    // Handle transaction not found
    if (responseData.status_code === '2002' || responseData.message?.includes('not found')) {
      console.warn('[PayStation] ⚠️ Transaction not found:', payload.invoice_number);
      return {
        success: false,
        invoice_number: payload.invoice_number,
        status: 'not_found',
        amount: 0,
        currency: 'BDT',
        message: 'Transaction not found in PayStation',
      };
    }

    // Failed response
    console.error('[PayStation] ❌ Status check failed:', {
      statusCode: responseData.status_code,
      status: responseData.status,
      message: responseData.message,
      invoice: payload.invoice_number,
    });
    
    return {
      success: false,
      invoice_number: payload.invoice_number,
      status: 'failed',
      amount: 0,
      currency: 'BDT',
      message: responseData.message || 'Failed to check transaction status',
    };

  } catch (error: any) {
    console.error('[PayStation] 💥 Status check error:', {
      message: error.message,
      code: error.code,
      invoice: payload.invoice_number,
      timestamp: new Date().toISOString(),
    });
    
    if (error.isAxiosError) {
      const errorData = error.response?.data;
      const statusCode = error.response?.status || StatusCodes.BAD_REQUEST;
      
      if (statusCode === 401 || statusCode === 403) {
        throw new AppError(
          StatusCodes.UNAUTHORIZED,
          'PayStation authentication failed. Please check merchant credentials.'
        );
      }

      throw new AppError(
        statusCode,
        `PayStation Status Error: ${errorData?.message || error.message}`
      );
    }
    
    // Handle network errors - return unknown status instead of throwing
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.warn('[PayStation] ⚠️ Cannot connect to PayStation for status check');
      return {
        success: false,
        invoice_number: payload.invoice_number,
        status: 'pending',
        amount: 0,
        currency: 'BDT',
        message: 'Cannot verify payment status. Payment may still be processing.',
      };
    }
    
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Status check failed: ${error.message}`
    );
  }
};

/**
 * Validate payment callback
 * Called when user returns from PayStation payment gateway
 * 
 * PRODUCTION READY with:
 * - Transaction verification
 * - Callback data validation
 * - Detailed logging
 */
export const validateCallback = async (callbackData: any): Promise<boolean> => {
  try {
    // Extract invoice number from callback
    const invoiceNumber = callbackData.invoice_number || callbackData.invoice;
    
    if (!invoiceNumber) {
      console.error('[PayStation] ❌ No invoice number in callback data:', callbackData);
      return false;
    }

    console.log('[PayStation] 🔐 Validating callback for invoice:', invoiceNumber);
    console.log('[PayStation] Callback data:', {
      invoiceNumber,
      status: callbackData.status,
      trxId: callbackData.trx_id,
      amount: callbackData.amount,
    });

    // Check transaction status to verify
    const status = await checkTransactionStatus({ invoice_number: invoiceNumber });
    
    const isValid = status.success && (
      status.status === 'success' || 
      status.status === 'completed' ||
      status.status === 'successful'
    );

    if (isValid) {
      console.log('[PayStation] ✅ Callback validated successfully for invoice:', invoiceNumber);
    } else {
      console.warn('[PayStation] ⚠️ Callback validation failed for invoice:', invoiceNumber, 'Status:', status.status);
    }

    return isValid;
  } catch (error) {
    console.error('[PayStation] 💥 Callback validation error:', error);
    return false;
  }
};

/**
 * Export PayStationService with all functions
 */

export const PayStationService = {
  initiatePayment,
  checkTransactionStatus,
  validateCallback,
};
