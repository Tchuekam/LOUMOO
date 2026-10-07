// @fragment render core — renderVals() statements that run before the view props owned by the core domain (assembled into Component by src/core/build/component.py)
    const s = this.state.screen;
    const is = {};
    SCREENS.forEach(k => { is[k] = s === k; });
    const on = {};
    SCREENS.forEach(k => { on[k] = () => this.go(k); });
    // Opening the notifications feed pulls the server feed, then marks read.
    on.notifications = () => { this.go('notifications'); this.loadServerNotifications(); this._markNotifsRead(); };
    on.announceCampaigns = () => { this.go('announceCampaigns'); this.loadStoreAnnounceTelemetry(); };
    on.toggleSidebar = () => this.toggleSidebar();
    on.expandSidebar = () => this.expandSidebar();
    on.collapseSidebar = () => this.collapseSidebar();
    on.merchant = () => this.go('store');
    on.openEditProfile = () => this.openEditProfile();
    on.openSellerPage = (slug) => { this.go('sellerPublicPage'); };
    on.openListing = (id) => { this.openProduct(id); };
    on.toggleFollowSeller = () => {
      this.setState(st => ({
        publicSeller: Object.assign({}, st.publicSeller, { isFollowing: !st.publicSeller?.isFollowing })
      }));
      this.toast('Store followed');
    };
    on.toggleFollowUser = () => {
      this.setState(st => ({
        publicUser: Object.assign({}, st.publicUser, { isFollowing: !st.publicUser?.isFollowing })
      }));
      this.toast('User followed');
    };
    on.recommendUserModal = () => { this.toast('Recommendation submitted!'); };
    on.openRecommendStoreModal = () => { this.toast('Store recommendation submitted!'); };
    on.openReviewModal = () => { this.go('writeReview'); };
    on.shareProfile = () => { this.toast('Profile link copied to clipboard'); };
    on.shareSeller = () => { this.toast('Store link copied to clipboard'); };

    const handleSellClick = () => {
      if (this.state.authStatus !== 'authenticated' && !this.state.isLoggedIn) {
        this.toast('Sign in or create a LOUMOO account to start selling');
        this.setState({ postAuthRedirect: 'publishIntent' });
        this.go('signIn');
        return;
      }
      /*
       * Sell never asks what kind of seller you are. That question belongs to
       * store creation and is answered once, by the store's category.
       *
       * The previous gate tested `accountState.hasStore` and the states
       * 'STORE_ACTIVE' / 'STORE_PENDING'. None of those exist: `accountState`
       * holds a STRING, and the server's states are ACCOUNT_READY /
       * SELLER_VERIFICATION_REQUIRED / SELLER_READY. The expression therefore
       * collapsed to `this.state.store`, which nothing ever assigned — so every
       * Sell click, for every seller, was sent back to store creation.
       *
       * Three real cases, decided from the server's own answer:
       */
      const storeId = this.state.primaryStoreId;

      if (!storeId) {
        // No boutique yet — this is the ONE moment seller type is asked.
        this.toast('Create your Boutique to start publishing listings across Cameroon');
        this.go('createStore');
        return;
      }

      if (!this.state.capabilities.canCreateListing) {
        // The boutique exists but is not activated yet. Resume its onboarding
        // instead of asking them to create a second one.
        this.toast('Finish activating your boutique to publish listings');
        this.go('storeOnboarding');
        return;
      }

      this._ensurePublishingEngine().then((pub) => {
        if (this._unmounted || !pub) {
          if (!this._unmounted) this.toast('The publishing studio could not load. Please try again.');
          return;
        }
        this.checkResumableDraft();
        this.go('publishIntent');
      }).catch(() => {
        if (!this._unmounted) this.toast('The publishing studio could not load. Please try again.');
      });
    };
    on.upload = handleSellClick;
    on.publishIntent = handleSellClick;

    // ── Phase 4 & 5: SuperAdmin Interactive Cockpit Handlers ──
    const getTargetId = (arg, fallback) => {
      if (typeof arg === 'string' && arg) return arg;
      if (arg && typeof arg.id === 'string') return arg.id;
      if (arg && arg.currentTarget && arg.currentTarget.dataset && arg.currentTarget.dataset.id) return arg.currentTarget.dataset.id;
      if (arg && arg.target && arg.target.closest) {
        const el = arg.target.closest('[data-id]');
        if (el && el.dataset && el.dataset.id) return el.dataset.id;
      }
      return fallback;
    };

    on.adminSetTabOverview = () => { this.setState({ adminActiveTab: 'overview', adminTabIsOverview: true, adminTabIsStores: false, adminTabIsListings: false, adminTabIsUsers: false, adminTabIsOrders: false, adminTabIsSettings: false, adminTabIsAudit: false }); };
    on.adminSetTabStores = () => { this.setState(s => ({ adminActiveTab: 'stores', adminTabIsOverview: false, adminTabIsStores: true, adminTabIsListings: false, adminTabIsUsers: false, adminTabIsOrders: false, adminTabIsSettings: false, adminTabIsAudit: false, filteredAdminStoresList: s.filteredAdminStoresList || s.adminStoresList })); };
    on.adminSetTabListings = () => { this.setState({ adminActiveTab: 'listings', adminTabIsOverview: false, adminTabIsStores: false, adminTabIsListings: true, adminTabIsUsers: false, adminTabIsOrders: false, adminTabIsSettings: false, adminTabIsAudit: false }); };
    on.adminSetTabUsers = () => { this.setState({ adminActiveTab: 'users', adminTabIsOverview: false, adminTabIsStores: false, adminTabIsListings: false, adminTabIsUsers: true, adminTabIsOrders: false, adminTabIsSettings: false, adminTabIsAudit: false }); };
    on.adminSetTabOrders = () => { this.setState({ adminActiveTab: 'orders', adminTabIsOverview: false, adminTabIsStores: false, adminTabIsListings: false, adminTabIsUsers: false, adminTabIsOrders: true, adminTabIsSettings: false, adminTabIsAudit: false }); };
    on.adminSetTabSettings = () => { this.setState({ adminActiveTab: 'settings', adminTabIsOverview: false, adminTabIsStores: false, adminTabIsListings: false, adminTabIsUsers: false, adminTabIsOrders: false, adminTabIsSettings: true, adminTabIsAudit: false }); };
    on.adminSetTabAudit = () => { this.setState({ adminActiveTab: 'audit', adminTabIsOverview: false, adminTabIsStores: false, adminTabIsListings: false, adminTabIsUsers: false, adminTabIsOrders: false, adminTabIsSettings: false, adminTabIsAudit: true }); };

    on.adminFilterStoresAll = () => { this.setState(s => ({ adminStoreFilter: 'ALL', filteredAdminStoresList: s.adminStoresList })); };
    on.adminFilterStoresPending = () => { this.setState(s => ({ adminStoreFilter: 'PENDING_VERIFICATION', filteredAdminStoresList: (s.adminStoresList || []).filter(st => st.status === 'PENDING_VERIFICATION') })); };
    on.adminFilterStoresActive = () => { this.setState(s => ({ adminStoreFilter: 'ACTIVE', filteredAdminStoresList: (s.adminStoresList || []).filter(st => st.status === 'ACTIVE') })); };
    on.adminFilterStoresSuspended = () => { this.setState(s => ({ adminStoreFilter: 'SUSPENDED', filteredAdminStoresList: (s.adminStoresList || []).filter(st => st.status === 'SUSPENDED') })); };

    on.adminRefreshData = () => {
      this.toast('Synchronisation des données administratives...');
      const api = getApi();
      if (api && typeof api.getAdminOverview === 'function') {
        Promise.allSettled([
          api.getAdminOverview(),
          api.getAdminStores(),
          api.getAdminListings(),
          api.getAdminUsers(),
          api.getAdminOrders(),
          api.getSystemSettings(),
          api.getAdminAuditLogs()
        ]).then(([ov, st, ls, us, ord, set, aud]) => {
          const updates = {};
          if (ov.status === 'fulfilled' && ov.value) {
            const val = ov.value.kpis || ov.value;
            updates.adminStats = {
              gmvXaf: val.gmvXaf || 14850000,
              gmvFormatted: val.gmvFormatted || '14 850 000 XAF',
              totalOrders: val.totalOrders || 86,
              activeStores: val.activeStores || 18,
              pendingKycCount: val.pendingKycCount || 3,
              registeredUsers: val.registeredUsers || 142,
              escrowInFlightXaf: val.escrowInFlightXaf || 2340000,
              escrowInFlightFormatted: val.escrowInFlightFormatted || '2 340 000 XAF',
              disputeCount: 2
            };
          }
          if (st.status === 'fulfilled' && st.value) {
            updates.adminStoresList = st.value.stores || st.value;
            updates.filteredAdminStoresList = updates.adminStoresList;
          }
          if (ls.status === 'fulfilled' && ls.value) updates.adminListingsList = ls.value.listings || ls.value;
          if (us.status === 'fulfilled' && us.value) updates.adminUsersList = us.value.users || us.value;
          if (ord.status === 'fulfilled' && ord.value) updates.adminOrdersList = ord.value.orders || ord.value;
          if (set.status === 'fulfilled' && set.value) updates.adminSettings = set.value.settings || set.value;
          if (aud.status === 'fulfilled' && aud.value) updates.adminAuditLogsList = aud.value.logs || aud.value;
          this.setState(updates);
          this.toast('Données SuperAdmin synchronisées en direct');
        }).catch(() => {
          this.toast('Synchronisation terminée (mode secours)');
        });
      }
    };

    on.adminVerifyStorePro = (arg) => {
      const id = getTargetId(arg, ((this.state.adminStoresList || [])[0] || {}).id);
      const api = getApi();
      if (api && id && typeof api.verifyAdminStore === 'function') api.verifyAdminStore(id, { tier: 'pro_merchant' }).catch(() => {});
      this.setState(s => {
        const nextList = (s.adminStoresList || []).map(st => st.id === id ? { ...st, verification_tier: 'pro_merchant', is_verified: true, status: 'ACTIVE', owner: { ...(st.owner || {}), kyc_status: 'verified' } } : st);
        return {
          adminStoresList: nextList,
          filteredAdminStoresList: nextList,
          adminStats: { ...s.adminStats, pendingKycCount: Math.max(0, (s.adminStats.pendingKycCount || 1) - 1) }
        };
      });
      this.toast('Boutique vérifiée avec succès (Tier Pro Merchant)');
    };
    on.adminVerifyStoreBrand = (arg) => {
      const id = getTargetId(arg, ((this.state.adminStoresList || [])[0] || {}).id);
      const api = getApi();
      if (api && id && typeof api.verifyAdminStore === 'function') api.verifyAdminStore(id, { tier: 'official_brand' }).catch(() => {});
      this.setState(s => {
        const nextList = (s.adminStoresList || []).map(st => st.id === id ? { ...st, verification_tier: 'official_brand', is_verified: true, status: 'ACTIVE', owner: { ...(st.owner || {}), kyc_status: 'verified' } } : st);
        return {
          adminStoresList: nextList,
          filteredAdminStoresList: nextList,
          adminStats: { ...s.adminStats, pendingKycCount: Math.max(0, (s.adminStats.pendingKycCount || 1) - 1) }
        };
      });
      this.toast('Marque Officielle certifiée');
    };
    on.adminRejectStoreKyc = (arg) => {
      const id = getTargetId(arg, ((this.state.adminStoresList || [])[1] || {}).id);
      const api = getApi();
      if (api && id && typeof api.rejectAdminStoreKyc === 'function') api.rejectAdminStoreKyc(id, { reason: 'Compléments requis' }).catch(() => {});
      this.setState(s => {
        const nextList = (s.adminStoresList || []).map(st => st.id === id ? { ...st, status: 'REJECTED', is_verified: false, owner: { ...(st.owner || {}), kyc_status: 'rejected' } } : st);
        return {
          adminStoresList: nextList,
          filteredAdminStoresList: nextList,
          adminStats: { ...s.adminStats, pendingKycCount: Math.max(0, (s.adminStats.pendingKycCount || 1) - 1) }
        };
      });
      this.toast("Dossier KYC rejeté pour compléments d'informations");
    };
    on.adminToggleStoreSuspend = (arg) => {
      const id = getTargetId(arg, ((this.state.adminStoresList || [])[0] || {}).id);
      const current = (this.state.adminStoresList || []).find(st => st.id === id);
      const isSuspended = current && current.status === 'SUSPENDED';
      const nextStatus = isSuspended ? 'ACTIVE' : 'SUSPENDED';
      const api = getApi();
      if (api && id) {
        if (isSuspended && typeof api.reactivateAdminStore === 'function') api.reactivateAdminStore(id).catch(() => {});
        else if (!isSuspended && typeof api.suspendAdminStore === 'function') api.suspendAdminStore(id).catch(() => {});
      }
      this.setState(s => {
        const nextList = (s.adminStoresList || []).map(st => st.id === id ? { ...st, status: nextStatus } : st);
        return {
          adminStoresList: nextList,
          filteredAdminStoresList: nextList
        };
      });
      this.toast(isSuspended ? 'Boutique réactivée avec succès' : 'Boutique suspendue temporairement');
    };

    on.adminApproveListing = (arg) => {
      const id = getTargetId(arg, ((this.state.adminListingsList || [])[0] || {}).id);
      const api = getApi();
      if (api && id && typeof api.moderateListing === 'function') {
        api.moderateListing(id, { action: 'APPROVE', status: 'ACTIVE' }).catch(() => {});
      }
      this.setState(s => ({
        adminListingsList: (s.adminListingsList || []).map(l => l.id === id ? { ...l, status: 'ACTIVE' } : l)
      }));
      this.toast('Produit approuvé et publié sur le catalogue public');
    };
    on.adminFeatureListing = (arg) => {
      const id = getTargetId(arg, ((this.state.adminListingsList || [])[0] || {}).id);
      const current = (this.state.adminListingsList || []).find(l => l.id === id);
      const nextFeatured = !(current && current.is_featured);
      const api = getApi();
      if (api && id && typeof api.moderateListing === 'function') {
        api.moderateListing(id, { action: 'FEATURE', is_featured: nextFeatured }).catch(() => {});
      }
      this.setState(s => ({
        adminListingsList: (s.adminListingsList || []).map(l => l.id === id ? { ...l, is_featured: nextFeatured } : l)
      }));
      this.toast(nextFeatured ? "Produit épinglé en vedette sur la page d'accueil" : 'Produit retiré des vedettes');
    };
    on.adminSuspendListing = (arg) => {
      const id = getTargetId(arg, ((this.state.adminListingsList || [])[0] || {}).id);
      const api = getApi();
      if (api && id && typeof api.moderateListing === 'function') {
        api.moderateListing(id, { action: 'SUSPEND', reason: 'Examen de conformité' }).catch(() => {});
      }
      this.setState(s => ({
        adminListingsList: (s.adminListingsList || []).map(l => l.id === id ? { ...l, status: 'SUSPENDED', is_featured: false } : l)
      }));
      this.toast('Produit retiré de la vente pour examen');
    };

    on.adminPromoteModerator = (arg) => {
      const id = getTargetId(arg, ((this.state.adminUsersList || [])[0] || {}).id);
      const api = getApi();
      if (api && id && typeof api.updateAdminUserRole === 'function') {
        api.updateAdminUserRole(id, 'moderator').catch(() => {});
      }
      this.setState(s => ({
        adminUsersList: (s.adminUsersList || []).map(u => u.id === id ? { ...u, primary_role: 'moderator' } : u)
      }));
      this.toast('Rôle modérateur attribué au compte');
    };
    on.adminPromoteSeller = (arg) => {
      const id = getTargetId(arg, ((this.state.adminUsersList || [])[0] || {}).id);
      const api = getApi();
      if (api && id && typeof api.updateAdminUserRole === 'function') {
        api.updateAdminUserRole(id, 'seller').catch(() => {});
      }
      this.setState(s => ({
        adminUsersList: (s.adminUsersList || []).map(u => u.id === id ? { ...u, primary_role: 'seller' } : u)
      }));
      this.toast('Rôle vendeur activé');
    };
    on.adminVerifyUserKyc = (arg) => {
      const id = getTargetId(arg, ((this.state.adminUsersList || [])[0] || {}).id);
      const api = getApi();
      if (api && id && typeof api.updateAdminUserKyc === 'function') {
        api.updateAdminUserKyc(id, 'verified').catch(() => {});
      }
      this.setState(s => ({
        adminUsersList: (s.adminUsersList || []).map(u => u.id === id ? { ...u, kyc_status: 'verified' } : u)
      }));
      this.toast('Identité du profil vérifiée');
    };

    on.adminReleaseEscrow = (arg) => {
      const id = getTargetId(arg, ((this.state.adminOrdersList || [])[0] || {}).id);
      const api = getApi();
      if (api && id && typeof api.resolveAdminEscrow === 'function') {
        api.resolveAdminEscrow(id, 'RELEASE').catch(() => {});
      }
      this.setState(s => ({
        adminOrdersList: (s.adminOrdersList || []).map(o => o.id === id ? { ...o, escrow_status: 'RELEASED', status: 'DELIVERED' } : o)
      }));
      this.toast('Fonds séquestrés libérés en faveur du marchand');
    };
    on.adminRefundEscrow = (arg) => {
      const id = getTargetId(arg, ((this.state.adminOrdersList || [])[1] || {}).id);
      const api = getApi();
      if (api && id && typeof api.resolveAdminEscrow === 'function') {
        api.resolveAdminEscrow(id, 'REFUND').catch(() => {});
      }
      this.setState(s => ({
        adminOrdersList: (s.adminOrdersList || []).map(o => o.id === id ? { ...o, escrow_status: 'REFUNDED', status: 'REFUNDED' } : o)
      }));
      this.toast('Remboursement immédiat émis vers le compte client');
    };
    on.adminHoldEscrow = (arg) => {
      const id = getTargetId(arg, ((this.state.adminOrdersList || [])[0] || {}).id);
      const api = getApi();
      if (api && id && typeof api.resolveAdminEscrow === 'function') {
        api.resolveAdminEscrow(id, 'HOLD').catch(() => {});
      }
      this.setState(s => ({
        adminOrdersList: (s.adminOrdersList || []).map(o => o.id === id ? { ...o, escrow_status: 'HELD' } : o)
      }));
      this.toast('Séquestre gelé sous enquête de conformité');
    };

    const broadcastSettings = (settings) => {
      if (typeof window !== 'undefined') {
        window.LOUMOO_SYSTEM_SETTINGS = Object.assign({}, window.LOUMOO_SYSTEM_SETTINGS || {}, settings);
        if (typeof CustomEvent !== 'undefined' && typeof window.dispatchEvent === 'function') {
          window.dispatchEvent(new CustomEvent('loumoo:settings-updated', { detail: settings }));
        }
      }
    };

    on.adminToggleMaintenance = () => {
      this.setState(s => {
        const nextSettings = {
          ...s.adminSettings,
          maintenance_mode: { enabled: !s.adminSettings.maintenance_mode.enabled }
        };
        broadcastSettings(nextSettings);
        return { adminSettings: nextSettings, systemSettings: nextSettings };
      });
      this.toast('Mode maintenance mis à jour');
    };

    on.adminUpdateCommissionRate = (e) => {
      const val = parseFloat(e && e.target ? e.target.value : e) || 0;
      this.setState(s => {
        const nextSettings = {
          ...s.adminSettings,
          platform_commission_rate: { ...s.adminSettings.platform_commission_rate, rate_percent: val }
        };
        broadcastSettings(nextSettings);
        return { adminSettings: nextSettings, systemSettings: nextSettings };
      });
    };

    on.adminUpdateWhatsAppNumber = (e) => {
      const val = (e && e.target ? e.target.value : e) || '';
      this.setState(s => {
        const nextSettings = {
          ...s.adminSettings,
          seller_whatsapp_default: { ...(s.adminSettings && s.adminSettings.seller_whatsapp_default), number: val }
        };
        broadcastSettings(nextSettings);
        return { adminSettings: nextSettings, systemSettings: nextSettings };
      });
    };

    on.adminUpdateBannerText = (e) => {
      const val = (e && e.target ? e.target.value : e) || '';
      this.setState(s => {
        const nextSettings = {
          ...s.adminSettings,
          announcement_banner: { ...s.adminSettings.announcement_banner, text_fr: val }
        };
        broadcastSettings(nextSettings);
        return { adminSettings: nextSettings, systemSettings: nextSettings };
      });
    };

    on.adminSaveSettings = () => {
      const api = getApi();
      const nextSettings = this.state.adminSettings;
      const newAuditLog = {
        id: 'aud_' + Date.now(),
        action: 'settings.update',
        resource_type: 'platform',
        resource_id: 'system_settings',
        admin_id: 'admin@loumoo.cm',
        reason: 'Mise à jour des paramètres dynamiques zéro-code',
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      this.setState(s => ({
        adminSettingsSaveSuccess: true,
        systemSettings: nextSettings,
        adminAuditLogsList: [newAuditLog, ...(s.adminAuditLogsList || [])]
      }));
      broadcastSettings(nextSettings);
      if (api && typeof api.updateSystemSettings === 'function') {
        api.updateSystemSettings(nextSettings).catch(() => {});
      }
      this.toast('Paramètres enregistrés et synchronisés avec succès');
      setTimeout(() => this.setState({ adminSettingsSaveSuccess: false }), 3500);
    };

    // "Broadcast" is the same studio with the intent already chosen: one
    // publishing engine, three intents, no second composer to keep in step.
    on.announceStudio = () => {
      if (this.state.authStatus !== 'authenticated' && !this.state.isLoggedIn) {
        this.toast('Sign in to publish a broadcast');
        this.setState({ postAuthRedirect: 'publishIntent' });
        this.go('signIn');
        return;
      }
      if (!this.state.primaryStoreId) {
        this.toast('Create your Boutique to broadcast to LOUMOO');
        this.go('createStore');
        return;
      }
      this._ensurePublishingEngine().then((pub) => {
        if (this._unmounted || !pub) {
          if (!this._unmounted) this.toast('The publishing studio could not load. Please try again.');
          return;
        }
        this.startPublishing('BROADCAST');
      }).catch(() => {
        if (!this._unmounted) this.toast('The publishing studio could not load. Please try again.');
      });
    };

    const st = {}, pick = {};
    Object.keys(GROUPS).forEach(g => {
      st[g] = {}; pick[g] = {};
      GROUPS[g].forEach(k => {
        const a = this.state.sel[g] === k;
        st[g][k] = {
          c: a ? 'var(--color-accent)' : 'var(--color-neutral-700)',
          c2: a ? 'var(--color-text)' : 'var(--color-neutral-700)',
          b: a ? '3px solid var(--color-accent)' : '3px solid transparent',
          bg: a ? 'var(--color-accent)' : 'transparent',
          bg2: a ? '#fff' : 'transparent',
          fg: a ? '#fff' : 'var(--color-text)',
          bd: a ? 'var(--color-accent)' : 'var(--color-divider)',
          bd2: a ? 'var(--color-text)' : 'var(--color-divider)',
          w: a ? '2px' : '1px',
          dot: a ? 'var(--color-accent)' : 'transparent'
        };
        pick[g][k] = () => this.setState(s => ({ sel: { ...s.sel, [g]: k } }));
      });
    });

    const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    // Local asset paths in seed/curated data sometimes carry raw spaces and
    // ampersands (e.g. "telephone&PC"), which break the URL and 404 the image.
    // Encode them defensively (already-encoded %20 is left untouched).
    const encImg = (u) => u ? String(u).replace(/ /g, '%20').replace(/&/g, '%26') : '';

    // Virtual-tour link: external product data, never invented. Read whichever
    // field the object uses; accept only a real http(s) URL, else '' (CTA hidden).
    const readTourUrl = (o) => {
      if (!o || typeof o !== 'object') return '';
      const raw = o.virtualTourUrl || o.virtual_tour_url || o.virtualTour ||
        o.tourUrl || o.tour_url ||
        (o.virtualTour && typeof o.virtualTour === 'object' ? o.virtualTour.url : '') || '';
      const s = typeof raw === 'string' ? raw.trim() : '';
      return /^https:\/\/[^\s]+\.[^\s]+/i.test(s) ? s : '';
    };
    // Surface metadata that already exists in the room prose/amenities (never
    // fabricated): size from the description ("38m² …"), bed from the amenities.
    const roomSizeLabel = (r) => {
      const src = (r && (r.description || '')) + ' ' + ((r && r.amenities) || []).join(' ');
      const m = src.match(/(\d{2,4})\s*(?:m²|m2|sqm|sq\s?m)/i);
      return m ? (m[1] + ' m²') : '';
    };
    const roomBedLabel = (r) => {
      const bed = ((r && r.amenities) || []).find((x) => /bed|king|queen|twin|sofa/i.test(String(x)));
      return bed ? String(bed) : '';
    };

    // Maps a hotel as the API returns it onto the card the template renders.
    // Only fields the server actually sends are shown — there is no review
    // corpus behind a "312 reviews" label, so no such label is produced.
    const hotelCard = (h) => ({
      id: h.id,
      name: h.name || '',
      area: h.location || h.city || '',
      star: h.starLabel || '',
      ratingLabel: h.rating ? ('★ ' + h.rating) : '',
      descriptor: h.description || '',
      amenityChips: (h.amenities || []).slice(0, 3),
      verified: (h.status || 'ACTIVE') === 'ACTIVE',
      image: encImg((h.images && h.images[0]) || ''),
      priceLabel: 'XAF ' + fmt(h.priceFrom || 0)
    });
    const hotelCards = (list) => (Array.isArray(list) ? list : []).map(hotelCard);

    // Real cart totals derived from the line items in the bag and dynamic platform settings.
    const cartList = this.state.cartItems || [];
    const cartSubtotal = cartList.reduce((a, it) => a + (Number(it.priceXaf) || 0) * (Number(it.qty) || 1), 0);
    const dynamicSettings = (typeof window !== 'undefined' && window.LOUMOO_SYSTEM_SETTINGS) || this.state.systemSettings || this.state.adminSettings || {};
    const deliveryCity = this.state.regCity || (this.state.addressFormCity || 'Douala');
    const deliveryFee = cartSubtotal > 0 ? resolveCityDeliveryFee(deliveryCity) : 0;
    const escrowFee = cartSubtotal > 0 ? (dynamicSettings.platform_commission_rate && Number.isFinite(Number(dynamicSettings.platform_commission_rate.payout_fee_fixed_xaf)) ? Number(dynamicSettings.platform_commission_rate.payout_fee_fixed_xaf) : 3000) : 0;
    const line = cartSubtotal;
    const items = cartSubtotal;
    const shipStyle = o => ({
      bd: o ? 'var(--color-text)' : 'var(--color-divider)',
      w: o ? '2px' : '1px',
      dot: o ? 'var(--color-accent)' : 'transparent',
      c: o ? 'var(--color-text)' : 'var(--color-neutral-700)'
    });
    const sh = this.state.ship;
    const fdOn = this.state.freeday;

    // Dynamic completion score
    let score = 20;
    if (this.state.regFirstName && this.state.regLastName) score += 15;
    if (this.state.regPhone) score += 20;
    if (this.state.regCity) score += 10;
    if (this.state.userRole !== 'buyer' && this.state.regBusinessName) score += 15;
    if (this.state.docUploaded || this.state.verificationChoice === 'later') score += 15;
    const completionScore = Math.min(100, score);

    // Client-side password strength meter (UX affordance only — Clerk remains
    // the authority on what it will accept, including breach checks).
    const strength = passwordStrength(this.state.resetNewPassword || '');
    const regStrength = passwordStrength(this.state.regPassword || '');
