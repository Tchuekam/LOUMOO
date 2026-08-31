/**
 * LOUMOO — Test helper: fake Supabase client for forcing fallback paths.
 * ---------------------------------------------------------------------------
 * SavedItemsUseCase / FollowedStoresUseCase read `SupabaseClient.getAdmin()`
 * at call time. Swapping that accessor for this double lets a suite drive the
 * use case into (a) a DB that returns zero rows and (b) a DB that errors,
 * without touching the real database.
 *
 * The double mimics the postgrest-js query chain used by the use cases:
 * every modifier returns `this`, and awaiting the chain resolves to a
 * `{ data, count, error }` envelope.
 */
'use strict';

class FakeQueryBuilder {
  constructor(envelope) {
    this._envelope = envelope;
  }

  // Any `await` on the chain resolves to the configured envelope.
  then(resolve, reject) {
    return Promise.resolve(this._envelope).then(resolve, reject);
  }

  select() { return this; }
  eq() { return this; }
  in() { return this; }
  order() { return this; }
  range() { return this; }
  limit() { return this; }
  insert() { return this; }
  update() { return this; }
  delete() { return this; }
  upsert() { return this; }

  // Terminal fetchers: resolve immediately to the envelope, single()-style.
  maybeSingle() { return Promise.resolve(this._envelope); }
  single() { return Promise.resolve(this._envelope); }
}

/**
 * Builds a fake admin client whose query chain resolves to `envelope`.
 * @param {{data:*, count:number, error:object|null}} [envelope]
 */
function makeFakeDb(envelope = { data: null, count: 0, error: null }) {
  const builder = new FakeQueryBuilder(envelope);
  return {
    from: () => builder,
    schema: () => ({ from: () => builder })
  };
}

module.exports = { makeFakeDb };
