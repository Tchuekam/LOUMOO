const { SupabaseDatabase } = require('../server/infrastructure/database/SupabaseClient');
const CacheService = require('../server/infrastructure/cache/CacheService');

(async () => {
  try {
    const admin = SupabaseDatabase.getAdmin();
    const { data, error } = await admin
      .schema('iam')
      .from('profiles')
      .update({
        first_name: 'Rostand',
        last_name: 'Tchuekam',
        business_name: "Rostand's Boutique"
      })
      .eq('id', '70e7112b-af2c-42ed-9ab3-849248670a54')
      .select('id, clerk_user_id, email, first_name, last_name, business_name');

    console.log('UPDATED PROFILE:', data, error);

    // Also invalidate profile cache
    if (data && data[0]) {
      await CacheService.delete(`profile:clerk:${data[0].clerk_user_id}`, 'identity').catch(() => {});
      await CacheService.delete(`profile:id:${data[0].id}`, 'identity').catch(() => {});
    }

    // Also update auth user metadata if clerk_user_id exists
    if (data && data[0] && data[0].clerk_user_id) {
      await admin.auth.admin.updateUserById(data[0].clerk_user_id, {
        user_metadata: {
          first_name: 'Rostand',
          last_name: 'Tchuekam'
        }
      }).catch(e => console.log('Metadata update note:', e.message));
    }
  } catch (e) {
    console.error('Failed to update:', e);
  } finally {
    process.exit(0);
  }
})();
