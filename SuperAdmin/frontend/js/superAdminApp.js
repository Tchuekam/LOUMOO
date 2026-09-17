/**
 * LOUMOO SuperAdmin — superAdminApp.js
 * ---------------------------------------------------------------------------
 * Interactive application controller for the SuperAdmin Control Center.
 */

(function () {
  'use strict';

  const api = window.SuperAdminAPI;
  let currentSettings = {};

  function showToast(msg, isError = false) {
    const toast = document.getElementById('toastNotice');
    const toastText = document.getElementById('toastText');
    const toastIcon = document.getElementById('toastIcon');
    if (!toast) return;

    toastText.textContent = msg;
    toastIcon.textContent = isError ? '⚠️' : '✓';
    toastIcon.style.color = isError ? '#ff3b30' : '#00e676';

    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }

  async function loadOverview() {
    try {
      const data = await api.getOverview();
      const kpis = data.kpis || {};

      document.getElementById('gmvValue').textContent = kpis.gmvFormatted || '0 XAF';
      document.getElementById('ordersValue').textContent = kpis.totalOrders || '0';
      document.getElementById('storesValue').textContent = kpis.activeStores || '0';
      document.getElementById('pendingKycValue').textContent = kpis.pendingKycCount || '0';
    } catch (err) {
      console.warn('[SuperAdmin] Failed to load overview metrics:', err.message);
    }
  }

  async function loadSettings() {
    try {
      currentSettings = await api.getSettings();

      // 1. Commission Rate
      const comm = currentSettings.platform_commission_rate || {};
      if (document.getElementById('commissionRateInput')) {
        document.getElementById('commissionRateInput').value = comm.rate_percent !== undefined ? comm.rate_percent : 5.0;
      }

      // 2. WhatsApp Default Hotline
      const wa = currentSettings.seller_whatsapp_default || {};
      if (document.getElementById('waPhoneInput')) {
        document.getElementById('waPhoneInput').value = wa.number || '237690123456';
      }
      if (document.getElementById('waLabelInput')) {
        document.getElementById('waLabelInput').value = wa.label || 'LOUMOO Central Merchant Care';
      }

      // 3. Maintenance Mode
      const maint = currentSettings.maintenance_mode || {};
      if (document.getElementById('maintenanceToggle')) {
        document.getElementById('maintenanceToggle').checked = !!maint.enabled;
      }
      if (document.getElementById('maintenanceBannerInput')) {
        document.getElementById('maintenanceBannerInput').value = maint.banner_text || '';
      }

      // 4. Global Announcement Banner
      const ann = currentSettings.announcement_banner || {};
      if (document.getElementById('announcementToggle')) {
        document.getElementById('announcementToggle').checked = !!ann.active;
      }
      if (document.getElementById('announcementMsgInput')) {
        document.getElementById('announcementMsgInput').value = ann.message || '';
      }
      if (document.getElementById('announcementCtaInput')) {
        document.getElementById('announcementCtaInput').value = ann.cta_text || 'Découvrir';
      }

      // 5. Feature Flags
      const ff = currentSettings.feature_flags || {};
      if (document.getElementById('flagTravel')) document.getElementById('flagTravel').checked = !!ff.travel_enabled;
      if (document.getElementById('flagVisual')) document.getElementById('flagVisual').checked = !!ff.visual_search_enabled;
      if (document.getElementById('flagEscrow')) document.getElementById('flagEscrow').checked = !!ff.escrow_enabled;
      if (document.getElementById('flagAi')) document.getElementById('flagAi').checked = !!ff.ai_assistant_enabled;

    } catch (err) {
      console.warn('[SuperAdmin] Failed to load settings:', err.message);
      showToast('Could not load current system settings', true);
    }
  }

  async function loadAuditLogs() {
    try {
      const logs = await api.getAuditLogs(20, 0);
      const tbody = document.getElementById('auditTableBody');
      if (!tbody) return;

      if (!logs || logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#868c98; padding:24px;">No administrative audit events recorded yet.</td></tr>';
        return;
      }

      tbody.innerHTML = logs.map(log => {
        const time = new Date(log.created_at).toLocaleString();
        const actionBadge = log.action.includes('verify') ? 'badge-verify' : (log.action.includes('suspend') ? 'badge-suspend' : 'badge-update');
        const detailSnippet = JSON.stringify(log.new_values || {}).substring(0, 50);

        return `
          <tr>
            <td style="font-weight:600; color:#111214;">${time}</td>
            <td><span class="audit-badge ${actionBadge}">${log.action}</span></td>
            <td><strong>${log.resource_type}</strong> / <span class="code-snippet">${log.resource_id}</span></td>
            <td>${log.admin_id}</td>
            <td><span class="code-snippet">${detailSnippet}${detailSnippet.length >= 50 ? '...' : ''}</span></td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      console.warn('[SuperAdmin] Failed to load audit logs:', err.message);
    }
  }

  // ── Action Handlers ──

  window.saveCommissionSetting = async function () {
    const val = parseFloat(document.getElementById('commissionRateInput').value);
    if (isNaN(val) || val < 0 || val > 50) {
      alert('Please enter a valid commission rate percentage between 0 and 50.');
      return;
    }
    try {
      const payload = {
        ...(currentSettings.platform_commission_rate || {}),
        rate_percent: val
      };
      await api.updateSetting('platform_commission_rate', payload, `Adjusted platform commission to ${val}%`);
      showToast(`Commission rate successfully saved to ${val}%!`);
      loadAuditLogs();
    } catch (err) {
      showToast(err.message || 'Failed to update commission rate', true);
    }
  };

  window.saveWhatsAppSetting = async function () {
    const phone = document.getElementById('waPhoneInput').value.trim();
    const label = document.getElementById('waLabelInput').value.trim();
    if (!phone) {
      alert('Please enter a valid WhatsApp hotline number.');
      return;
    }
    try {
      const payload = {
        number: phone.replace(/\D/g, ''),
        label: label || 'LOUMOO Central Merchant Care',
        fallback_message: 'Hello LOUMOO Support! I am contacting you regarding an order.'
      };
      await api.updateSetting('seller_whatsapp_default', payload, `Updated central WhatsApp line to ${phone}`);
      showToast('Central WhatsApp hotline successfully updated!');
      loadAuditLogs();
    } catch (err) {
      showToast(err.message || 'Failed to update WhatsApp setting', true);
    }
  };

  window.saveMaintenanceSetting = async function () {
    const enabled = document.getElementById('maintenanceToggle').checked;
    const banner = document.getElementById('maintenanceBannerInput').value.trim();
    try {
      const payload = {
        enabled,
        banner_text: banner || 'LOUMOO platform upgrade in progress.',
        allow_admin_bypass: true
      };
      await api.updateSetting('maintenance_mode', payload, `Maintenance mode set to ${enabled ? 'ENABLED' : 'DISABLED'}`);
      showToast(`Maintenance mode is now ${enabled ? 'ACTIVATED' : 'DEACTIVATED'}!`);
      loadAuditLogs();
    } catch (err) {
      showToast(err.message || 'Failed to update maintenance mode', true);
    }
  };

  window.saveAnnouncementSetting = async function () {
    const active = document.getElementById('announcementToggle').checked;
    const msg = document.getElementById('announcementMsgInput').value.trim();
    const cta = document.getElementById('announcementCtaInput').value.trim();
    try {
      const payload = {
        active,
        message: msg,
        badge: 'NOUVEAU',
        cta_text: cta,
        cta_url: '/stores'
      };
      await api.updateSetting('announcement_banner', payload, `Announcement banner updated: "${msg}"`);
      showToast('Marketplace announcement banner updated!');
      loadAuditLogs();
    } catch (err) {
      showToast(err.message || 'Failed to update announcement banner', true);
    }
  };

  window.saveFeatureFlags = async function () {
    const travel = document.getElementById('flagTravel').checked;
    const visual = document.getElementById('flagVisual').checked;
    const escrow = document.getElementById('flagEscrow').checked;
    const ai = document.getElementById('flagAi').checked;

    try {
      const payload = {
        travel_enabled: travel,
        visual_search_enabled: visual,
        escrow_enabled: escrow,
        ai_assistant_enabled: ai,
        crypto_payments_enabled: false
      };
      await api.updateSetting('feature_flags', payload, 'Updated platform runtime feature flags');
      showToast('Platform feature flags updated successfully!');
      loadAuditLogs();
    } catch (err) {
      showToast(err.message || 'Failed to update feature flags', true);
    }
  };

  // ── Phase 2: Stores & Merchant KYC Moderation ──

  let storeFilterStatus = 'ALL';
  let storeSearchQuery = '';

  window.switchTab = function (tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `tabContent_${tabName}`);
    });
    if (tabName === 'stores') {
      loadStores();
    }
  };

  window.setStoreStatusFilter = function (status, el) {
    storeFilterStatus = status;
    document.querySelectorAll('#storeFilters .filter-pill').forEach(pill => pill.classList.remove('active'));
    if (el) el.classList.add('active');
    loadStores();
  };

  window.onStoreSearchInput = function (input) {
    storeSearchQuery = input.value.trim();
    loadStores();
  };

  async function loadStores() {
    const tbody = document.getElementById('storesTableBody');
    if (!tbody) return;

    try {
      const stores = await api.getStores({
        status: storeFilterStatus,
        search: storeSearchQuery
      });

      if (!stores || stores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#868c98; padding:32px;">Aucune boutique trouvée correspondant aux critères.</td></tr>';
        return;
      }

      tbody.innerHTML = stores.map(s => {
        const initial = (s.name || 'B')[0].toUpperCase();
        const ownerName = (s.owner && s.owner.full_name) || 'Propriétaire LOUMOO';
        const ownerPhone = (s.owner && s.owner.phone_number) || s.phone_number || 'Non renseigné';
        const kycStatus = (s.owner && s.owner.kyc_status) || 'unverified';

        let statusBadge = '<span class="status-badge status-draft">DRAFT</span>';
        if (s.status === 'ACTIVE') statusBadge = '<span class="status-badge status-active">● ACTIF</span>';
        else if (s.status === 'PENDING_VERIFICATION') statusBadge = '<span class="status-badge status-pending">⏱ EN ATTENTE KYC</span>';
        else if (s.status === 'SUSPENDED') statusBadge = '<span class="status-badge status-suspended">✕ SUSPENDUE</span>';

        let tierBadge = '<span class="tier-badge tier-unverified">Non Vérifié</span>';
        if (s.verification_tier === 'official_brand') tierBadge = '<span class="tier-badge tier-official">★ Official Brand</span>';
        else if (s.verification_tier === 'pro_merchant') tierBadge = '<span class="tier-badge tier-pro">✓ Pro Merchant</span>';
        else if (s.verification_tier === 'individual_verified') tierBadge = '<span class="tier-badge tier-individual">Individuel</span>';

        let actionButtons = '';
        if (s.status === 'PENDING_VERIFICATION' || !s.is_verified) {
          actionButtons += `
            <button class="btn-action btn-verify" onclick="verifyStore('${s.id}', 'pro_merchant')">✓ Approuver KYC</button>
            <button class="btn-action btn-danger" onclick="rejectStore('${s.id}')">✕ Rejeter</button>
          `;
        }

        if (s.status === 'ACTIVE') {
          actionButtons += `
            <button class="btn-action btn-danger" onclick="suspendStore('${s.id}')">Suspendre</button>
          `;
        } else if (s.status === 'SUSPENDED') {
          actionButtons += `
            <button class="btn-action btn-reactivate" onclick="reactivateStore('${s.id}')">Réactiver</button>
          `;
        }

        actionButtons += `
          <button class="btn-action btn-edit" title="Modifier le numéro WhatsApp" onclick="editStorePhone('${s.id}', '${s.phone_number || ''}')">📞 WhatsApp</button>
        `;

        return `
          <tr>
            <td>
              <div class="store-meta-cell">
                <div class="store-avatar">${initial}</div>
                <div>
                  <div class="store-name-link">${s.name || 'Sans Nom'}</div>
                  <div class="store-slug">/${s.slug || s.id} • ${s.category_id || 'Commerce'}</div>
                </div>
              </div>
            </td>
            <td>
              <div style="font-weight:600; color:#111214;">${ownerName}</div>
              <div style="font-size:11px; color:#525866;">${ownerPhone} • <span style="text-transform:capitalize; font-weight:700;">${kycStatus}</span></div>
            </td>
            <td>
              <div style="font-weight:600;">${s.city || 'Douala'}</div>
              <div style="font-size:11px; color:#868c98;">${s.product_count || 0} produit(s)</div>
            </td>
            <td>${statusBadge}</td>
            <td>${tierBadge}</td>
            <td>
              <div class="btn-action-group">
                ${actionButtons}
              </div>
            </td>
          </tr>
        `;
      }).join('');

    } catch (err) {
      console.warn('[SuperAdmin] Failed to load stores:', err.message);
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#ff3b30; padding:24px;">Erreur lors du chargement des boutiques: ${err.message}</td></tr>`;
    }
  }

  window.verifyStore = async function (id, tier = 'pro_merchant') {
    try {
      await api.verifyStoreKyc(id, tier, `KYC vérifié par SuperAdmin - Tier: ${tier}`);
      showToast(`Boutique approuvée avec succès (${tier}) !`);
      loadStores();
      loadOverview();
      loadAuditLogs();
    } catch (err) {
      showToast(err.message || 'Erreur lors de la validation KYC', true);
    }
  };

  window.rejectStore = async function (id) {
    const reason = prompt('Motif du rejet du dossier KYC:', 'Documents non conformes');
    if (!reason) return;
    try {
      await api.rejectStoreKyc(id, reason);
      showToast('Dossier KYC rejeté.');
      loadStores();
      loadOverview();
      loadAuditLogs();
    } catch (err) {
      showToast(err.message || 'Erreur lors du rejet', true);
    }
  };

  window.suspendStore = async function (id) {
    const reason = prompt('Motif de la suspension de la boutique:', 'Non-respect des règles de la plateforme');
    if (!reason) return;
    try {
      await api.suspendStore(id, reason);
      showToast('Boutique suspendue.');
      loadStores();
      loadOverview();
      loadAuditLogs();
    } catch (err) {
      showToast(err.message || 'Erreur lors de la suspension', true);
    }
  };

  window.reactivateStore = async function (id) {
    try {
      await api.reactivateStore(id, 'Boutique réactivée par SuperAdmin');
      showToast('Boutique réactivée avec succès !');
      loadStores();
      loadOverview();
      loadAuditLogs();
    } catch (err) {
      showToast(err.message || 'Erreur lors de la réactivation', true);
    }
  };

  window.editStorePhone = async function (id, currentPhone) {
    const phone = prompt('Nouveau numéro de contact / WhatsApp pour cette boutique (format international ex: 237690123456):', currentPhone || '237');
    if (!phone) return;
    try {
      await api.moderateStore(id, { phone_number: phone.replace(/\D/g, '') });
      showToast('Numéro de contact de la boutique mis à jour !');
      loadStores();
      loadAuditLogs();
    } catch (err) {
      showToast(err.message || 'Erreur lors de la mise à jour', true);
    }
  };

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    loadOverview();
    loadStores();
    loadSettings();
    loadAuditLogs();
  });
})();
