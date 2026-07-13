// netlify/functions/kv.js
// Prosty magazyn klucz-wartość oparty o Netlify Blobs.
// Zastępuje window.storage (dostępne tylko wewnątrz artefaktów Claude)
// prawdziwym, trwałym przechowywaniem danych na Netlify.

import { getStore } from '@netlify/blobs';

export default async (req) => {
  const url = new URL(req.url);
  const key = url.searchParams.get('key');
  const headers = { 'Content-Type': 'application/json' };

  if (!key) {
    return new Response(JSON.stringify({ error: 'Brak parametru "key"' }), { status: 400, headers });
  }

  const store = getStore('kokon-data');

  try {
    if (req.method === 'GET') {
      const value = await store.get(key, { type: 'text' });
      return new Response(JSON.stringify({ key, value: value === undefined ? null : value }), { headers });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = await req.json();
      await store.set(key, body.value);
      return new Response(JSON.stringify({ key, value: body.value }), { headers });
    }

    if (req.method === 'DELETE') {
      await store.delete(key);
      return new Response(JSON.stringify({ key, deleted: true }), { headers });
    }

    return new Response(JSON.stringify({ error: 'Metoda niedozwolona' }), { status: 405, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err && err.message || err) }), { status: 500, headers });
  }
};
