// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
const DEFAULT_MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export function allowedOrigins(raw = process.env.OCKER_ALLOWED_PROVIDER_ORIGINS ?? '') {
  return new Set(raw.split(',').map(value => value.trim()).filter(Boolean).map(value => new URL(value).origin));
}

export function requireAllowedProvider(endpoint, origins) {
  const url = new URL(endpoint);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('Provider endpoint must use HTTP or HTTPS.');
  if (!origins.has(url.origin)) throw new Error(`Provider origin is not allowed: ${url.origin}`);
  return url.toString();
}

export { DEFAULT_MAX_UPLOAD_BYTES };
