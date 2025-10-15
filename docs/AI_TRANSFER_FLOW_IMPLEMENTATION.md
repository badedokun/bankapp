# AI-Initiated Transfer Flow - Implementation Guide

## Overview

Implemented intelligent AI assistant that can understand transfer intents from natural language (text or voice) and guide users through secure transfer execution.

## Problem Solved

**Before:** AI Assistant could only provide information but couldn't help execute transfers. When users said "Transfer ₦5,000 to John", the AI would just say "I can help with transfers, please use the transfer screen."

**After:** AI Assistant now:
1. Understands transfer intent from natural language
2. Extracts parameters (amount, recipient, account number)
3. Guides users through secure transfer flow
4. Directs to appropriate screens with pre-filled information

## Architecture

### 1. Intent Classification (`IntentClassificationService.ts`)
- Uses TensorFlow.js for ML-based intent detection
- Recognizes intents: `transfer_money`, `bill_payment`, `account_balance`, etc.
- Supports Nigerian languages (Yoruba, Igbo, Hausa keywords)
- Extracts entities: amounts, account numbers, recipient names

### 2. Customer Data Service (`CustomerDataService.ts`)
- Classifies query types: balance, transactions, spending, savings, **transfers**, bills
- Routes informational queries to real database data
- Routes actionable queries to AIActionsService

### 3. AI Actions Service (`AIActionsService.ts`) - **NEW**
Handles actionable intents that require user interaction:

```typescript
interface AIActionResponse {
  action: 'transfer_money' | 'bill_payment' | ...
  status: 'ready' | 'needs_confirmation' | 'needs_info' | 'executed' | 'error'
  message: string
  data?: any
  nextStep?: 'collect_transfer_info' | 'navigate_to_transfer' | ...
  requiredFields?: string[]
  suggestions?: string[]
}
```

#### Transfer Intent Processing Flow

**Step 1: Parameter Extraction**
```
User: "Send ₦5,000 to John Smith account 0123456789"

Extracted:
- amount: 5000
- recipientName: "John Smith"
- recipientAccount: "0123456789"
```

**Step 2: Validation**
- Checks for missing fields
- If missing: Prompts user with contextual suggestions
- If complete: Prepares confirmation message

**Step 3: Confirmation**
```
Response: "I can help you transfer ₦5,000 to John Smith (0123456789).

To complete this transfer, please go to the Transfer Money screen where you can:
1. Verify the recipient details
2. Enter your transaction PIN
3. Complete the secure transfer

Would you like me to take you to the Transfer Money screen?"

Suggestions: ["Yes, take me to transfers", "No, cancel this", "Change the amount"]
```

**Step 4: Navigation**
- Frontend receives `action.nextStep = 'navigate_to_transfer'`
- Frontend navigates to Transfer screen
- Pre-fills form with extracted data

## Natural Language Patterns Supported

### Transfer Money Examples

1. **Amount + Recipient Name**
   - "Transfer ₦5,000 to John"
   - "Send 10000 naira to Jane Smith"
   - "Pay N50,000 to David Wilson"

2. **Amount + Account Number**
   - "Transfer ₦5,000 to 0123456789"
   - "Send 10000 to account 0987654321"

3. **Full Details**
   - "Transfer ₦5,000 to John account 0123456789"
   - "Send 10000 naira to Jane Smith 0987654321 for rent"

4. **Partial Information** (AI will prompt for missing)
   - "Transfer money to John" → Prompts for amount
   - "Send ₦5,000" → Prompts for recipient
   - "Transfer money" → Prompts for amount and recipient

### Bill Payment Examples

1. **Bill Type**
   - "Pay my electricity bill"
   - "Buy airtime"
   - "Pay for cable TV"
   - "Pay water bill"

2. **Amount + Bill Type**
   - "Pay ₦5,000 electricity bill"
   - "Buy ₦1,000 airtime"

## Implementation Details

### Backend Integration (`/server/routes/ai-chat.ts`)

```typescript
// 1. Classify query type
const queryType = CustomerDataService.classifyQuery(message);

// 2. Check if actionable intent
if (queryType === 'transfers' || queryType === 'bills') {
  // 3. Process action
  const actionResponse = await AIActionsService.processActionIntent(
    intentMap[queryType],
    userId,
    message,
    {}
  );

  // 4. Return structured response
  response = {
    response: actionResponse.message,
    intent: actionResponse.action,
    suggestions: actionResponse.suggestions,
    data: actionResponse.data,
    action: {
      type: actionResponse.action,
      status: actionResponse.status,
      nextStep: actionResponse.nextStep,
      requiredFields: actionResponse.requiredFields
    }
  };
}
```

### Frontend Integration (Required)

The frontend needs to handle the `action` object in AI responses:

```typescript
interface AIResponse {
  response: string;
  suggestions: string[];
  data?: any;
  action?: {
    type: 'transfer_money' | 'bill_payment';
    status: 'needs_confirmation' | 'needs_info';
    nextStep: 'navigate_to_transfer' | 'collect_transfer_info';
    requiredFields?: string[];
  };
}

// Handle AI response
if (aiResponse.action?.nextStep === 'navigate_to_transfer') {
  // Navigate to transfer screen with pre-filled data
  navigation.navigate('Transfer', {
    prefill: aiResponse.data
  });
}
```

## Security Considerations

✅ **No Direct Transfer Execution**: AI never executes transfers directly
✅ **PIN Required**: All transfers require user PIN on transfer screen
✅ **Fraud Detection**: Existing fraud detection still applies
✅ **User Confirmation**: AI always asks for confirmation before navigation
✅ **Audit Trail**: All AI-initiated transfers logged with `ai_initiated: true` flag

## Voice Support

Works seamlessly with voice input:
1. Voice-to-text converts speech to text
2. Same NLP processing as text
3. Text-to-speech reads AI response
4. User confirms with voice or tap

## Testing Examples

### Test Case 1: Complete Transfer Information
```
Input: "Transfer ₦5,000 to John Smith account 0123456789"
Expected: Confirmation message with navigation prompt
```

### Test Case 2: Partial Information
```
Input: "Transfer money to John"
Expected: "I can help! Amount: Not specified. I need: Amount. Please provide..."
```

### Test Case 3: Amount Only
```
Input: "Send ₦5,000"
Expected: "I can help! Amount: ₦5,000. I need: Recipient account number, Recipient name..."
```

### Test Case 4: Bill Payment
```
Input: "Pay my electricity bill"
Expected: "I can help you pay your electricity bill. Please use the Bill Payment screen to: 1. Select provider..."
```

## Database Schema Updates

No schema changes required. Uses existing transaction tracking:

```sql
-- Existing fields in tenant.transactions
ai_initiated: boolean DEFAULT false
voice_initiated: boolean DEFAULT false
natural_language_command: text
ai_confidence: numeric(5,4)
ai_processing_metadata: jsonb
```

When a transfer is completed via AI flow, these fields are populated:
```typescript
{
  ai_initiated: true,
  voice_initiated: req.body.voiceInitiated || false,
  natural_language_command: "Transfer ₦5,000 to John Smith",
  ai_confidence: 0.95,
  ai_processing_metadata: {
    intent: 'transfer_money',
    extracted_params: {
      amount: 5000,
      recipientName: "John Smith",
      recipientAccount: "0123456789"
    },
    processing_time_ms: 245
  }
}
```

## Future Enhancements

1. **Multi-step Conversations**
   - Remember context across messages
   - "Transfer ₦5,000" → "To John" → "Yes, proceed"

2. **Smart Recipient Suggestions**
   - "Transfer to John" → Shows John's saved accounts
   - Learns from transaction history

3. **Voice-First Optimization**
   - Shorter, more conversational responses
   - "Done! I've sent ₦5,000 to John."

4. **Proactive Suggestions**
   - "You usually pay electricity on the 15th. Would you like to pay now?"
   - "You have ₦50,000 available. Consider saving ₦10,000?"

## Files Created/Modified

### New Files
- `/server/services/ai-intelligence-service/AIActionsService.ts` - Handles actionable intents

### Modified Files
- `/server/routes/ai-chat.ts` - Integrated AIActionsService
- `/server/services/ai-intelligence-service/CustomerDataService.ts` - Fixed transaction type filters

### Documentation
- `/docs/AI_TRANSFER_FLOW_IMPLEMENTATION.md` - This file
- `/docs/TRANSACTION_STATUS_FIX_SUMMARY.md` - Related transaction status fix

## API Response Example

```json
{
  "response": "I can help you transfer ₦5,000.00 to John Smith (0123456789).\n\nTo complete this transfer, please go to the Transfer Money screen where you can:\n1. Verify the recipient details\n2. Enter your transaction PIN\n3. Complete the secure transfer\n\nWould you like me to take you to the Transfer Money screen?",
  "confidence": 0.95,
  "intent": "transfer_money",
  "suggestions": [
    "Yes, take me to transfers",
    "No, cancel this",
    "Change the amount"
  ],
  "data": {
    "amount": 5000,
    "recipientName": "John Smith",
    "recipientAccount": "0123456789",
    "formattedAmount": "₦5,000.00",
    "readyToExecute": true
  },
  "action": {
    "type": "transfer_money",
    "status": "needs_confirmation",
    "nextStep": "navigate_to_transfer",
    "requiredFields": []
  },
  "metadata": {
    "source": "ai_actions",
    "reason": "actionable_intent",
    "realData": true,
    "enrichedContext": true
  }
}
```

## Deployment Checklist

- [x] AIActionsService created
- [x] ai-chat.ts route updated
- [x] CustomerDataService query types fixed
- [x] Transaction status bug fixed (separate issue)
- [ ] Frontend navigation handlers
- [ ] Voice input testing
- [ ] Security audit
- [ ] User acceptance testing

## Date Completed

October 13, 2025

## Author

Claude Code (AI Assistant)
