// /api/pay.js
export default async function handler(req, res) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  const products = {
    [process.env.PRODUCT_1_ID]: { 
      amount: parseInt(process.env.PRODUCT_1_AMOUNT), 
      description: process.env.PRODUCT_1_DESCRIPTION 
    },
    [process.env.PRODUCT_2_ID]: { 
      amount: parseInt(process.env.PRODUCT_2_AMOUNT), 
      description: process.env.PRODUCT_2_DESCRIPTION 
    },
    [process.env.PRODUCT_3_ID]: { 
      amount: parseInt(process.env.PRODUCT_3_AMOUNT), 
      description: process.env.PRODUCT_3_DESCRIPTION 
    }
  };

  const product = products[productId];
  if (!product) return res.status(400).json({ error: 'Invalid product ID' });

  const MONOBANK_TOKEN = process.env.MONOBANK_TOKEN;
  const SUCCESS_URL = process.env.SUCCESS_URL;

  if (!MONOBANK_TOKEN) {
    return res.status(500).json({ error: 'Monobank token is not configured' });
  }

  if (!SUCCESS_URL) {
    return res.status(500).json({ error: 'Success URL is not configured' });
  }

  try {
    const response = await fetch('https://api.monobank.ua/api/merchant/invoice/create', {
      method: 'POST',
      headers: {
        'X-Token': MONOBANK_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: product.amount,
        ccy: 980,
        merchantPaymInfo: {
          reference: `order-${Date.now()}`,
          destination: product.description
        },
        redirectUrl: SUCCESS_URL
      })
    });

    if (!response.ok) {
      throw new Error(`Monobank API error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.pageUrl) throw new Error('Invalid response from Monobank');

    res.status(200).json({ url: data.pageUrl });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Payment initiation failed', details: error.message });
  }
}
