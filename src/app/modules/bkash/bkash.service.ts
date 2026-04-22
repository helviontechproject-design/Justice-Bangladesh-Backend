import axios from 'axios';
import { envVars } from '../../config/env';

const BASE_URL = envVars.BKASH.BASE_URL;

let _token: string | null = null;
let _tokenExpiry: number = 0;

// Get grant token (cached, refreshed when expired)
const getToken = async (): Promise<string> => {
  if (_token && Date.now() < _tokenExpiry) return _token;

  const res = await axios.post(
    `${BASE_URL}/tokenized/checkout/token/grant`,
    {
      app_key: envVars.BKASH.APP_KEY,
      app_secret: envVars.BKASH.APP_SECRET,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        username: envVars.BKASH.USERNAME,
        password: envVars.BKASH.PASSWORD,
      },
    }
  );

  const resData = res.data as any;
  _token = resData.id_token;
  // expires in 3600s, refresh 60s early
  _tokenExpiry = Date.now() + (resData.expires_in - 60) * 1000;
  return _token!;
};

export interface IBkashCreatePayload {
  amount: string;
  orderId: string;
  intent?: 'sale' | 'authorization';
  currency?: string;
  merchantInvoiceNumber?: string;
}

// Create payment — returns bKash payment URL
const createPayment = async (payload: IBkashCreatePayload) => {
  const token = await getToken();

  const res = await axios.post(
    `${BASE_URL}/tokenized/checkout/create`,
    {
      mode: '0011',
      payerReference: payload.orderId,
      callbackURL: `${envVars.BKASH.CALLBACK_URL}?orderId=${payload.orderId}`,
      amount: payload.amount,
      currency: payload.currency || 'BDT',
      intent: payload.intent || 'sale',
      merchantInvoiceNumber: payload.merchantInvoiceNumber || payload.orderId,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
        'X-APP-Key': envVars.BKASH.APP_KEY,
      },
    }
  );

  return res.data; // contains bkashURL, paymentID, statusCode
};

// Execute payment after user completes on bKash
const executePayment = async (paymentID: string) => {
  const token = await getToken();

  const res = await axios.post(
    `${BASE_URL}/tokenized/checkout/execute`,
    { paymentID },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
        'X-APP-Key': envVars.BKASH.APP_KEY,
      },
    }
  );

  return res.data; // contains trxID, transactionStatus, amount
};

// Query payment status
const queryPayment = async (paymentID: string) => {
  const token = await getToken();

  const res = await axios.post(
    `${BASE_URL}/tokenized/checkout/payment/status`,
    { paymentID },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
        'X-APP-Key': envVars.BKASH.APP_KEY,
      },
    }
  );

  return res.data;
};

// Refund
const refundPayment = async (paymentID: string, trxID: string, amount: string, reason: string) => {
  const token = await getToken();

  const res = await axios.post(
    `${BASE_URL}/tokenized/checkout/payment/refund`,
    { paymentID, trxID, amount, currency: 'BDT', reason },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
        'X-APP-Key': envVars.BKASH.APP_KEY,
      },
    }
  );

  return res.data;
};

export const BkashService = {
  getToken,
  createPayment,
  executePayment,
  queryPayment,
  refundPayment,
};
