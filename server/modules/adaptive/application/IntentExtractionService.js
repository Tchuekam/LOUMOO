/**
 * LOUMOO — Intent Extraction Service (AI-optional)
 * ---------------------------------------------------------------------------
 * Structured intent extraction from natural-language answers.
 *
 *   - LLM path:   when AISSTREAM_API_KEY + AISSTREAM_BASE_URL are configured
 *                 (and NODE_ENV !== 'test'), free text is sent to the
 *                 OpenAI-compatible provider with a strict JSON contract.
 *   - Fallback:   the deterministic IntentExtractor rules — always available,
 *                 zero cost, zero latency. Every extraction is tagged with its
 *                 provenance, and rule-based output is NEVER presented as AI.
 *
 * The LLM can refine confidence and catch phrasing the rules miss; it cannot
 * break the flow — any failure degrades to the deterministic baseline.
 */

const { z } = require('zod');
const config = require('../../../config/env');
const logger = require('../../../shared/logging/logger');
const { extractIntentSignals } = require('../domain/IntentExtractor');

const AI_READY = Boolean(config.aisstream.apiKey) && Boolean(config.aisstream.baseUrl);

const LLM_SIGNAL_SCHEMA = z.object({
  signals: z.array(z.object({
    type: z.enum(['intent', 'category', 'use_case', 'context', 'priority', 'constraint', 'goal']),
    value: z.record(z.string(), z.any()),
    confidence: z.number().min(0).max(1)
  })).max(12).default([])
});

const SYSTEM_PROMPT =
  'You extract structured shopping/business intent signals from a user\u2019s answer on a ' +
  'Cameroonian marketplace (LOUMOO). Reply with ONLY valid JSON, no prose. Shape: ' +
  '{"signals":[{"type":"intent|category|use_case|context|priority|constraint|goal",' +
  '"value":{"id":"..."},"confidence":0.0-1.0}]}. intents: purchase|sell|growth|travel|service|browse. ' +
  'Categories: laptops|smartphones|fashion|footwear|hotel_rooms|flights|travel|groceries|electronics|' +
  'furniture|vehicles|tech_repairs|beauty|services. Priorities: affordability|quality|speed|trust. ' +
  'Use lower-case ids only. Only emit signals actually supported by the text; confidence must reflect how ' +
  'explicit the user was.';

async function llmExtract(rawText) {
  const { apiKey, baseUrl, model } = config.aisstream;
  const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: String(rawText).slice(0, 800) }
      ],
      max_tokens: 350,
      temperature: 0.2,
      response_format: { type: 'json_object' }
    }),
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) throw new Error(`chat completions HTTP ${response.status}`);
  const data = await response.json();
  const content = data && data.choices && data.choices[0] && data.choices[0].message
    ? data.choices[0].message.content
    : '';
  if (!content) throw new Error('empty LLM response');

  const parsed = JSON.parse(content);
  const validated = LLM_SIGNAL_SCHEMA.parse(parsed);
  return validated.signals.map(s => ({
    type: s.type,
    value: s.value,
    confidence: s.confidence,
    source: 'inferred',
    provenance: { model: model || 'aisstream', origin: 'llm' }
  }));
}

/**
 * Extracts intent signals from free text.
 *
 * @param {string} rawText
 * @param {object} [opts] { questionKey }
 * @returns {Promise<{signals: Array, provider: 'llm'|'rules'}>}
 *   signals: [{ type, value, confidence, source:'inferred', provenance }]
 */
async function extract(rawText, opts = {}) {
  const text = String(rawText || '').trim();
  if (!text) return { signals: [], provider: 'rules' };

  // Deterministic baseline — always computed, so a failed LLM call is a
  // non-event and tests stay hermetic.
  const baseline = extractIntentSignals(text, { questionKey: opts.questionKey }).signals
    .map(s => ({
      type: s.type,
      value: s.value,
      confidence: s.confidence,
      source: 'inferred',
      provenance: { origin: `rules:${opts.questionKey || 'free_text'}`, engine: 'intent-extractor-v1' }
    }));

  if (AI_READY && !config.isTest) {
    try {
      const llm = await llmExtract(text);
      if (llm.length > 0) {
        // The model may disagree with rules; prefer model output when present
        // but keep rule signals the model omitted (recall > precision here).
        const llmTypes = new Set(llm.map(s => s.type));
        const merged = [
          ...llm,
          ...baseline.filter(s => !llmTypes.has(s.type))
        ];
        return { signals: merged, provider: 'llm' };
      }
    } catch (err) {
      logger.warn(`[IntentExtraction] LLM extraction failed (${err.message}); using deterministic baseline.`);
    }
  }

  return { signals: baseline, provider: 'rules' };
}

module.exports = { extract, AI_READY };
