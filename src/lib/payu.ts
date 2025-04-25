import crypto from "crypto";

interface PayUConfig {
  merchantKey: string;
  merchantSalt: string;
  baseUrl: string;
  successUrl: string;
  failureUrl: string;
}

// Get PayU configuration from environment variables
export const getPayUConfig = (): PayUConfig => {
  return {
    merchantKey: process.env.PAYU_MERCHANT_KEY || "",
    merchantSalt: process.env.PAYU_MERCHANT_SALT || "",
    baseUrl:
      process.env.PAYU_BASE_URL || "https://sandboxsecure.payu.in/_payment",
    successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/success` || "",
    failureUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/failure` || "",
  };
};

// Generate transaction ID
export const generateTxnId = (): string => {
  return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

// Generate hash for PayU request
export const generateHash = (
  txnId: string,
  amount: number,
  productInfo: string,
  firstName: string,
  email: string,
  udf1: string = ""
): string => {
  const config = getPayUConfig();

  // Hash sequence: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
  const hashString = `${config.merchantKey}|${txnId}|${amount}|${productInfo}|${firstName}|${email}|${udf1}||||||||||${config.merchantSalt}`;

  return crypto.createHash("sha512").update(hashString).digest("hex");
};

// Verify hash from PayU response
export const verifyHash = (payuResponse: any): boolean => {
  const config = getPayUConfig();

  // Response hash sequence: salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
  const hashString = `${config.merchantSalt}|${payuResponse.status}|||||||${
    payuResponse.udf5 || ""
  }|${payuResponse.udf4 || ""}|${payuResponse.udf3 || ""}|${
    payuResponse.udf2 || ""
  }|${payuResponse.udf1 || ""}|${payuResponse.email}|${
    payuResponse.firstname
  }|${payuResponse.productinfo}|${payuResponse.amount}|${payuResponse.txnid}|${
    config.merchantKey
  }`;

  const calculatedHash = crypto
    .createHash("sha512")
    .update(hashString)
    .digest("hex");

  return calculatedHash === payuResponse.hash;
};

// Generate PayU form data
export const generatePayUFormData = (
  txnId: string,
  amount: number,
  productInfo: string,
  firstName: string,
  email: string,
  phone: string,
  serviceId: string
) => {
  const config = getPayUConfig();

  const hash = generateHash(
    txnId,
    amount,
    productInfo,
    firstName,
    email,
    serviceId
  );

  return {
    key: config.merchantKey,
    txnid: txnId,
    amount: amount.toString(),
    productinfo: productInfo,
    firstname: firstName,
    email: email,
    phone: phone,
    surl: config.successUrl,
    furl: config.failureUrl,
    hash: hash,
    udf1: serviceId, // Store serviceId in udf1 field
  };
};
