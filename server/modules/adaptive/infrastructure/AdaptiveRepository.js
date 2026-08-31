/**
 * LOUMOO — Adaptive Onboarding Repository
 * ---------------------------------------------------------------------------
 * Persists the adaptive questionnaire substrate:
 *   - onboarding_answers   one row per (user, question_key), upserted
 *   - user_intent_signals  declared + inferred structured signals
 *   - user_goals           declarative goals
 *   - user_missions        the actionable active mission
 *
 * Mirrors OnboardingRepository's conventions: service-role admin client,
 * explicit InfrastructureError on failure, idempotent upserts.
 */

const { SupabaseDatabase } = require('../../../infrastructure/database/SupabaseClient.js');
const { InfrastructureError } = require('../../../shared/errors/AppError');

class AdaptiveRepository {
  static get db() {
    return SupabaseDatabase.getAdmin();
  }

  /* ------------------------------------------------------------ answers --- */

  static async listAnswers(userId) {
    const { data, error } = await this.db
      .from('onboarding_answers')
      .select('question_key, phase, raw_text, value, source, skipped, answered_at')
      .eq('user_id', userId)
      .order('answered_at', { ascending: true });
    if (error) throw new InfrastructureError('Supabase', `adaptive answers read failed: ${error.message}`, error);
    return data || [];
  }

  static async saveAnswer(userId, {
    questionKey, phase = 'intent', rawText = null, value = {}, source = 'declared', skipped = false
  } = {}) {
    const record = {
      user_id: userId,
      question_key: questionKey,
      phase,
      raw_text: rawText,
      value,
      source,
      skipped,
      answered_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const { data, error } = await this.db
      .from('onboarding_answers')
      .upsert(record, { onConflict: 'user_id,question_key' })
      .select('question_key, source, skipped, answered_at')
      .single();
    if (error) throw new InfrastructureError('Supabase', `adaptive answer save failed: ${error.message}`, error);
    return data;
  }

  static async resetAnswers(userId) {
    const { error } = await this.db.from('onboarding_answers').delete().eq('user_id', userId);
    if (error) throw new InfrastructureError('Supabase', `adaptive answers reset failed: ${error.message}`, error);
  }

  /* ------------------------------------------------------------ signals --- */

  static async listSignals(userId) {
    const { data, error } = await this.db
      .from('user_intent_signals')
      .select('signal_type, value, source, confidence, provenance, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw new InfrastructureError('Supabase', `intent signals read failed: ${error.message}`, error);
    return data || [];
  }

  /**
   * Inserts one signal. Signals are append-only (an event log of what the user
   * declared and what the system inferred), so no upsert: the engine reads the
   * newest row per type.
   */
  static async insertSignal(userId, { type, value, source = 'declared', confidence = 1.0, provenance = {} } = {}) {
    const record = {
      user_id: userId,
      signal_type: type,
      value,
      source,
      confidence: Math.max(0, Math.min(1, Number(confidence) || 1)),
      provenance,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const { data, error } = await this.db.from('user_intent_signals').insert(record).select('id').single();
    if (error) throw new InfrastructureError('Supabase', `intent signal insert failed: ${error.message}`, error);
    return data;
  }

  /**
   * Clears CONVERSATION-scoped signals (question-derived, declared or
   * inferred) while keeping long-term evidence: raw behavior events and
   * behavior-promoted aggregates (provenance.origin starts with 'behavior:').
   * Used by restart ("change my goal") — the new conversation starts fresh,
   * but what the user *did* in the product is never forgotten.
   */
  static async resetSignals(userId) {
    const { data } = await this.db
      .from('user_intent_signals')
      .select('id, signal_type, provenance')
      .eq('user_id', userId);
    const rows = data || [];
    const conversationScoped = rows.filter(r =>
      r.signal_type !== 'behavior' &&
      !(r.provenance && typeof r.provenance.origin === 'string' && r.provenance.origin.startsWith('behavior:'))
    );
    for (const row of conversationScoped) {
      const { error } = await this.db.from('user_intent_signals').delete().eq('id', row.id);
      if (error) throw new InfrastructureError('Supabase', `intent signal reset failed: ${error.message}`, error);
    }
    return conversationScoped.length;
  }

  /** Behavior-signal flood guard: max N behavior rows retained per user. */
  static async pruneBehaviorSignals(userId, keep = 200) {
    const { data } = await this.db
      .from('user_intent_signals')
      .select('id')
      .eq('user_id', userId)
      .eq('signal_type', 'behavior')
      .order('created_at', { ascending: false });
    const excess = (data || []).slice(keep);
    for (const row of excess) {
      await this.db.from('user_intent_signals').delete().eq('id', row.id);
    }
    return excess.length;
  }

  /* -------------------------------------------------------------- goals --- */

  static async listGoals(userId) {
    const { data, error } = await this.db
      .from('user_goals')
      .select('id, title, goal_type, status, created_at, achieved_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new InfrastructureError('Supabase', `goals read failed: ${error.message}`, error);
    return data || [];
  }

  /**
   * Sets the active goal: previous active goals become 'abandoned' and the new
   * one becomes 'active' — a user changing their goal is a normal, supported
   * transition, never an error.
   */
  static async setActiveGoal(userId, { title, goalType = 'purchase' }) {
    await this.db
      .from('user_goals')
      .update({ status: 'abandoned', updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('status', 'active');

    const { data, error } = await this.db
      .from('user_goals')
      .insert({
        user_id: userId,
        title,
        goal_type: goalType,
        status: 'active'
      })
      .select('id, title, goal_type, status')
      .single();
    if (error) throw new InfrastructureError('Supabase', `goal save failed: ${error.message}`, error);
    return data;
  }

  /* ----------------------------------------------------------- missions --- */

  static async listMissions(userId) {
    const { data, error } = await this.db
      .from('user_missions')
      .select('id, title, description, mission_type, status, source, suggested_actions, created_at, completed_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new InfrastructureError('Supabase', `missions read failed: ${error.message}`, error);
    return data || [];
  }

  static async activeMission(userId) {
    const { data, error } = await this.db
      .from('user_missions')
      .select('id, title, description, mission_type, status, source, suggested_actions, created_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    if (error) throw new InfrastructureError('Supabase', `active mission read failed: ${error.message}`, error);
    return data || null;
  }

  /**
   * Installs a mission as THE active mission. Pauses any currently-active
   * mission (a user changing their mission is supported — never an error) and
   * enforces the one-active-mission invariant with the partial unique index.
   */
  static async setActiveMission(userId, {
    title, description = null, missionType = 'explore', source = 'onboarding', suggestedActions = []
  } = {}) {
    await this.db
      .from('user_missions')
      .update({ status: 'paused', updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('status', 'active');

    const { data, error } = await this.db
      .from('user_missions')
      .insert({
        user_id: userId,
        title,
        description,
        mission_type: missionType,
        status: 'active',
        source,
        suggested_actions: suggestedActions
      })
      .select('id, title, description, mission_type, status, source, suggested_actions')
      .single();
    if (error) throw new InfrastructureError('Supabase', `mission save failed: ${error.message}`, error);
    return data;
  }

  static async updateMissionStatus(userId, missionId, status) {
    const allowed = ['active', 'paused', 'completed', 'archived'];
    if (!allowed.includes(status)) {
      throw new InfrastructureError('Validation', `invalid mission status '${status}'`);
    }
    const patch = { status, updated_at: new Date().toISOString() };
    if (status === 'completed') patch.completed_at = new Date().toISOString();
    else patch.completed_at = null;

    if (status === 'active') {
      // One active mission: pause the current holder first.
      await this.db
        .from('user_missions')
        .update({ status: 'paused', updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('status', 'active')
        .neq('id', missionId);
    }

    const { data, error } = await this.db
      .from('user_missions')
      .update(patch)
      .eq('id', missionId)
      .eq('user_id', userId)
      .select('id, title, status, mission_type')
      .single();
    if (error) throw new InfrastructureError('Supabase', `mission status update failed: ${error.message}`, error);
    return data;
  }
}

module.exports = AdaptiveRepository;
