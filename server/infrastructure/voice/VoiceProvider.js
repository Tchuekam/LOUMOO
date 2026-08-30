/**
 * Voice Provider Interface & ElevenLabs Implementation
 * Handles server-side audio generation, text-to-speech, and voice note synthesis
 */

const { config } = require('../../config/env');
const logger = require('../../shared/logging/logger');
const { ExternalServiceError } = require('../../shared/errors/AppError');

class VoiceProvider {
  /**
   * Synthesize audio from text
   * @param {string} text - Text to speak
   * @param {string} voiceId - ElevenLabs voice identifier
   * @returns {Promise<Buffer>} Audio MP3 buffer
   */
  async synthesizeSpeech(text, voiceId = '21m00Tcm4TlvDq8ikWAM') {
    if (!text) throw new Error('Text is required for speech synthesis');

    if (!config.elevenlabs.apiKey) {
      throw new ExternalServiceError('ElevenLabs', 'ELEVENLABS_API_KEY is not configured');
    }

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': config.elevenlabs.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err) {
      logger.error('[VoiceProvider] Speech synthesis failed', err);
      throw new ExternalServiceError('ElevenLabs', err.message);
    }
  }

  /**
   * Mock waveform extractor (25 integers 10..90) for UI waveforms
   */
  generateWaveformData(length = 25) {
    const waveform = [];
    for (let i = 0; i < length; i++) {
      waveform.push(Math.floor(15 + Math.random() * 70));
    }
    return waveform;
  }
}

module.exports = new VoiceProvider();
