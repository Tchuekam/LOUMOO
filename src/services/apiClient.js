/**
 * LOUMOO Universal Commerce — ESM API Client Facade
 * ---------------------------------------------------------------------------
 * This module is a THIN WRAPPER. All transport, auth-token handling, envelope
 * unwrapping and error normalisation live in the single canonical client at
 * `src/services/loumooApi.js`, which is also the client loaded by
 * `Commerce App.dc.html` as a classic script.
 *
 * There is intentionally only ONE API client implementation in this codebase.
 * Add new endpoints to `loumooApi.js`, never here.
 */

import './loumooApi.js';

const core = (typeof globalThis !== 'undefined' && globalThis.LoumooAPI) || null;

if (!core) {
  throw new Error('[apiClient] loumooApi.js failed to register the LOUMOO API client.');
}

export const apiClient = core;
export const LoumooAPI = core;
export default core;
