/**
 * LOUMOO — Mission Service
 * ---------------------------------------------------------------------------
 * Lifecycle management for user missions: list, change, pause, complete,
 * archive. A mission is the user's CURRENT actionable objective; it
 * personalizes the homepage, recommendations and suggested actions.
 * Changing a mission is a first-class, supported transition.
 */

const AdaptiveRepository = require('../infrastructure/AdaptiveRepository');
const { extractIntentSignals } = require('../domain/IntentExtractor');
const { NotFoundError, ValidationError } = require('../../../shared/errors/AppError');
const logger = require('../../../shared/logging/logger');

const STATUS_TRANSITIONS = Object.freeze({
  active: ['active', 'paused', 'completed', 'archived'],
  paused: ['active', 'archived'],
  completed: ['archived'],
  archived: ['active']
});

class MissionService {
  static async list(principal) {
    const missions = await AdaptiveRepository.listMissions(principal.id);
    return { activeMission: missions.find(m => m.status === 'active') || null, missions };
  }

  /**
   * Changes the user's mission — either by activating an existing one or by
   * creating a new manual mission. The previous active mission is paused
   * (history preserved), never destroyed.
   */
  static async change(principal, { missionId = null, title = null, description = null } = {}) {
    if (!missionId && !(title || '').trim()) {
      throw new ValidationError('Provide a mission to activate or a title for a new mission.');
    }

    let mission;
    if (missionId) {
      const missions = await AdaptiveRepository.listMissions(principal.id);
      mission = missions.find(m => m.id === missionId);
      if (!mission) throw new NotFoundError('That mission was not found on your account.');
      await AdaptiveRepository.updateMissionStatus(principal.id, missionId, 'active');
      mission = { ...mission, status: 'active' };
    } else {
      // Infer the mission type from the user's own wording (deterministic,
      // no LLM). Falls back to 'explore' for titles with no clear intent.
      const INTENT_TO_MISSION_TYPE = {
        purchase: 'purchase', sell: 'sell', growth: 'growth',
        travel: 'travel', service: 'service'
      };
      const summary = extractIntentSignals(title.trim()).summary;
      const missionType = INTENT_TO_MISSION_TYPE[summary.intent] || 'explore';
      mission = await AdaptiveRepository.setActiveMission(principal.id, {
        title: title.trim(),
        description: (description || '').trim() || null,
        missionType,
        source: 'manual',
        suggestedActions: []
      });
    }

    logger.info(`[Mission] user=${principal.id} changed mission -> "${mission.title}"`);
    return mission;
  }

  static async setStatus(principal, missionId, status) {
    if (!STATUS_TRANSITIONS[status]) {
      throw new ValidationError(`Invalid mission status '${status}'.`);
    }
    const missions = await AdaptiveRepository.listMissions(principal.id);
    const mission = missions.find(m => m.id === missionId);
    if (!mission) throw new NotFoundError('That mission was not found on your account.');

    const updated = await AdaptiveRepository.updateMissionStatus(principal.id, missionId, status);
    logger.info(`[Mission] user=${principal.id} mission=${missionId} -> ${status}`);
    return updated;
  }
}

module.exports = MissionService;
