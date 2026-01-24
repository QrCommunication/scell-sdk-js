# @scell/sdk

Official TypeScript SDK for [Scell.io](https://scell.io) - Electronic invoicing (Factur-X/UBL/CII) and eIDAS-compliant electronic signatures API.

## Features

- Full TypeScript support with strict types
- Two authentication modes: Bearer token (dashboard) and API key (external API)
- Automatic retries with exponential backoff and jitter
- Webhook signature verification
- Zero external dependencies (uses native fetch)
- ESM and CommonJS support
- Node.js 18+ and browser compatible

## Installation

```bash
npm install @scell/sdk
# or
yarn add @scell/sdk
# or
pnpm add @scell/sdk
```

## Quick Start

### Authentication

```typescript
import { ScellClient, ScellApiClient, ScellAuth } from '@scell/sdk';

// 1. Login to get a token
const auth = await ScellAuth.login({
  email: 'user@example.com',
  password: 'your-password',
});

// 2. Dashboard operations (Bearer token)
const client = new ScellClient(auth.token);

// 3. API operations (X-API-Key)
const apiClient = new ScellApiClient('your-api-key');
```

### Create an Invoice

```typescript
const { data: invoice } = await apiClient.invoices.create({
  invoice_number: 'FACT-2024-001',
  direction: 'outgoing',
  output_format: 'facturx',
  issue_date: '2024-01-15',
  due_date: '2024-02-15',
  currency: 'EUR',
  total_ht: 1000.0,
  total_tax: 200.0,
  total_ttc: 1200.0,
  seller_siret: '12345678901234',
  seller_name: 'My Company SAS',
  seller_address: {
    line1: '1 Rue de la Paix',
    postal_code: '75001',
    city: 'Paris',
    country: 'FR',
  },
  buyer_siret: '98765432109876',
  buyer_name: 'Client Company',
  buyer_address: {
    line1: '2 Avenue des Champs',
    postal_code: '75008',
    city: 'Paris',
    country: 'FR',
  },
  lines: [
    {
      description: 'Consulting services - January 2024',
      quantity: 10,
      unit_price: 100.0,
      tax_rate: 20.0,
      total_ht: 1000.0,
      total_tax: 200.0,
      total_ttc: 1200.0,
    },
  ],
});

console.log('Invoice created:', invoice.id);
```

### Create a Signature Request

```typescript
import { readFileSync } from 'fs';

const pdfContent = readFileSync('contract.pdf');

const { data: signature } = await apiClient.signatures.create({
  title: 'Service Agreement 2024',
  description: 'Annual service contract',
  document: pdfContent.toString('base64'),
  document_name: 'contract.pdf',
  signers: [
    {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      auth_method: 'email',
    },
    {
      first_name: 'Jane',
      last_name: 'Smith',
      phone: '+33612345678',
      auth_method: 'sms',
    },
  ],
  ui_config: {
    logo_url: 'https://mycompany.com/logo.png',
    primary_color: '#3b82f6',
    company_name: 'My Company',
  },
  redirect_complete_url: 'https://myapp.com/signed',
  redirect_cancel_url: 'https://myapp.com/cancelled',
});

// Send signing URLs to signers
signature.signers?.forEach((signer) => {
  console.log(`${signer.email}: ${signer.signing_url}`);
});
```

### Webhook Verification

```typescript
import { ScellWebhooks } from '@scell/sdk';

// Express.js example
app.post('/webhooks/scell', async (req, res) => {
  const signature = req.headers['x-scell-signature'] as string;
  const payload = JSON.stringify(req.body);

  // Verify the webhook signature
  const isValid = await ScellWebhooks.verifySignature(
    payload,
    signature,
    process.env.WEBHOOK_SECRET!
  );

  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }

  // Parse and handle the event
  const event = ScellWebhooks.parsePayload(payload);

  switch (event.event) {
    case 'invoice.validated':
      console.log('Invoice validated:', event.data);
      break;
    case 'signature.completed':
      console.log('Signature completed:', event.data);
      break;
    case 'balance.low':
      console.log('Low balance alert!');
      break;
  }

  res.status(200).send('OK');
});
```

## API Reference

### ScellClient (Dashboard)

For user/dashboard operations with Bearer token authentication.

```typescript
const client = new ScellClient(token, {
  baseUrl: 'https://api.scell.io/api/v1', // optional
  timeout: 30000, // optional, in ms
  retry: { maxRetries: 3 }, // optional
});

// Resources
client.auth          // User authentication
client.companies     // Company management
client.apiKeys       // API key management
client.balance       // Balance and transactions
client.webhooks      // Webhook management
client.invoices      // Invoice listing (read-only)
client.signatures    // Signature listing (read-only)
```

### ScellApiClient (External API)

For creating invoices and signatures with X-API-Key authentication.

```typescript
const apiClient = new ScellApiClient(apiKey, {
  baseUrl: 'https://api.scell.io/api/v1', // optional
  timeout: 30000, // optional
});

// Resources
apiClient.invoices    // Create, download, convert invoices
apiClient.signatures  // Create, download, remind, cancel signatures
```

### Companies

```typescript
// List companies
const { data: companies } = await client.companies.list();

// Create company
const { data: company } = await client.companies.create({
  name: 'My Company',
  siret: '12345678901234',
  address_line1: '1 Rue Example',
  postal_code: '75001',
  city: 'Paris',
});

// Update company
await client.companies.update(companyId, { email: 'new@example.com' });

// Delete company
await client.companies.delete(companyId);

// KYC
const kyc = await client.companies.initiateKyc(companyId);
const status = await client.companies.kycStatus(companyId);
```

### Invoices

```typescript
// List invoices (dashboard)
const { data, meta } = await client.invoices.list({
  direction: 'outgoing',
  status: 'validated',
  from: '2024-01-01',
  per_page: 50,
});

// Get invoice
const { data: invoice } = await client.invoices.get(invoiceId);

// Create invoice (API key required)
const { data: newInvoice } = await apiClient.invoices.create({...});

// Download
const { url, expires_at } = await apiClient.invoices.download(invoiceId, 'pdf');

// Audit trail
const { data: trail, integrity_valid } = await apiClient.invoices.auditTrail(invoiceId);

// Convert format
await apiClient.invoices.convert({ invoice_id: invoiceId, target_format: 'ubl' });
```

### Signatures

```typescript
// List signatures (dashboard)
const { data, meta } = await client.signatures.list({
  status: 'pending',
  per_page: 25,
});

// Get signature
const { data: signature } = await client.signatures.get(signatureId);

// Create signature (API key required)
const { data: newSignature } = await apiClient.signatures.create({...});

// Download files
const { url: signedUrl } = await apiClient.signatures.download(signatureId, 'signed');
const { url: auditUrl } = await apiClient.signatures.download(signatureId, 'audit_trail');

// Send reminder
const { signers_reminded } = await apiClient.signatures.remind(signatureId);

// Cancel
await apiClient.signatures.cancel(signatureId);
```

### Balance

```typescript
// Get balance
const { data: balance } = await client.balance.get();
console.log(`${balance.amount} ${balance.currency}`);

// Reload balance
const { transaction } = await client.balance.reload({ amount: 100 });

// Update settings
await client.balance.updateSettings({
  auto_reload_enabled: true,
  auto_reload_threshold: 50,
  auto_reload_amount: 200,
  low_balance_alert_threshold: 100,
});

// List transactions
const { data: transactions } = await client.balance.transactions({
  type: 'debit',
  service: 'invoice',
  from: '2024-01-01',
});
```

### Webhooks

```typescript
// List webhooks
const { data: webhooks } = await client.webhooks.list();

// Create webhook
const { data: webhook } = await client.webhooks.create({
  url: 'https://myapp.com/webhooks/scell',
  events: ['invoice.validated', 'signature.completed', 'balance.low'],
  environment: 'production',
});
// IMPORTANT: Store webhook.secret securely!

// Update webhook
await client.webhooks.update(webhookId, { is_active: false });

// Test webhook
const result = await client.webhooks.test(webhookId);
console.log('Test successful:', result.success);

// Regenerate secret
const { data: updated } = await client.webhooks.regenerateSecret(webhookId);
// Update your stored secret!

// View logs
const { data: logs } = await client.webhooks.logs(webhookId);

// Delete webhook
await client.webhooks.delete(webhookId);
```

## Error Handling

```typescript
import {
  ScellError,
  ScellAuthenticationError,
  ScellValidationError,
  ScellRateLimitError,
  ScellNotFoundError,
  ScellInsufficientBalanceError,
} from '@scell/sdk';

try {
  await apiClient.invoices.create(data);
} catch (error) {
  if (error instanceof ScellValidationError) {
    console.log('Validation errors:', error.errors);
    error.getAllMessages().forEach(msg => console.log(msg));
  } else if (error instanceof ScellAuthenticationError) {
    console.log('Invalid credentials');
  } else if (error instanceof ScellRateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter}s`);
  } else if (error instanceof ScellInsufficientBalanceError) {
    console.log('Insufficient balance, please reload');
  } else if (error instanceof ScellNotFoundError) {
    console.log('Resource not found');
  } else if (error instanceof ScellError) {
    console.log(`API error: ${error.message} (${error.status})`);
  }
}
```

## Retry Configuration

The SDK automatically retries failed requests for rate limits (429) and server errors (5xx).

```typescript
import { withRetry, createRetryWrapper } from '@scell/sdk';

// Custom retry options
const client = new ScellClient(token, {
  retry: {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    jitterFactor: 0.1,
  },
});

// Disable retry for specific request
const result = await client.companies.list({ skipRetry: true });

// Manual retry wrapper
const result = await withRetry(
  () => apiClient.invoices.create(data),
  { maxRetries: 5 }
);
```

## Webhook Events

| Event | Description |
|-------|-------------|
| `invoice.created` | Invoice created |
| `invoice.validated` | Invoice validated |
| `invoice.transmitted` | Invoice transmitted to recipient |
| `invoice.accepted` | Invoice accepted |
| `invoice.rejected` | Invoice rejected |
| `invoice.error` | Invoice processing error |
| `signature.created` | Signature request created |
| `signature.waiting` | Waiting for signers |
| `signature.signed` | A signer has signed |
| `signature.completed` | All signers have signed |
| `signature.refused` | Signature refused |
| `signature.expired` | Signature expired |
| `signature.error` | Signature processing error |
| `balance.low` | Balance below low threshold |
| `balance.critical` | Balance below critical threshold |

## TypeScript Types

All types are exported and can be imported:

```typescript
import type {
  Invoice,
  InvoiceStatus,
  InvoiceDirection,
  CreateInvoiceInput,
  Signature,
  SignatureStatus,
  CreateSignatureInput,
  Signer,
  Company,
  Balance,
  Transaction,
  Webhook,
  WebhookEvent,
  WebhookPayload,
} from '@scell/sdk';
```

## Environment Variables

```bash
# API Configuration
SCELL_API_URL=https://api.scell.io/api/v1
SCELL_API_KEY=your-api-key
SCELL_WEBHOOK_SECRET=whsec_your-webhook-secret
```

## Requirements

- Node.js 18.0.0 or higher (for native fetch)
- TypeScript 5.0 or higher (for development)

## License

MIT
