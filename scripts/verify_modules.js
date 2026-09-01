const path = require('path');
const fs = require('fs');

const repRoutesPath = path.resolve(__dirname, '../server/modules/identity/presentation/routes/reputationRoutes.js');
let content = fs.readFileSync(repRoutesPath, 'utf8');
content = content.replace("require('../../../infrastructure/database/SupabaseClient')", "require('../../../../infrastructure/database/SupabaseClient')");
fs.writeFileSync(repRoutesPath, content, 'utf8');
console.log('Fixed reputationRoutes.js require path');

// Test require all new files
try {
  require('../server/modules/identity/domain/Organization');
  console.log('OK: Organization');
  require('../server/modules/identity/domain/SocialGraph');
  console.log('OK: SocialGraph');
  require('../server/modules/identity/domain/ReputationEngine');
  console.log('OK: ReputationEngine');
  require('../server/modules/identity/application/OrganizationService');
  console.log('OK: OrganizationService');
  require('../server/modules/identity/application/SocialGraphService');
  console.log('OK: SocialGraphService');
  require('../server/modules/identity/application/ReviewService');
  console.log('OK: ReviewService');
  require('../server/modules/identity/application/PublicProfileService');
  console.log('OK: PublicProfileService');
  require('../server/modules/identity/presentation/routes/organizationRoutes');
  console.log('OK: organizationRoutes');
  require('../server/modules/identity/presentation/routes/socialRoutes');
  console.log('OK: socialRoutes');
  require('../server/modules/identity/presentation/routes/reputationRoutes');
  console.log('OK: reputationRoutes');
  require('../server/modules/identity/presentation/routes/identityRoutes');
  console.log('OK: identityRoutes');
  require('../server/index');
  console.log('OK: server/index');
} catch (e) {
  console.error('REQUIRE ERROR:', e);
  process.exit(1);
}