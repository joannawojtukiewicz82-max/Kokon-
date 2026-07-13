// netlify/functions/kv.js
// Prosty magazyn klucz-wartość oparty o Netlify Blobs.
// Zastępuje window.storage (dostępne tylko wewnątrz artefaktów Claude)
// prawdziwym, trwałym przechowywaniem danych na Netlify.

const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json' };

  const key = event.queryStringParameters && event.queryStringParameters.key;
  if (!key) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Brak parametru "key"' }) };
  }

  const store = getStore('kokon-data');

  try {
    if (event.httpMethod === 'GET') {
      const value = await store.get(key, { type: 'text' });
      return { statusCode: 200, headers, body: JSON.stringify({ key, value: value === undefined ? null : value }) };
    }

    if (event.httpMethod === 'POST' || event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      await store.set(key, body.value);
      return { statusCode: 200, headers, body: JSON.stringify({ key, value: body.value }) };
    }

    if (event.httpMethod === 'DELETE') {
      await store.delete(key);
      return { statusCode: 200, headers, body: JSON.stringify({ key, deleted: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Metoda niedozwolona' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(err && err.message || err) }) };
  }
};
