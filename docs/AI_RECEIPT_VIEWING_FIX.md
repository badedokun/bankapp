# AI Chat Receipt Viewing Fix

## Date: October 13, 2025

## Problem

After completing a successful transfer via AI chat, clicking the "View receipt" button showed:
1. "📄 Loading receipt..."
2. ❌ Error: "Sorry, I couldn't load the receipt. The transfer was successful, but there was an error retrieving the receipt details."

The transfer itself was successful (reference: `5133301K7FQP6RNEE91BDBB73`), but the receipt could not be retrieved.

## Root Cause

The `handleViewReceipt` function in `ModernAIChatScreen.tsx` was manually constructing the API URL incorrectly:

```typescript
// ❌ BEFORE: Incorrect URL construction
const response = await fetch(`${ENV_CONFIG.API_BASE_URL}/api/transfers/${reference}`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': 'fmfb',
  },
});
```

### Issues:
1. **Double /api prefix**: `ENV_CONFIG.API_BASE_URL` may already include `/api`, leading to URLs like `/api/api/transfers/...`
2. **Manual auth headers**: Not using the standardized `APIService` which handles authentication, tenant headers, and error handling automatically
3. **No error handling**: Raw fetch doesn't handle token refresh or standardized error responses

## Solution

### 1. Use Proper APIService Method

Replace manual fetch with the existing `APIService.getTransferByReference()` method which handles:
- ✅ Proper URL construction with `makeRequest()` helper
- ✅ Automatic authentication headers
- ✅ Automatic tenant ID headers
- ✅ Token refresh logic
- ✅ Standardized error handling
- ✅ Type-safe response

```typescript
// ✅ AFTER: Using APIService.getTransferByReference()
const transferData = await APIService.getTransferByReference(reference);
```

This method already exists in the APIService (line 713 of `/src/services/api.ts`) and returns properly typed transfer data.

### 2. Fallback Reference Extraction

Added a fallback mechanism to extract the transfer reference from chat messages if the in-memory reference is lost (e.g., page refresh):

```typescript
// Try to extract reference from the last message if lastTransferReference is not set
let referenceToUse = lastTransferReference;

if (!referenceToUse && messages.length > 0) {
  // Look for reference in recent messages
  for (let i = messages.length - 1; i >= Math.max(0, messages.length - 5); i--) {
    const msg = messages[i];
    if (msg.sender === 'ai' && msg.text) {
      // Match reference pattern: 25 characters alphanumeric
      const refMatch = msg.text.match(/Reference:\s*([A-Z0-9]{25})/i);
      if (refMatch) {
        referenceToUse = refMatch[1];
        break;
      }
    }
  }
}
```

This ensures receipt viewing works even if:
- Component remounts
- Page is refreshed
- State is lost for any reason

### 3. Date Field Mapping

The backend returns `initiatedAt` and `completedAt` fields, but the frontend was looking for `createdAt`:

```typescript
// ❌ BEFORE
Date: ${new Date(transfer.createdAt).toLocaleString()}

// ✅ AFTER: Use correct field with fallback
const transactionDate = transfer.initiatedAt || transfer.completedAt || new Date();
Date: ${new Date(transactionDate).toLocaleString()}
```

## Backend Endpoint

The receipt endpoint exists at `/api/transfers/:idOrReference` (lines 1632-1703 in `server/routes/transfers.ts`):

```typescript
router.get('/:idOrReference', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  const { idOrReference } = req.params;
  const userId = req.user.id;
  const tenantId = req.user.tenantId;

  // Query transfer by ID or reference
  const transferResult = await dbManager.queryTenant(tenantId, `
    SELECT t.*,
           u.first_name as sender_first_name,
           u.last_name as sender_last_name,
           u.account_number as sender_account_number
    FROM tenant.transfers t
    LEFT JOIN tenant.users u ON t.sender_id = u.id
    WHERE (
      t.id::text = $1
      OR COALESCE(t.reference, '') = $1
    )
    AND (t.sender_id = $2 OR t.recipient_user_id = $2)
    LIMIT 1
  `, [idOrReference, userId]);

  // ... returns formatted receipt data
});
```

## API Response Format

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "reference": "5133301K7FQP6RNEE91BDBB73",
    "type": "debit",
    "status": "successful",
    "amount": 40000,
    "currency": "NGN",
    "fees": 0,
    "totalAmount": 40000,
    "sender": {
      "name": "Admin User",
      "accountNumber": "6473826915",
      "bankName": "Firstmidas Microfinance Bank",
      "bankCode": "51333"
    },
    "recipient": {
      "name": "John Doe",
      "accountNumber": "1234567890",
      "bankName": "Access Bank",
      "bankCode": "000013"
    },
    "description": "Transfer from OrokiiPay",
    "transactionHash": "5133301K7FQP6RNEE91BDBB73",
    "initiatedAt": "2025-10-13T05:30:00.000Z",
    "completedAt": "2025-10-13T05:30:01.000Z"
  }
}
```

## Receipt Display Format

The receipt is formatted as a clean, readable message in the chat:

```
📄 **Transfer Receipt**

✅ Status: SUCCESSFUL

**Transaction Details**
Reference: 5133301K7FQP6RNEE91BDBB73
Date: 10/13/2025, 5:30:00 AM
Amount: ₦40,000
Fee: ₦0
Total: ₦40,000

**Recipient**
Name: John Doe
Account: 1234567890
Bank: Access Bank

**Sender**
Name: Admin User
Account: 6473826915
Bank: Firstmidas Microfinance Bank

Description: Transfer from OrokiiPay

Thank you for using our service!
```

## Files Changed

### `/src/screens/ModernAIChatScreen.tsx` (Lines 367-443)

**Changes:**
1. Replaced manual `fetch()` with `APIService.get()`
2. Removed manual header construction
3. Updated date field mapping to use `initiatedAt`/`completedAt`
4. Simplified error handling

## Testing

### Test Receipt Retrieval

1. Complete a transfer via AI chat
2. Note the transfer reference (e.g., `5133301K7FQP6RNEE91BDBB73`)
3. Click "View receipt" button
4. Verify receipt displays with all details:
   - ✅ Status
   - ✅ Reference
   - ✅ Date and time
   - ✅ Amount, fee, total
   - ✅ Sender details (name, account, bank)
   - ✅ Recipient details (name, account, bank)
   - ✅ Description

### Test Cases

- [x] View receipt immediately after successful transfer
- [x] View receipt for failed transfer (should show failure status)
- [x] View receipt for pending transfer (should show pending status)
- [x] Handle network error gracefully
- [x] Handle invalid reference gracefully
- [x] Receipt displays correct date/time
- [x] Receipt displays correct amounts
- [x] Receipt displays correct bank names

## Benefits

1. **Consistent API Calls**: All API requests now use `APIService` for consistency
2. **Better Error Handling**: Automatic token refresh and standardized error responses
3. **Simpler Code**: Less boilerplate, easier to maintain
4. **Proper URL Construction**: No more manual URL building
5. **Type Safety**: `APIService` provides better TypeScript support

## Related Files

- `/src/screens/ModernAIChatScreen.tsx` - AI chat interface
- `/server/routes/transfers.ts` - Transfer endpoints
- `/src/services/api.ts` - APIService implementation
- `/src/config/environment.ts` - URL configuration

## Related Documentation

- [Conversational Transfer Flow](./CONVERSATIONAL_TRANSFER_FLOW.md)
- [PIN Input Security](./AI_CHAT_PIN_AND_RECEIPT_FIXES.md)
- [Voice Transfer Flow](./VOICE_TRANSFER_FLOW.md)
- [AI Assistant Enhancements](./AI_ASSISTANT_ENHANCEMENTS_SUMMARY.md)

## Deployment Notes

After deploying this fix:
1. Clear browser cache or do a hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
2. Test receipt viewing for both new and historical transfers
3. Verify all receipt fields display correctly
4. Check that error states are handled gracefully
