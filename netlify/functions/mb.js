const crypto = require('crypto');

exports.handler = async (event, context) => {
  const { key, secret, pair } = event.queryStringParameters;

  if (!key || !secret || !pair) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Faltam parâmetros' }) };
  }

  const timestamp = Date.now().toString();
  const path = `/api/v4/accounts/${pair}/trades`;
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

    if (!response.ok) throw new Error(`Erro: ${response.status}`);

    const data = await response.json();
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};