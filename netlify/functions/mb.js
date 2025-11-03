const crypto = require('crypto');

exports.handler = async (event, context) => {
  const { key, secret, pair } = event.queryStringParameters;

  // Validação
  if (!key || !secret || !pair) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Faltam parâmetros: key, secret ou pair' })
    };
  }

  const timestamp = Date.now().toString();
  const path = `/api/v4/accounts/${pair}/trades`;
  const method = 'GET';
  const payload = timestamp + method + path;

  const signature = crypto.createHmac('sha512', secret).update(payload).digest('base64');

  try {
    const response = await fetch(`https://api.mercadobitcoin.net${path}`, {
      method: 'GET',
      headers: {
        'API-Key': key,
        'Timestamp': timestamp,
        'Signature': signature
      }
    });

    const text = await response.text(); // Lê como texto primeiro

    // Debug: mostra o que o MB retornou
    console.log('Resposta do MB:', text);

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `MB Error ${response.status}`, details: text })
      };
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Resposta inválida do MB', raw: text })
      };
    }

    // Garante que data é array
    const trades = Array.isArray(data) ? data : [];

    return {
      statusCode: 200,
      body: JSON.stringify(trades)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
