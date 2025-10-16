/**
 * Banks API Route
 * Provides list of Nigerian banks for external transfers
 */

import { Router } from 'express';

const router = Router();

// Nigerian banks list - this would typically come from NIBSS API
const NIGERIAN_BANKS = [
  { code: 'GTB', name: 'Guaranty Trust Bank', nipCode: '058' },
  { code: 'UBA', name: 'United Bank for Africa', nipCode: '033' },
  { code: 'FBN', name: 'First Bank of Nigeria', nipCode: '011' },
  { code: 'ZEN', name: 'Zenith Bank', nipCode: '057' },
  { code: 'ACC', name: 'Access Bank', nipCode: '044' },
  { code: 'STB', name: 'Sterling Bank', nipCode: '232' },
  { code: 'UNI', name: 'Union Bank', nipCode: '032' },
  { code: 'POL', name: 'Polaris Bank', nipCode: '076' },
  { code: 'KEY', name: 'Keystone Bank', nipCode: '082' },
  { code: 'ECO', name: 'Ecobank Nigeria', nipCode: '050' },
  { code: 'FID', name: 'Fidelity Bank', nipCode: '070' },
  { code: 'HER', name: 'Heritage Bank', nipCode: '030' },
  { code: 'STD', name: 'Standard Chartered Bank', nipCode: '068' },
  { code: 'CIT', name: 'Citibank Nigeria', nipCode: '023' },
  { code: 'WEM', name: 'Wema Bank', nipCode: '035' },
  { code: 'SUN', name: 'Suntrust Bank', nipCode: '100' },
  { code: 'PRO', name: 'Providus Bank', nipCode: '101' },
  { code: 'JAI', name: 'Jaiz Bank', nipCode: '301' },
  { code: 'TAJ', name: 'TAJ Bank', nipCode: '302' },
  { code: 'GLO', name: 'Globus Bank', nipCode: '103' },
  { code: 'TIT', name: 'Titan Trust Bank', nipCode: '102' },
  { code: 'PAY', name: 'Paycom', nipCode: '999991' },
  { code: 'FET', name: 'FETS', nipCode: '999992' },
  { code: 'MKF', name: 'MKudi', nipCode: '999993' },
  { code: 'OPY', name: 'OPay', nipCode: '999994' },
  { code: 'PAL', name: 'PalmPay', nipCode: '999995' },
  { code: 'KUD', name: 'Kuda Bank', nipCode: '999996' },
  { code: 'RUB', name: 'Rubies Bank', nipCode: '999997' },
  { code: 'VFD', name: 'VFD Microfinance Bank', nipCode: '566' },
  { code: 'MNT', name: 'Mint Bank', nipCode: '999998' },
  { code: 'CAR', name: 'Carbon', nipCode: '999999' },
  { code: 'FMF', name: 'First Multiple MFB', nipCode: '999990' }
];

/**
 * GET /api/banks
 * Get list of available banks for transfers
 */
router.get('/', async (_req, res) => {
  try {
    res.json({
      success: true,
      data: NIGERIAN_BANKS,
      message: 'Banks retrieved successfully'
    });
  } catch (error: any) {
    console.error('Get banks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve banks',
      error: error.message
    });
  }
});

/**
 * GET /api/banks/:code
 * Get specific bank by code
 */
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const bank = NIGERIAN_BANKS.find(b => b.code === code.toUpperCase());

    if (!bank) {
      return res.status(404).json({
        success: false,
        message: 'Bank not found'
      });
    }

    res.json({
      success: true,
      data: bank
    });
  } catch (error: any) {
    console.error('Get bank error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bank',
      error: error.message
    });
  }
});

export default router;