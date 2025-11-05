const crypto = require('crypto');

exports.handler = async (event, context) => {
  const { key, secret, action, pair, account_id } = event.queryStringParameters;

  if (!key || !secret) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Faltam key e secret' }) };
  }

  const timestamp = Date.now().toString();
  let path, method = 'GET';
  let payload = timestamp + method;

  if (action === 'get_accounts') {
    path = '/api/v4/accounts';
  } else if (action === 'get_trades') {
    if (!account_id || !pair) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Faltam account_id ou pair' }) };
    }
    path = `/api/v4/accounts/${account_id}/executions?coin_pair=${pair}`;
  } else {
    return { statusCode: 400, body: JSON.stringify({ error: 'Action inválida: get_accounts ou get_trades' }) };
  }

  payload += path;

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

    if (!response.ok) {
      return { statusCode: response.status, body: JSON.stringify({ error: `MB Error ${response.status}`, details: text }) };
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return { statusCode: 500, body: JSON.stringify({ error: 'JSON inválido', raw: text }) };
    }

    let result;
    if (action === 'get_accounts') {
      result = data.accounts || []; // Lista de contas, pega a default
    } else {
      result = Array.isArray(data) ? data : [];
    }

    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};