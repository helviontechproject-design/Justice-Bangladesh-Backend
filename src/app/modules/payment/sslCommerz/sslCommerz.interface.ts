export interface ISSLCommerz {
  amount: number;
  name: string;
  email: string;
  phoneNumber: string;
  transactionId: string
  address: string
}

export interface ISSLCommerzResponse {
  status: string;
  failedreason?: string;
  sessionkey?: string;
  gw?: {
    visa?: string;
    master?: string;
    amex?: string;
    othercards?: string;
    internetbanking?: string;
    mobilebanking?: string;
  };
  GatewayPageURL?: string;
  storeBanner?: string;
  storeLogo?: string;
  desc?: any[];
  is_direct_pay_enable?: string;
}