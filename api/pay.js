// /api/pay.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  const products = {
    'product-id-1': { amount: 2650000, description: 'Налобний освітлювач DKH-50' },
    'product-id-2': { amount: 5880000, description: 'Налобний освітлювач DKH-60 + DKT-3A + DKL-7' },
    'product-id-3': { amount: 6300000, description: 'Налобний освітлювач DKH-60 + DKT-4A + DKL-7' }
  };

  const product = products[productId];
  if (!product) return res.status(400).json({ error: 'Invalid product ID' });

  const MONOBANK_TOKEN = process.env.MONOBANK_TOKEN;
  const SUCCESS_URL = process.env.SUCCESS_URL || 'https://kim-5d61ce.webflow.io/success';

  if (!MONOBANK_TOKEN) {
    return res.status(500).json({ error: 'Monobank token is not configured' });
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
