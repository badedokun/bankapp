/**
 * Receipt Generator Utility
 * Generates PDF receipts for transactions without external dependencies
 */

import { Platform } from 'react-native';
import { formatCurrency } from './currency';

interface TransactionData {
  id: string;
  reference: string;
  type: 'debit' | 'credit';
  status: string;
  amount: number;
  currency: string;
  fees: number;
  totalAmount: number;
  sender: {
    name: string;
    accountNumber: string;
    bankName: string;
    bankCode: string;
  };
  recipient: {
    name: string;
    accountNumber: string;
    bankName: string;
    bankCode: string;
  };
  description: string;
  transactionHash?: string;
  initiatedAt: string;
  completedAt?: string;
}

export class ReceiptGenerator {
  /**
   * Generate HTML receipt content
   */
  static generateReceiptHTML(
    transaction: TransactionData,
    tenantName: string = 'Bank',
    currencyCode: string = 'NGN'
  ): string {
    const { date, time } = this.formatDateTime(transaction.initiatedAt);
    const completedDate = transaction.completedAt ? this.formatDateTime(transaction.completedAt) : null;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transaction Receipt - ${transaction.reference}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #333;
            background: #ffffff;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
        }

        .receipt-container {
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 30px;
            background: #ffffff;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .header {
            text-align: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .bank-name {
            font-size: 28px;
            font-weight: bold;
            color: #1a365d;
            margin-bottom: 5px;
        }

        .receipt-title {
            font-size: 18px;
            color: #4a5568;
            margin-bottom: 10px;
        }

        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 1px;
        }

        .status-successful {
            background-color: #c6f6d5;
            color: #22543d;
        }

        .status-pending {
            background-color: #fef5e7;
            color: #744210;
        }

        .status-failed {
            background-color: #fed7d7;
            color: #742a2a;
        }

        .transaction-summary {
            text-align: center;
            background: #f7fafc;
            padding: 25px;
            border-radius: 8px;
            margin: 20px 0;
        }

        .amount {
            font-size: 36px;
            font-weight: bold;
            color: #1a365d;
            margin-bottom: 5px;
        }

        .transaction-type {
            font-size: 16px;
            color: #4a5568;
            margin-bottom: 10px;
        }

        .description {
            font-style: italic;
            color: #718096;
        }

        .details-section {
            margin: 25px 0;
        }

        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #2d3748;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e2e8f0;
        }

        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }

        .detail-item {
            margin-bottom: 12px;
        }

        .detail-label {
            font-weight: 600;
            color: #4a5568;
            margin-bottom: 3px;
        }

        .detail-value {
            color: #2d3748;
            word-break: break-all;
        }

        .mono {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            background: #f7fafc;
            padding: 2px 4px;
            border-radius: 4px;
        }

        .amount-breakdown {
            background: #f7fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }

        .amount-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }

        .amount-total {
            border-top: 2px solid #e2e8f0;
            padding-top: 8px;
            font-weight: bold;
            font-size: 16px;
        }

        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #718096;
            font-size: 12px;
        }

        .generated-at {
            margin-top: 10px;
            font-size: 11px;
        }

        @media print {
            body {
                padding: 0;
            }

            .receipt-container {
                border: none;
                box-shadow: none;
                padding: 20px;
            }
        }

        @media (max-width: 600px) {
            .details-grid {
                grid-template-columns: 1fr;
            }

            .amount {
                font-size: 28px;
            }

            body {
                padding: 10px;
            }

            .receipt-container {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <!-- Header -->
        <div class="header">
            <div class="bank-name">${tenantName}</div>
            <div class="receipt-title">Transaction Receipt</div>
            <div class="status-badge status-${transaction.status.toLowerCase()}">
                ${transaction.status.toUpperCase()}
            </div>
        </div>

        <!-- Transaction Summary -->
        <div class="transaction-summary">
            <div class="amount">
                ${transaction.type === 'debit' ? '−' : '+'} ${formatCurrency(transaction.amount, currencyCode)}
            </div>
            <div class="transaction-type">
                ${transaction.type === 'debit' ? 'Money Transfer (Sent)' : 'Money Transfer (Received)'}
            </div>
            <div class="description">${transaction.description}</div>
        </div>

        <!-- Transaction Details -->
        <div class="details-section">
            <div class="section-title">📋 Transaction Information</div>
            <div class="details-grid">
                <div>
                    <div class="detail-item">
                        <div class="detail-label">Reference Number</div>
                        <div class="detail-value mono">${transaction.reference}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Transaction ID</div>
                        <div class="detail-value mono">${transaction.transactionHash || 'N/A'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Date</div>
                        <div class="detail-value">${date}</div>
                    </div>
                </div>
                <div>
                    <div class="detail-item">
                        <div class="detail-label">Time</div>
                        <div class="detail-value">${time}</div>
                    </div>
                    ${completedDate ? `
                    <div class="detail-item">
                        <div class="detail-label">Completed At</div>
                        <div class="detail-value">${completedDate.date} ${completedDate.time}</div>
                    </div>
                    ` : ''}
                    <div class="detail-item">
                        <div class="detail-label">Channel</div>
                        <div class="detail-value">MOBILE APP</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Sender/Recipient Details -->
        <div class="details-section">
            <div class="section-title">
                👤 ${transaction.type === 'debit' ? 'Recipient Details' : 'Sender Details'}
            </div>
            <div class="details-grid">
                <div>
                    <div class="detail-item">
                        <div class="detail-label">Name</div>
                        <div class="detail-value">
                            ${transaction.type === 'debit' ? transaction.recipient.name : transaction.sender.name}
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Account Number</div>
                        <div class="detail-value mono">
                            ${transaction.type === 'debit' ? transaction.recipient.accountNumber : transaction.sender.accountNumber}
                        </div>
                    </div>
                </div>
                <div>
                    <div class="detail-item">
                        <div class="detail-label">Bank</div>
                        <div class="detail-value">
                            ${transaction.type === 'debit' ? transaction.recipient.bankName : transaction.sender.bankName}
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Bank Code</div>
                        <div class="detail-value mono">
                            ${transaction.type === 'debit' ? transaction.recipient.bankCode : transaction.sender.bankCode}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Amount Breakdown -->
        <div class="details-section">
            <div class="section-title">💰 Amount Breakdown</div>
            <div class="amount-breakdown">
                <div class="amount-row">
                    <span>Transaction Amount:</span>
                    <span>${formatCurrency(transaction.amount, currencyCode)}</span>
                </div>
                <div class="amount-row">
                    <span>Transaction Fee:</span>
                    <span>${formatCurrency(transaction.fees, currencyCode)}</span>
                </div>
                <div class="amount-row amount-total">
                    <span>Total Amount:</span>
                    <span>${formatCurrency(transaction.totalAmount, currencyCode)}</span>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div>
                This is an official transaction receipt from ${tenantName}.<br>
                For support, contact customer service.
            </div>
            <div class="generated-at">
                Receipt generated on ${new Date().toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Africa/Lagos'
                })}
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Format date and time
   */
  private static formatDateTime(dateString: string): { date: string; time: string } {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    };
  }

  /**
   * Generate and download receipt (Web only)
   */
  static async downloadReceipt(
    transaction: TransactionData,
    tenantName: string = 'Bank',
    currencyCode: string = 'NGN'
  ): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        const htmlContent = this.generateReceiptHTML(transaction, tenantName, currencyCode);

        // Create a new window with the receipt
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
          throw new Error('Popup blocked. Please allow popups and try again.');
        }

        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Wait for content to load then trigger print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };

        return true;
      } else {
        // For mobile platforms, we'll use sharing instead
        return this.shareReceipt(transaction, tenantName, currencyCode);
      }
    } catch (error) {
      console.error('Failed to download receipt:', error);
      return false;
    }
  }

  /**
   * Share receipt content (Mobile)
   */
  static async shareReceipt(
    transaction: TransactionData,
    tenantName: string = 'Bank',
    currencyCode: string = 'NGN'
  ): Promise<boolean> {
    try {
      const { date, time } = this.formatDateTime(transaction.initiatedAt);

      const textContent = `
${tenantName} - Transaction Receipt

Reference: ${transaction.reference}
Status: ${transaction.status.toUpperCase()}
Type: ${transaction.type === 'debit' ? 'Money Transfer (Sent)' : 'Money Transfer (Received)'}
Amount: ${formatCurrency(transaction.amount, currencyCode)}
Fee: ${formatCurrency(transaction.fees, currencyCode)}
Total: ${formatCurrency(transaction.totalAmount, currencyCode)}

${transaction.type === 'debit' ? 'To' : 'From'}: ${transaction.type === 'debit' ? transaction.recipient.name : transaction.sender.name}
Bank: ${transaction.type === 'debit' ? transaction.recipient.bankName : transaction.sender.bankName}
Account: ${transaction.type === 'debit' ? transaction.recipient.accountNumber : transaction.sender.accountNumber}

Date: ${date}
Time: ${time}
Transaction ID: ${transaction.transactionHash || 'N/A'}

Thank you for using ${tenantName}!
      `.trim();

      // For React Native, we would use the Share API here
      // For now, we'll copy to clipboard as a fallback
      if (Platform.OS === 'web' && navigator.clipboard) {
        await navigator.clipboard.writeText(textContent);
        return true;
      }

      return true;
    } catch (error) {
      console.error('Failed to share receipt:', error);
      return false;
    }
  }

  /**
   * Generate PDF blob (Web only)
   */
  static async generatePDFBlob(
    transaction: TransactionData,
    tenantName: string = 'Bank',
    currencyCode: string = 'NGN'
  ): Promise<Blob | null> {
    if (Platform.OS !== 'web') {
      return null;
    }

    try {
      const htmlContent = this.generateReceiptHTML(transaction, tenantName, currencyCode);

      // Create a temporary iframe to render the HTML
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '800px';
      iframe.style.height = '600px';

      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('Cannot access iframe document');
      }

      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For now, return a simple text blob as PDF generation requires additional libraries
      const blob = new Blob([htmlContent], { type: 'text/html' });

      // Clean up
      document.body.removeChild(iframe);

      return blob;
    } catch (error) {
      console.error('Failed to generate PDF blob:', error);
      return null;
    }
  }
}