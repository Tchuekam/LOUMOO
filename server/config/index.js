/**
 * LOUMOO Backend Configuration — single entry point.
 *
 * This module used to hold a second, hand-rolled copy of the configuration
 * loader. Two config objects meant two answers to questions like "is phone
 * verification enabled?", so the duplicate has been removed: everything now
 * resolves to the validated Zod-typed config in ./env.js.
 *
 *   const config = require('../config');          // -> the config object
 *   const { config } = require('../config/env');  // -> the same object
 */

const env = require('./env');

module.exports = env;
