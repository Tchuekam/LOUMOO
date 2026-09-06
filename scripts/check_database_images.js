'use strict';
const dns = require('dns');
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}
const fs = require('fs');
const path = require('path');
const config = require('../server/config/env');
const { SupabaseDatabase } = require('../server/infrastructure/database/SupabaseClient');

async function main() {
  console.log('Connecting to Supabase...');
  const supabase = SupabaseDatabase.getAdmin();
  
  // 1. Fetch listings
  const { data: listings, error: lErr } = await supabase
    .schema('iam')
    .from('listings')
    .select('id, title, slug')
    .limit(200);

  if (lErr) {
    console.error('Listings query error:', lErr);
  } else {
    console.log(`Retrieved ${listings.length} listings from database.`);
  }

  // 2. Fetch listing_media
  const { data: media, error: mErr } = await supabase
    .schema('iam')
    .from('listing_media')
    .select('*')
    .limit(20);

  if (mErr) {
    console.error('Media query error:', mErr);
  } else {
    console.log(`Retrieved ${media.length} media rows:`, JSON.stringify(media, null, 2));
  }

  if (mErr) {
    console.error('Media query error:', mErr);
  } else {
    console.log(`Retrieved ${media.length} media rows from database.`);
    const brokenM = [];
    for (const m of media) {
      const img = m.media_url;
      if (!img) {
        brokenM.push({ id: m.id, reason: 'EMPTY' });
      } else if (!img.startsWith('http')) {
        const clean = decodeURIComponent(img.replace(/^\.\//, '')).split('?')[0];
        const pub = path.join('public', clean);
        if (!fs.existsSync(clean) && !fs.existsSync(pub)) {
          brokenM.push({ id: m.id, img, reason: 'FILE_NOT_FOUND' });
        }
      }
    }
    console.log(`Broken listing media items: ${brokenM.length}`);
    for (const b of brokenM) {
      console.log(`  [${b.id}] -> ${b.img}`);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
