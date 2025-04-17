# Payment System Documentation

This document provides information about the payment system implementation for the efiletax-admin application.

## Overview

The payment system integrates with PayU payment gateway to process payments for services. It includes:

1. MongoDB collections for storing payment transactions, refunds, and webhooks
2. API routes for payment processing
3. Client-side components for displaying payment forms
4. Success and failure pages for payment redirects

## Database Collections

### PaymentTransaction

Stores information about payment transactions:

```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  payuTxnId: "txn_123456789",        // Your txnid
  mihpayid: "403993715520240208",    // PayU payment ID
  status: "success",                 // success | failure | pending
  amount: 499.00,
  paymentMode: "CC",                 // CC, DC, NB, etc.
  serviceId: <id-from-services-collection>,
  hash: "d41d8cd98f00b204e9800998ecf8427e",
  responseData: { ... },             // Full PayU response object
  createdAt: ISODate("2024-04-11T10:01:00Z"),
  updatedAt: ISODate("2024-04-11T10:03:00Z")
}
```

### PaymentRefund

Stores information about payment refunds:

```javascript
{
  _id: ObjectId("..."),
  paymentTransactionId: ObjectId("..."),
  refundId: "refund_78654321",       // From PayU
  amount: 499.00,
  status: "success",                 // success | pending | failure
  reason: "User requested refund",
  initiatedAt: ISODate("2024-04-12T09:00:00Z"),
  completedAt: ISODate("2024-04-12T12:00:00Z")
}
```

### PaymentWebhook

Stores information about payment webhooks:

```javascript
{
  _id: ObjectId("..."),
  eventType: "payment_success",
  rawPayload: { ... },               // Raw webhook request from PayU
  receivedAt: ISODate("2024-04-11T10:01:05Z"),
  processed: true
}
```

## Configuration

1. Add PayU credentials to your `.env` file (see `.env.example` for reference):

```
PAYU_MERCHANT_KEY=your-payu-merchant-key
PAYU_MERCHANT_SALT=your-payu-merchant-salt
PAYU_BASE_URL=https://sandboxsecure.payu.in/_payment  # Use sandbox URL for testing
PAYU_AUTH_HEADER=your-payu-auth-header
```

2. Make sure your `NEXT_PUBLIC_BASE_URL` is set correctly for payment callbacks.

3. **Important**: Ensure your PayU merchant key is active. If you receive an error like:

```
Error Reason
The key (YourKey) value which you are using in the transaction request - is currently inactive.

Corrective Action
Please note that the key (YourKey) used in this transaction hasn't been activated at PayU yet.
```

You need to:

- Double-check that you're using the correct merchant key provided by PayU
- Contact your PayU account manager to activate the key if it's correct
- For testing, use the PayU sandbox environment with test credentials

## API Routes

- **POST /api/payment/initiate**: Initiates a payment transaction
- **POST /api/payment/success**: Handles successful payment callbacks
- **POST /api/payment/failure**: Handles failed payment callbacks
- **POST /api/payment/webhook**: Handles PayU webhooks
- **GET /api/payment/check**: Checks if a user has paid for a service

## Client-Side Integration

To integrate payment gateway in a service page:

1. Import the PaymentGateway component:

```javascript
import PaymentGateway from "@/components/payment/PaymentGateway";
```

2. Wrap your service content with the PaymentGateway component:

```javascript
<PaymentGateway
  serviceId={serviceDetails.id}
  serviceName={serviceDetails.name}
  price={serviceDetails.price}
>
  <YourServiceContent />
</PaymentGateway>
```

The PaymentGateway component will:

- Check if the user has already paid for the service
- If paid, display the service content
- If not paid, display the payment form

## Payment Flow

1. User accesses a service page
2. PaymentGateway component checks if the user has paid for the service
3. If not paid, the payment form is displayed
4. User clicks "Proceed to Payment" and is redirected to PayU payment gateway
5. After payment, PayU redirects back to success or failure URL
6. Success/failure pages display appropriate messages and redirect to dashboard

## Webhook Integration

To receive payment status updates from PayU:

1. Configure your PayU account to send webhooks to `/api/payment/webhook`
2. The webhook handler will update payment transaction status and store the webhook payload

## Testing

For testing the payment gateway:

1. Use PayU sandbox credentials in your development environment:

   - Set `PAYU_BASE_URL=https://sandboxsecure.payu.in/_payment`
   - Use test merchant key and salt provided by PayU for sandbox testing
   - For sandbox testing, you can use test card numbers like:
     - Card Number: 5123456789012346
     - Expiry: Any future date
     - CVV: Any 3-digit number
     - Name: Any name
     - OTP: 123456

2. Test different payment scenarios (success, failure, etc.)
3. Verify that payment transactions are stored correctly in the database
4. Check that webhooks are processed correctly

> **Note**: When moving to production, change the `PAYU_BASE_URL` to the production URL (`https://secure.payu.in/_payment`) and use your production merchant key and salt.

## Troubleshooting

- If payment callbacks are not working, check that your `NEXT_PUBLIC_BASE_URL` is set correctly
- If payment verification fails, check your PayU credentials (merchant key and salt)
- If webhooks are not being received, check your PayU webhook configuration
