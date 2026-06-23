/**
 * PayStation API Interfaces
 * Official Documentation: https://api.paystation.com.bd
 */

// Initiate Payment Request
export interface IPayStationInitiatePayment {
  merchantId: string; // Merchant ID from PayStation
  password: string; // Password from PayStation
  invoice_number: string; // Unique invoice number
  currency: string; // Currency code (BDT)
  payment_amount: number; // Transaction amount
  pay_with_charge?: number; // 0 or 1 (optional)
  reference?: string; // Reference info (optional)
  cust_name: string; // Customer full name
  cust_phone: string; // Customer phone
  cust_email: string; // Customer email
  cust_address?: string; // Customer address (optional)
  callback_url: string; // Callback URL for payment status
  checkout_items?: string; // Items description (optional)
  opt_a?: string; // Optional field A (optional)
  opt_b?: string; // Optional field B (optional)
  opt_c?: string; // Optional field C (optional)
  emi?: number; // EMI option (optional)
}

// Initiate Payment Response
// Success: { status_code: "200", status: "success", message: "Payment Link Created Successfully.", payment_amount: "1", invoice_number: "90011335545343", payment_url: "https://..." }
// Failed: { status_code: "1008", status: "failed", message: "Duplicate invoice number." }
export interface IPayStationInitiateResponse {
  success: boolean;
  message: string;
  payment_url?: string;
  invoice_number?: string;
  payment_amount?: string;
  status_code?: string;
  status?: string;
  error?: string;
}

// Transaction Status Request
export interface IPayStationTransactionStatus {
  invoice_number: string; // Invoice number to check
}

// Transaction Status Response
// Success: { status_code: "200", status: "success", message: "Transaction found.", data: { invoice_number, trx_status, trx_id, payment_amount, order_date_time, payer_mobile_no, payment_method, reference, checkout_items } }
// Failed: { status_code: "2001", status: "failed", message: "Invalid Token." }
export interface IPayStationTransactionStatusResponse {
  success: boolean;
  invoice_number: string;
  status: string; // processing, success, failed, refund
  amount: number;
  currency: string;
  payment_method?: string; // bKash/Nagad/Rocket/Upay/Mastercard/Visa
  transaction_id?: string; // trx_id from PayStation
  payment_date?: string; // order_date_time
  payer_mobile?: string; // payer_mobile_no
  reference?: string;
  status_code?: string;
  message?: string;
}

// Payment Callback URL Parameters
// Example: http://yourdomain.com/success.php?status=Successful&invoice_number=2021252525&trx_id=10XB9900
export interface IPayStationCallback {
  status: 'Successful' | 'Failed' | 'Canceled'; // Payment status
  invoice_number: string; // Invoice number
  trx_id?: string; // Transaction ID (only for successful payments)
}

