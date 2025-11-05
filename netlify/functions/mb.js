const crypto = require('crypto');

exports.handler = async (event, context) => {
  const { key, secret, pair } = event.queryStringParameters;

  if (!key || !secret || !pair) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Faltam key, secret ou pair' }) };
  }

  const timestamp = Date.now().toString();
  const path = `/api/v4/trades?coin_pair=${pair}`;
  const method = 'GET';
  const payload = timestamp + method + path;

  const signature = crypto.createHmac('sha512', secret).update(payload).digest('base64');

  try {
    const response = await fetch(`https://api.mercadobitcoin.net${path}`, {
      headers: {
        'API-Key': key,
        'Timestamp': timestamp,
        'Signature': signature
      }
    });

    const text = await response.text();
    console.log('MB Response:', text);

    if (!response.ok) {
      return { statusCode: response.status, body: JSON.stringify({ error: `MB Error ${response.status}`, details: text }) };
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return { statusCode: 500, body: JSON.stringify({ error: 'JSON inválido', raw: text }) };
    }

    // Para Trade API, data é array de trades
    const trades = Array.isArray(data) ? data : (data.response || data.data || []);
    return { statusCode: 200, body: JSON.stringify(trades) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};