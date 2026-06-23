/**
 * PayStation API Test Script
 * Test if credentials are valid
 */

const FormData = require('form-data');
const axios = require('axios');

// Your credentials
const MERCHANT_ID = '3797-1781589306';
const PASSWORD = 'kuydf@fytFhc';
const BASE_URL = 'https://api.paystation.com.bd';

async function testPayStationCredentials() {
  console.log('🧪 Testing PayStation Credentials...');
  console.log('═══════════════════════════════════════');
  console.log('Merchant ID:', MERCHANT_ID);
  console.log('Password:', PASSWORD);
  console.log('Base URL:', BASE_URL);
  console.log('═══════════════════════════════════════\n');

  try {
    const formData = new FormData();
    
    // Add credentials and minimal required data
    formData.append('merchantId', MERCHANT_ID);
    formData.append('password', PASSWORD);
    formData.append('invoice_number', `TEST-${Date.now()}`);
    formData.append('currency', 'BDT');
    formData.append('payment_amount', '10');
    formData.append('cust_name', 'Test User');
    formData.append('cust_phone', '01712345678');
    formData.append('cust_email', 'test@example.com');
    formData.append('callback_url', 'https://example.com/callback');
    formData.append('checkout_items', 'Test Item');

    console.log('📤 Sending request to PayStation...\n');

    const response = await axios.post(
      `${BASE_URL}/initiate-payment`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000,
      }
    );

    console.log('✅ Response received:');
    console.log('═══════════════════════════════════════');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('═══════════════════════════════════════\n');

    if (response.data.status_code === '200' && response.data.status === 'success') {
      console.log('🎉 SUCCESS! Credentials are VALID!');
      console.log('Payment URL:', response.data.payment_url);
    } else if (response.data.status_code === '1001') {
      console.log('❌ FAILED: Invalid Credentials!');
      console.log('The merchantId or password is incorrect.');
      console.log('\n💡 Suggestions:');
      console.log('1. Double-check merchantId: ' + MERCHANT_ID);
      console.log('2. Double-check password: ' + PASSWORD);
      console.log('3. Ensure these are PRODUCTION credentials (not sandbox)');
      console.log('4. Contact PayStation support if credentials are correct');
    } else {
      console.log('⚠️ Unexpected response:');
      console.log('Status Code:', response.data.status_code);
      console.log('Status:', response.data.status);
      console.log('Message:', response.data.message);
    }

  } catch (error) {
    console.error('❌ Error occurred:');
    console.error('═══════════════════════════════════════');
    if (error.response) {
      console.error('Response Data:', error.response.data);
      console.error('Response Status:', error.response.status);
    } else {
      console.error('Error Message:', error.message);
    }
    console.error('═══════════════════════════════════════');
  }
}

// Run test
testPayStationCredentials();
