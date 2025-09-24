# Production Money Transfer Endpoints - NIBSS EasyPay Integration

**Document Version:** 1.0
**Date:** September 23, 2025
**API Base URL (Test):** https://apitest.nibss-plc.com.ng/nipservice/v1

---

## Overview

This document outlines the key NIBSS EasyPay endpoints required for complete production money transfer functionality. The NIBSS EasyPay is a RESTful service that enables financial intermediaries to perform online real-time transactions.

## Authentication

**Type:** Bearer Token (JWT)
**Header:** `Authorization: Bearer {token}`

**Credentials Required:**
- **CLIENT_ID** - Unique identifier assigned to the institution
- **CLIENT_SECRET** - Password for authentication token generation

**How to Obtain Credentials:**
Fill out the [REQUEST CREDENTIALS FORM](https://forms.office.com/pages/responsepage.aspx?id=G3ucJwa6e0KmgcilSS0pPcemIqHoBy9KvH3iwjGMrclUMTY5VVA5NEowUFJNMVJJRk40TlZMSkpVQy4u&origin=lprLink&route=shorturl)

---

## Core Transfer Endpoints

### 1. Name Enquiry (NE)
**Purpose:** Confirm beneficiary account name before transfer
**Endpoint:** `POST /nip/nameenquiry`
**Required Before:** Fund Transfer

#### Request Body
```json
{
  "accountNumber": "0112345678",
  "channelCode": "1",
  "destinationInstitutionCode": "999998",
  "transactionId": "000034220608111630100001000001"
}
```

#### Response (Success - 200)
```json
{
  "responseCode": "00",
  "sessionID": "999999220608140828280645462287",
  "transactionId": "000034220608140800123456789012",
  "channelCode": "1",
  "destinationInstitutionCode": "999998",
  "accountNumber": "112345678",
  "bankVerificationNumber": "33333333332",
  "accountName": "vee Test",
  "kycLevel": "1"
}
```

#### Key Fields
- **accountNumber** (10-digit NUBAN)
- **channelCode** (1-12, see Channel Codes section)
- **destinationInstitutionCode** (6-digit NIBSS bank code)
- **transactionId** (30-digit unique ID: Client code + YYMMDDHHMMSS + 12 random digits)

---

### 2. Fund Transfer (FT)
**Purpose:** Transfer funds from originator to beneficiary account
**Endpoint:** `POST /nip/fundstransfer`

#### Request Body
```json
{
  "amount": "100",
  "beneficiaryAccountName": "John Doe",
  "beneficiaryAccountNumber": "0112345678",
  "beneficiaryBankVerificationNumber": "22222222226",
  "beneficiaryKYCLevel": "1",
  "channelCode": "1",
  "originatorAccountName": "Vee Test",
  "originatorAccountNumber": "112345678",
  "originatorKYCLevel": "1",
  "mandateReferenceNumber": "MA-0112345678-2022315-53097",
  "paymentReference": "1/999999191106195503191106195503/6015007956/0231116887",
  "transactionLocation": "1.38716,3.05117",
  "originatorNarration": "Payment from 0112345678 to 1780004070",
  "beneficiaryNarration": "Payment to 0112345678 from 1780004070",
  "billerId": "ADC19BDC-7D3A-4C00-4F7B-08DA06684F59",
  "destinationInstitutionCode": "999998",
  "sourceInstitutionCode": "999998",
  "transactionId": "000034220608141930350786190072",
  "originatorBankVerificationNumber": "33333333333",
  "nameEnquiryRef": "999999191106195503191106195503",
  "InitiatorAccountName": "Test Account Name",
  "InitiatorAccountNumber": "0012332100"
}
```

#### Response (Success - 200)
```json
{
  "responseCode": "00",
  "sessionID": "999999220608140828280645462287",
  "transactionId": "000034220608141930350786190072",
  "channelCode": "1",
  "nameEnquiryRef": "9.999992206081408e+29",
  "destinationInstitutionCode": "999998",
  "beneficiaryAccountName": "Ake Mobolaji Temabo",
  "beneficiaryAccountNumber": "'1780004070'",
  "amount": "100"
}
```

#### Critical Fields
- **amount** (Min: 1 Naira, Max: 10,000,000 Naira)
- **mandateReferenceNumber** (Required - obtained from NIBSS Direct Debit)
- **nameEnquiryRef** (sessionID from Name Enquiry response)
- **transactionLocation** (GPS coordinates: latitude,longitude)
- **paymentReference** (Max 50 chars, alphanumeric only)
- **billerId** (UUID assigned after NIBSS Direct Debit profiling)

---

### 3. Transaction Status Query (TSQ)
**Purpose:** Confirm status of Fund Transfer transaction
**Endpoint:** `POST /nip/tsq`

#### Request Body
```json
{
  "transactionId": "000034220608140800123456789012"
}
```

#### Response (Success - 200)
```json
{
  "responseCode": "00",
  "sessionID": "999999220608140828280645462287",
  "transactionId": "000034220608140800123456789012",
  "channelCode": "1",
  "sourceInstitutionCode": "999998"
}
```

#### Important TSQ Rules
1. **Only call TSQ after receiving Fund Transfer response**
2. **If no response:** Wait 60 seconds before first TSQ
3. **Response code 25** (Unable to locate record) = Transaction not in NIBSS
4. **Maximum retries:** 3 attempts with 60-second intervals
5. **Query window:** Transactions available for TSQ for 24 hours only
6. **Never reverse** without definite status confirmation

---

### 4. Balance Enquiry (BE)
**Purpose:** Retrieve account balance
**Endpoint:** `POST /nip/balanceenquiry`

#### Request Body
```json
{
  "channelCode": "1",
  "targetAccountName": "vee Test",
  "targetAccountNumber": "0112345678",
  "targetBankVerificationNumber": "33333333333",
  "authorizationCode": "MA-0112345678-2022315-53097",
  "destinationInstitutionCode": "888564",
  "billerId": "ADC19BDC-7D3A-4C00-4F7B-08DA06684F59",
  "transactionId": "000034220608141930350786190072"
}
```

#### Response (Success - 200)
```json
{
  "responseCode": "00",
  "sessionID": "999999220608140828280645462287",
  "transactionId": "000034220608140800123456789012",
  "channelCode": "1",
  "destinationInstitutionCode": "999998",
  "authorizationCode": "NIPMINI1/1647351897985",
  "targetAccountName": "vee Test",
  "targetBankVerificationNumber": "33333333333",
  "targetAccountNumber": "0112345678",
  "availableBalance": "561100555602.82"
}
```

---

### 5. Get Financial Institutions
**Purpose:** Retrieve list of banks and financial institutions
**Endpoint:** `GET /nip/institutions`

#### Response (Success - 200)
```json
[
  {
    "institutionCode": "999001",
    "institutionName": "ADH",
    "category": 3,
    "categoryCode": "3"
  }
]
```

---

## Channel Codes

| Code | Channel Description |
|------|---------------------|
| 1 | Bank Teller |
| 2 | Internet Banking |
| 3 | Mobile Phones |
| 4 | POS Terminals |
| 5 | ATM |
| 6 | Vendor/Merchant Web Portal |
| 7 | Third-Party Payment Platform |
| 8 | USSD |
| 9 | Other Channels |
| 10 | Social Media |
| 11 | Agency Banking |
| 12 | NQR |

---

## Response Codes

### Success Codes
- **00** - Successful transaction

### Common Error Codes
| Code | Description |
|------|-------------|
| 01 | Status unknown, please wait for settlement report |
| 03 | Invalid Sender |
| 05 | Do not honor |
| 06 | Dormant Account |
| 07 | Invalid Account |
| 08 | Account Name Mismatch |
| 09 | Request processing in progress |
| 12 | Invalid transaction |
| 13 | Invalid Amount |
| 25 | Unable to locate record |
| 26 | Duplicate record |
| 34 | Suspected fraud |
| 51 | Insufficient funds |
| 57 | Transaction not permitted to sender |
| 61 | Transfer limit Exceeded |
| 63 | Security violation |
| 91 | Beneficiary Bank not available |
| 94 | Duplicate transaction |
| 96 | System malfunction |
| A1 | Client disabled |
| A4 | Empty value |
| A5 | Invalid value |
| A9 | Unable to process request, please try again |

---

## Production Transfer Flow

### Complete Transaction Sequence

1. **Pre-Transfer Validation**
   ```
   GET /nip/institutions → Get bank codes
   ```

2. **Name Verification**
   ```
   POST /nip/nameenquiry → Verify beneficiary name
   → Store sessionID for nameEnquiryRef
   ```

3. **Execute Transfer**
   ```
   POST /nip/fundstransfer → Transfer funds
   → Include nameEnquiryRef from step 2
   → Store transactionId for status check
   ```

4. **Confirm Status** (if needed)
   ```
   POST /nip/tsq → Check transaction status
   → Use transactionId from step 3
   ```

5. **Balance Check** (optional)
   ```
   POST /nip/balanceenquiry → Verify balance after transfer
   ```

---

## Transaction ID Format

**Formula:** `Client Code (6) + DateTime (12) + Random (12) = 30 digits`

**Example:** `000034220608141930350786190072`
- Client code: `000034` (assigned by NIBSS)
- Date/Time: `220608141930` (YYMMDDHHMMSS format)
- Random: `350786190072` (12-digit random number)

---

## Session ID Format

**Formula:** `Bank Code (6) + DateTime (12) + Random (12) = 30 digits`

**Example:** `999999220608140828280645462287`
- Bank code: `999999` (sender's bank)
- Date/Time: `220608140828` (YYMMDDHHMMSS format)
- Random: `280645462287` (12-digit unique number)

---

## Prerequisites for Production

### 1. NIBSS Direct Debit Profiling
- **Required for:** Fund Transfer and Balance Enquiry
- **Contact:** certification@nibss-plc.com.ng
- **Provides:**
  - Biller ID (UUID)
  - Mandate Reference Numbers
  - Authorization Codes

### 2. Client Credentials
- **CLIENT_ID** - From NIBSS Developer Portal
- **CLIENT_SECRET** - For JWT token generation

### 3. Institution Codes
- **Source Institution Code** - Your bank's 6-digit code
- **Destination Institution Code** - Recipient bank's code

---

## Security Requirements

1. **Bearer Token Authentication** - All endpoints require valid JWT
2. **BVN Validation** - 11-digit Bank Verification Number required
3. **KYC Level** - Know Your Customer level (1-3)
4. **Mandate Authorization** - Required for debits
5. **Transaction Location** - GPS coordinates for fraud detection

---

## Error Handling Best Practices

1. **Response Code 09** (Processing) - Wait and use TSQ
2. **Response Code 25** (No record) - Wait 60s, retry max 3 times
3. **Response Code 26** (Duplicate) - Check transaction history
4. **Response Code 51** (Insufficient funds) - Notify user
5. **Response Code 94** (Duplicate transaction) - Do not retry

---

## Support Contacts

- **Technical Support:** technicalimplementation@nibss-plc.com.ng
- **Certification Support:** certification@nibss-plc.com.ng
- **Help Center:** https://contactcentre.nibss-plc.com.ng/support/home
- **Terms of Service:** https://www.nibss-plc.com.ng/services/terms-of-use/

---

## Implementation Checklist

- [ ] Obtain CLIENT_ID and CLIENT_SECRET from NIBSS
- [ ] Complete NIBSS Direct Debit profiling
- [ ] Receive Biller ID and institution codes
- [ ] Implement Bearer Token authentication
- [ ] Build Name Enquiry validation flow
- [ ] Implement Fund Transfer with mandate verification
- [ ] Add Transaction Status Query with retry logic
- [ ] Implement Balance Enquiry (optional)
- [ ] Get Financial Institutions list for bank codes
- [ ] Handle all response codes appropriately
- [ ] Implement 60-second wait for TSQ retries
- [ ] Add transaction logging and audit trail
- [ ] Test all endpoints in test environment
- [ ] Implement reversal logic based on TSQ results
- [ ] Add GPS location tracking for transactions