/**
 * LOUMOO — Onboarding Repository
 * ---------------------------------------------------------------------------
 * Persists onboarding progress in `iam.onboarding_progress`, one row per
 * (user, step).
 *
 * This table is what makes onboarding genuinely resumable: the browser's
 * localStorage draft is a convenience for re-filling a half-typed form, but
 * the server alone decides which step the user is on. Clearing site data,
 * switching devices or refreshing mid-step therefore loses nothing.
 */

const { SupabaseDatabase } = require('../../../infrastructure/database/SupabaseClient.js');
const { InfrastructureError } = require('../../../shared/errors/AppError');

class OnboardingRepository {
  static get db() {
    return SupabaseDatabase.getAdmin();
  }

  static async listForUser(userId) {
    const { data, error } = await this.db
      .from('onboarding_progress')
      .select('step_key, status, payload, error_message, completed_at, updated_at')
      .eq('user_id', userId);

    if (error) {
      throw new InfrastructureError('Supabase', `onboarding progress read failed: ${error.message}`, error);
    }
    return data || [];
  }

  static async completedStepKeys(userId) {
    if (!userId) return [];
    const rows = await this.listForUser(userId);
    return rows.filter(r => r.status === 'COMPLETED').map(r => r.step_key);
  }

  /**
   * Records a step outcome. Upsert on (user_id, step_key) makes a retried or
   * double-submitted step idempotent instead of creating duplicate rows.
   */
  static async saveStep(userId, stepKey, { status = 'COMPLETED', payload = {}, errorMessage = null } = {}) {
    const record = {
      user_id: userId,
      step_key: stepKey,
      status,
      payload,
      error_message: errorMessage,
      completed_at: status === 'COMPLETED' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await this.db
      .from('onboarding_progress')
      .upsert(record, { onConflict: 'user_id,step_key' })
      .select('step_key, status, payload, completed_at')
      .single();

    if (error) {
      throw new InfrastructureError('Supabase', `onboarding step save failed: ${error.message}`, error);
    }
    return data;
  }

  /** Merged payload of every step, used to prefill a resumed wizard. */
  static async draftFor(userId) {
    const rows = await this.listForUser(userId);
    return rows.reduce((acc, row) => {
      acc[row.step_key] = row.payload || {};
      return acc;
    }, {});
  }

  static async reset(userId) {
    const { error } = await this.db.from('onboarding_progress').delete().eq('user_id', userId);
    if (error) {
      throw new InfrastructureError('Supabase', `onboarding reset failed: ${error.message}`, error);
    }
  }
}

module.exports = OnboardingRepository;
