// @fragment props core — view-prop entries returned by renderVals() owned by the core domain (assembled into Component by src/core/build/component.py)
({
      is, on, st, pick,
      sidebarCollapsed: Boolean(this.state.sidebarCollapsed),
      sidebarNavClass: Boolean(this.state.sidebarCollapsed) ? 'collapsed' : '',
      toggleSidebar: () => this.toggleSidebar(),
      expandSidebar: () => this.expandSidebar(),
      collapseSidebar: () => this.collapseSidebar(),
      photoLabel: 'PRODUCT PHOTO ' + this.state.sel.photo.slice(1) + ' / 6',
      qty: this.state.qty,
      darkMode: this.state.darkMode,
      toggleDark: () => {
        const next = !this.state.darkMode;
        this.setState({ darkMode: next });
        document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
      },
      incQty: () => this.setState(s => ({ qty: Math.min(9, s.qty + 1) })),
      decQty: () => this.setState(s => ({ qty: Math.max(1, s.qty - 1) })),
      cartSubtotalLabel: 'XAF ' + fmt(items),
      cartDeliveryFee: deliveryFee,
      cartDeliveryFeeLabel: 'XAF ' + fmt(deliveryFee),
      cartTotal: 'XAF ' + fmt(items + deliveryFee + escrowFee),
      cartEscrowLabel: escrowFee > 0 ? ('XAF ' + fmt(escrowFee)) : 'XAF 0',
      payLabel: 'PAY XAF ' + fmt(items + deliveryFee + escrowFee) + ' WITH MOMO',
      hasAnnouncementBanner: Boolean(dynamicSettings.announcement_banner && (dynamicSettings.announcement_banner.enabled !== false && dynamicSettings.announcement_banner.active !== false)),
      announcementBannerText: (dynamicSettings.announcement_banner && (dynamicSettings.announcement_banner.text_fr || dynamicSettings.announcement_banner.message)) || '',
      isMaintenanceMode: Boolean(dynamicSettings.maintenance_mode && dynamicSettings.maintenance_mode.enabled),
      maintenanceModeBanner: (dynamicSettings.maintenance_mode && (dynamicSettings.maintenance_mode.banner_text || dynamicSettings.maintenance_mode.message)) || '',
      systemSettings: dynamicSettings,

      // ── Canonical Dynamic Product Details Getters & Actions ──
      productLoading: Boolean(this.state.productLoading),
      productNotFound: Boolean(this.state.productNotFound),
      productError: this.state.productError || '',
      currentProduct: this.state.currentProduct,
      currentProductTitle: this.state.currentProduct ? this.state.currentProduct.title : 'Apple MacBook Air 13” (M2 Chip)',
      currentProductPrice: (() => {
        const p = this.state.currentProduct;
        if (!p) return ('XAF ' + fmt(line));
        const rawP = p.price || (p.priceNumeric ? ('XAF ' + fmt(p.priceNumeric)) : (p.base_price_minor ? ('XAF ' + fmt(p.base_price_minor)) : ''));
        const rawSale = p.salePrice || '';
        if (rawSale && rawP && rawSale !== rawP) {
          const n1 = parseInt(String(rawP).replace(/[^0-9]/g, ''), 10) || 0;
          const n2 = parseInt(String(rawSale).replace(/[^0-9]/g, ''), 10) || 0;
          if (n1 > 0 && n2 > 0 && n1 !== n2) {
            return n1 < n2 ? rawP : rawSale;
          }
        }
        return rawP || rawSale || ('XAF ' + fmt(line));
      })(),
      currentProductSalePrice: (() => {
        const p = this.state.currentProduct;
        if (!p) return null;
        const rawP = p.price || (p.priceNumeric ? ('XAF ' + fmt(p.priceNumeric)) : (p.base_price_minor ? ('XAF ' + fmt(p.base_price_minor)) : ''));
        const rawSale = p.salePrice || '';
        if (rawSale && rawP && rawSale !== rawP) {
          const n1 = parseInt(String(rawP).replace(/[^0-9]/g, ''), 10) || 0;
          const n2 = parseInt(String(rawSale).replace(/[^0-9]/g, ''), 10) || 0;
          if (n1 > 0 && n2 > 0 && n1 !== n2) {
            return n1 < n2 ? rawSale : rawP;
          }
        }
        return null;
      })(),
      currentProductBrand: (this.state.currentProduct && this.state.currentProduct.brand) || ((this.state.currentProduct && this.state.currentProduct.title) ? String(this.state.currentProduct.title).trim().split(' ')[0] : '') || 'LOUMOO',
      currentProductBadge: this.state.currentProduct && this.state.currentProduct.verified ? 'VERIFIED BOUTIQUE' : 'OFFICIAL PARTNER',
      currentProductCategoryLabel: this.state.currentProduct ? (this.state.currentProduct.category || 'Electronics') : 'Smartphones & Laptops',
      currentProductConditionLabel: this.state.currentProduct ? (String(this.state.currentProduct.condition || 'new').toUpperCase() + ' · SEALED') : 'BRAND NEW · SEALED',
      currentProductFulfillmentLabel: this.state.currentProduct && this.state.currentProduct.fulfillmentModel ? this.state.currentProduct.fulfillmentModel.replace(/_/g, ' ') : 'Courier Delivery & Storefront Pickup',
      currentProductRating: this.state.currentProduct && this.state.currentProduct.rating ? Number(this.state.currentProduct.rating).toFixed(1) : '4.9',
      currentProductReviewCount: this.state.currentProduct && this.state.currentProduct.reviewsCount ? this.state.currentProduct.reviewsCount : 218,
      currentProductSoldCount: this.state.currentProduct && this.state.currentProduct.soldCount ? this.state.currentProduct.soldCount : 1240,
      currentProductDescription: this.state.currentProduct ? (this.state.currentProduct.description || this.state.currentProduct.shortDescription || '') : 'Brand new sealed unit with 12-month warranty. Instant pickup in Douala or Express courier delivery across Cameroon.',
      currentProductActiveImage: this.state.currentProductActiveImage || (this.state.currentProduct && (this.state.currentProduct.coverImage || this.state.currentProduct.image)) || null,
      pdpHasVideo: Boolean(this.state.currentProduct && this.state.currentProduct.videoUrl && (this.state.currentProductActiveImage === this.state.currentProduct.videoUrl || !this.state.currentProductActiveImage)),
      pdpHasImage: Boolean(this.state.currentProduct && (!this.state.currentProduct.videoUrl || this.state.currentProductActiveImage !== this.state.currentProduct.videoUrl) && (this.state.currentProductActiveImage || this.state.currentProduct.coverImage || this.state.currentProduct.image)),
      pdpVideoUrl: (this.state.currentProduct && this.state.currentProduct.videoUrl) || '',
      pdpVideoPoster: (this.state.currentProduct && (this.state.currentProduct.videoPoster || this.state.currentProduct.coverImage || this.state.currentProduct.image)) || '',
      currentProductImages: (() => {
        const p = this.state.currentProduct;
        if (!p) return [];
        if (p.images && p.images.length) return p.images;
        if (p.media && p.media.length) return p.media.map(m => m.url);
        if (p.image) return [p.image];
        return [];
      })(),
      currentProductAttributesList: (() => {
        const p = this.state.currentProduct;
        if (!p || !p.attributes) return [];
        return Object.entries(p.attributes).map(([k, v]) => ({ key: k.replace(/_/g, ' '), val: String(v) }));
      })(),
      productStoreName: this.state.currentProduct && (this.state.currentProduct.store ? this.state.currentProduct.store.name : this.state.currentProduct.merchant) ? (this.state.currentProduct.store ? this.state.currentProduct.store.name : this.state.currentProduct.merchant) : 'Orca Electronics',
      productStoreCity: this.state.currentProduct && (this.state.currentProduct.store ? this.state.currentProduct.store.city : this.state.currentProduct.merchantCity) ? (this.state.currentProduct.store ? this.state.currentProduct.store.city : this.state.currentProduct.merchantCity) : 'Akwa, Douala',
      productStoreVerified: Boolean(this.state.currentProduct ? (this.state.currentProduct.store ? this.state.currentProduct.store.isVerified : this.state.currentProduct.verified) : true),
      productStoreRating: this.state.currentProduct && this.state.currentProduct.store && this.state.currentProduct.store.rating ? Number(this.state.currentProduct.store.rating).toFixed(1) : '4.9',
      openProduct: (id) => this.openProduct(id),
      retryLoadProduct: () => this.openProduct(this.state.currentProductId),
      selectProductImage: (url) => this.selectProductImage(url),
      catalogProducts: this.state.catalogProducts || [],
      catalogLoading: Boolean(this.state.catalogLoading),
      catalogError: this.state.catalogError || '',
      // Display-ready cards for the home "Live catalogue" rail, from GET /products.
      catalogHasCards: (this.state.catalogProducts || []).length > 0,
      catalogCards: (this.state.catalogProducts || []).map((p) => ({
        id: p.id,
        title: p.title,
        imageUrl: encImg(p.imageUrl || p.image || ''),
        priceLabel: p.price || (p.priceNumeric ? ('XAF ' + fmt(p.priceNumeric)) : ''),
        ratingLabel: '★ ' + (p.rating != null ? p.rating : '5.0'),
        storeLabel: (p.storeName || 'LOUMOO seller') + (p.merchantCity ? (' · ' + p.merchantCity) : ''),
        tagline: p.tagline || (p.description ? String(p.description).split('. ')[0].slice(0, 80) : '') || p.categoryLabel || '',
        badge: p.badge || ''
      })),

      // Continuous smart infinite marketplace feed cards on Home screen
      hasHomeFeedCards: (() => {
        const pool = this._categoryProductPool('all');
        return pool.length > 0;
      })(),
      homeFeedCards: (() => {
        const pool = this._categoryProductPool('all');
        const parseNum = (str) => {
          const n = parseInt(String(str || '').replace(/[^0-9]/g, ''), 10);
          return isNaN(n) ? 0 : n;
        };
        const limit = this.state.homeFeedLimit || 24;
        return pool.slice(0, limit).map((p) => {
          const rawP = p.price || (p.priceNumeric ? ('XAF ' + fmt(p.priceNumeric)) : (p.base_price_minor ? ('XAF ' + fmt(p.base_price_minor)) : ''));
          const rawSale = p.salePrice || '';
          let heroPrice = rawP || 'Ask price';
          let strikePrice = '';
          if (rawSale && rawP && rawSale !== rawP) {
            const n1 = parseNum(rawP);
            const n2 = parseNum(rawSale);
            if (n1 > 0 && n2 > 0 && n1 !== n2) {
              heroPrice = n1 < n2 ? rawP : rawSale;
              strikePrice = n1 < n2 ? rawSale : rawP;
            } else {
              heroPrice = rawSale;
              strikePrice = rawP;
            }
          } else if (rawSale && !rawP) {
            heroPrice = rawSale;
          }
          return {
            id: p.id,
            title: p.title || p.name || 'Untitled listing',
            imageUrl: encImg(p.coverImage || p.imageUrl || p.image || (p.images && p.images[0]) || ''),
            priceLabel: heroPrice,
            strikeLabel: strikePrice,
            ratingLabel: '★ ' + (p.rating != null ? p.rating : '4.9'),
            storeLabel: (p.storeName || p.merchant || p.store || 'LOUMOO verified seller') + (p.merchantCity || p.storeCity ? (' · ' + (p.merchantCity || p.storeCity)) : ''),
            badge: p.badge || (p.isSale ? 'PROMO' : (p.verified ? '✓ Verified' : '')),
            verified: Boolean(p.verified)
          };
        });
      })(),
      ship: { home: shipStyle(sh.home), pickup: shipStyle(sh.pickup), nation: shipStyle(sh.nation) },
      toggleShip: {
        home: () => this.setState(s => ({ ship: { ...s.ship, home: !s.ship.home } })),
        pickup: () => this.setState(s => ({ ship: { ...s.ship, pickup: !s.ship.pickup } })),
        nation: () => this.setState(s => ({ ship: { ...s.ship, nation: !s.ship.nation } }))
      },
      fd: {
        bg: fdOn ? 'var(--color-accent)' : 'var(--color-neutral-300)',
        knob: fdOn ? '#fff' : 'var(--color-neutral-600)',
        pos: fdOn ? 'flex-end' : 'flex-start'
      },
      toggleFreeday: () => {
        const next = !this.state.freeday;
        this.setState({ freeday: next });
        this.toast(next ? 'Listing enrolled in Black FreeDay' : 'Removed from Black FreeDay');
      },
      say: {
        origin: () => this.toast('Origin — Douala International (DLA)'),
        dest: () => this.toast('Destination — Paris Charles de Gaulle (CDG)'),
        depart: () => this.toast('Departure: 12 Oct 2026'),
        ret: () => this.toast('One-way direct flight'),
        pax: () => this.toast('1 Adult · Economy Class'),
        reviews: () => this.toast('218 reviews · average 4.9 · 1 240 sold'),
        stock: () => this.toast('Sealed unit, 12-month Apple warranty in stock'),
        escrow: () => this.toast('Escrow protected: Seller is paid only upon your delivery confirmation'),
        followers: () => this.toast('1 240 followers · 318 products · replies in 5 min'),
        mainImg: () => this.toast('Application submitted with your LOUMOO profile'),
        addTag: () => this.toast('Tag added to the listing')
      },
      // Onboarding & Registration State & Two-Way Handlers
      userRole: this.state.userRole,
      regFirstName: this.state.regFirstName,
      regLastName: this.state.regLastName,
      regPhone: this.state.regPhone,
      regEmail: this.state.regEmail,
      regCity: this.state.regCity,
      regAddress: this.state.regAddress,
      regBusinessName: this.state.regBusinessName,
      regRccm: this.state.regRccm,
      legalForm: this.state.legalForm,
      interestTech: this.state.interestTech,
      interestFashion: this.state.interestFashion,
      interestTravel: this.state.interestTravel,
      interestServices: this.state.interestServices,
      priorityVerified: this.state.priorityVerified ?? true,
      priorityPrice: this.state.priorityPrice ?? false,
      prioritySpeed: this.state.prioritySpeed ?? false,
      priorityWarranty: this.state.priorityWarranty ?? false,
      sellerType: this.state.sellerType,
      prodPhysical: this.state.prodPhysical ?? true,
      prodDigital: this.state.prodDigital ?? false,
      prodServices: this.state.prodServices ?? false,
      prodRentals: this.state.prodRentals ?? false,
      verificationChoice: this.state.verificationChoice || 'now',
      docUploaded: this.state.docUploaded,

      // ────────────────────────────────────────────────────────────────────
      // Adaptive conversational onboarding (server-driven question spec)
      // ────────────────────────────────────────────────────────────────────
      adBusy: this.state.adBusy,
      adError: this.state.adError,
      adText: this.state.adText,
      adChipsSel: this.state.adChipsSel || [],
      adIntent: (this.state.adConversation && this.state.adConversation.intent) || null,
      adQuestion: (this.state.adConversation && this.state.adConversation.nextQuestion) || null,
      adPrompt: (this.state.adConversation && this.state.adConversation.nextQuestion && this.state.adConversation.nextQuestion.prompt) || null,
      adSubtitle: (this.state.adConversation && this.state.adConversation.nextQuestion && this.state.adConversation.nextQuestion.subtitle) || null,
      adAck: (this.state.adConversation && this.state.adConversation.nextQuestion && this.state.adConversation.nextQuestion.acknowledge) || null,
      adKind: (this.state.adConversation && this.state.adConversation.nextQuestion && this.state.adConversation.nextQuestion.kind) || 'mixed',
      adEssential: !!(this.state.adConversation && this.state.adConversation.nextQuestion && this.state.adConversation.nextQuestion.essential),
      adCanSkip: !!(this.state.adConversation && this.state.adConversation.nextQuestion && !this.state.adConversation.nextQuestion.essential),
      adChips: (() => {
        const q = this.state.adConversation && this.state.adConversation.nextQuestion;
        if (!q || !q.chips || !q.chips.length) return [];
        const sel = new Set(this.state.adChipsSel || []);
        return q.chips.map(c => ({ ...c, sel: sel.has(c.id) }));
      })(),
      adFreeText: (this.state.adConversation && this.state.adConversation.nextQuestion && this.state.adConversation.nextQuestion.freeText) || null,
      adProgressPercent: (this.state.adConversation && this.state.adConversation.nextQuestion && this.state.adConversation.nextQuestion.progress)
        ? this.state.adConversation.nextQuestion.progress.percent
        : 0,
      adMission: (this.state.adConversation && this.state.adConversation.mission) || null,
      adMissionPreview: (() => {
        const c = this.state.adConversation;
        if (!c || !c.nextQuestion || c.nextQuestion.key !== 'MISSION_CONFIRM' || !c.mission || !c.mission.preview) return null;
        return c.mission.preview;
      })(),
      adUnderstanding: (this.state.adConversation && this.state.adConversation.understanding) || null,

      // Handlers — every action posts to the server and renders its reply.
      adaptiveLoad: () => this._adaptiveLoad(),
      adaptiveReload: () => this._adaptiveLoad(),
      adaptiveBack: () => this.go('onboardOtp'),
      adaptiveSkipAll: () => {
        if (this.state.adBusy) return;
        this.setState({ adBusy: true, adError: '' });
        const api = getApi();
        const isSeller = (this.state.userRole === 'seller' || this.state.userRole === 'both');
        const next = isSeller ? 'seller' : 'home';
        if (!api) {
          this.setState({ adBusy: false });
          this.go(next);
          return;
        }
        api.completeAdaptiveOnboarding({ skipAll: true })
          .then(c => {
            if (this._unmounted) return;
            if (c && c.accountState) {
              const guard = getGuard();
              if (guard) guard.adopt(c.accountState);
              this._applyAccountState(c.accountState);
            }
            this.setState({ adBusy: false, adError: '' });
            this.go(next);
          })
          .catch(err => {
            if (this._unmounted) return;
            console.warn('[Onboarding] skipAll fallback:', err);
            this.setState({ adBusy: false, adError: '' });
            this.go(next);
          });
      },
      adaptiveStartOver: () => {
        const api = getApi();
        if (!api || this.state.adBusy) return;
        this.setState({ adBusy: true, adError: '' });
        api.restartAdaptiveOnboarding()
          .then(c => { if (!this._unmounted) this._adaptiveApply(c); })
          .catch(err => {
            if (this._unmounted) return;
            this.setState({ adBusy: false, adError: (err && err.message) || 'Could not restart. Please try again.' });
          });
      },
      adaptivePickChip: (chip) => {
        if (this.state.adBusy) return;
        const q = this.state.adConversation && this.state.adConversation.nextQuestion;
        if (!q) return;
        const kind = q.kind;
        if (kind === 'multi_choice') {
          // Toggle locally; submit happens on the continue button.
          const sel = new Set(this.state.adChipsSel || []);
          if (sel.has(chip.id)) sel.delete(chip.id); else sel.add(chip.id);
          this.setState({ adChipsSel: Array.from(sel) });
          return;
        }
        // single_choice / mixed: tapping the chip answers immediately.
        const payload = { questionKey: q.key, chip: chip.id };
        if (kind === 'mixed' && (this.state.adText || '').trim()) payload.text = this.state.adText.trim();
        this._adaptiveSubmit(payload);
      },
      adaptiveSubmitText: () => {
        if (this.state.adBusy) return;
        const q = this.state.adConversation && this.state.adConversation.nextQuestion;
        if (!q) return;
        const text = (this.state.adText || '').trim();
        const sel = this.state.adChipsSel || [];
        if (q.kind === 'multi_choice') {
          if (!sel.length) {
            this.setState({ adError: 'Pick at least one option to continue.' });
            return;
          }
          this._adaptiveSubmit({ questionKey: q.key, chips: sel });
          return;
        }
        const chip = sel[0] || null;
        if (!text && !chip) {
          this.setState({ adError: 'Say a little more — a few words is all it takes.' });
          return;
        }
        this._adaptiveSubmit({ questionKey: q.key, text: text || null, chip: chip || null });
      },
      adaptiveSkip: () => {
        if (this.state.adBusy) return;
        const q = this.state.adConversation && this.state.adConversation.nextQuestion;
        if (!q || q.essential) return;
        this._adaptiveSubmit({ questionKey: q.key, skip: true });
      },
      adaptiveConfirmMission: () => {
        if (this.state.adBusy) return;
        const q = this.state.adConversation && this.state.adConversation.nextQuestion;
        if (!q || q.key !== 'MISSION_CONFIRM') return;
        const text = (this.state.adText || '').trim();
        const api = getApi();
        if (!api) return;
        this.setState({ adBusy: true, adError: '' });
        // Answer the confirm question, then seal onboarding with the mission.
        api.submitAdaptiveAnswer({ questionKey: q.key, chip: 'confirm' })
          .then(() => api.completeAdaptiveOnboarding(text ? { missionTitle: text } : {}))
          .then(c => {
            if (this._unmounted) return;
            if (c && c.accountState) {
              const guard = getGuard();
              if (guard) guard.adopt(c.accountState);
              this._applyAccountState(c.accountState);
            }
            this._adaptiveApply(c);
            this._adaptiveFinish();
          })
          .catch(err => {
            if (this._unmounted) return;
            this.setState({ adBusy: false, adError: (err && err.message) || 'Could not finish. Please try again.' });
          });
      },
      adaptiveEditMission: () => {
        // "Let me adjust it": restart the conversation so the user can re-shape
        // their goal — supported first-class by the server ("change my goal").
        this.adaptiveStartOver();
      },
      updateAdText: (e) => this.setState({ adText: e && e.target ? e.target.value : e, adError: '' }),
      completionScore,


      editFromReview: Boolean(this.state.editFromReview),
      editIdentityFromReview: () => {
        this.setState({ editFromReview: true });
        this.go('onboardIdentity');
      },
      editRoleFromReview: () => {
        this.setState({ editFromReview: true });
        this.go('onboardType');
      },
      editBuyerFromReview: () => {
        this.setState({ editFromReview: true });
        this.go('onboardBuyer');
      },
      editBusinessFromReview: () => {
        this.setState({ editFromReview: true });
        this.go('onboardBusiness');
      },

      // Role Selection — the intent is held locally until there is an account
      // to attach it to, then recorded on the server by _startServerOnboarding.
      setRoleBuyer: () => {
        this.setState({ userRole: 'buyer' });
        if (this.state.editFromReview) {
          this.setState({ editFromReview: false });
          this.go('onboardReview');
        } else if (this.state.authStatus === 'authenticated') {
          this.go('onboardBuyer');
        } else {
          this.go('onboardIdentity');
        }
      },
      setRoleSeller: () => {
        this.setState({ userRole: 'seller' });
        if (this.state.editFromReview) {
          this.setState({ editFromReview: false });
          this.go('onboardReview');
        } else if (this.state.authStatus === 'authenticated') {
          this.go('onboardSeller');
        } else {
          this.go('onboardIdentity');
        }
      },
      setRoleBoth: () => {
        this.setState({ userRole: 'both' });
        if (this.state.editFromReview) {
          this.setState({ editFromReview: false });
          this.go('onboardReview');
        } else if (this.state.authStatus === 'authenticated') {
          this.go('onboardBuyer');
        } else {
          this.go('onboardIdentity');
        }
      },

      // Registration fields (real Clerk account creation)
      regPassword: this.state.regPassword,
      regShowPassword: this.state.regShowPassword,
      regBusy: this.state.regBusy,
      regError: this.state.regError,
      regPasswordStrengthPct: regStrength.pct,
      regPasswordStrengthLabel: regStrength.label,
      regPasswordStrengthColor: regStrength.color,
      updateRegPassword: (e) => this.setState({
        regPassword: e && e.target ? e.target.value : e, regError: ''
      }),
      toggleRegPassword: () => this.setState(s => ({ regShowPassword: !s.regShowPassword })),

      // Whether this deployment can genuinely verify a phone number. Reported
      // by the server, so the UI never offers a verification nothing can do.
      phoneVerificationAvailable: Boolean(this.state.phoneVerificationAvailable),

      /** Real phone verification, available only when a provider is configured. */
      startPhoneVerification: () => {
        const api = getApi();
        const clerk = getClerk();
        if (!api || !clerk || !clerk.isReady) return;

        const phoneDigits = String(this.state.regPhone || '').replace(/[^0-9]/g, '');
        const phone = phoneDigits ? (phoneDigits.startsWith('237') ? '+' + phoneDigits : '+237' + phoneDigits) : '';

        api.requestPhoneVerification(phone).then(() => {
          return clerk.preparePhoneVerification(phone);
        }).then(() => {
          if (this._unmounted) return;
          this.toast('A code is on its way to ' + phone);
        }).catch(err => {
          if (this._unmounted) return;
          // A 503 here means the deployment has no SMS provider. Say so
          // plainly rather than leaving the user waiting for a code that will
          // never arrive.
          const requirement = err && err.status === 503
            ? 'Phone verification is not switched on for LOUMOO yet.'
            : ((err && err.message) || 'Could not send that code.');
          this.toast(requirement);
        });
      },

      // Dynamic Flow Navigation
      continueFromType: () => {
        if (!this.state.userRole) {
          this.toast('Please select how you will use LOUMOO to continue');
          return;
        }
        if (this.state.editFromReview) {
          this.setState({ editFromReview: false });
          this.go('onboardReview');
          return;
        }
        if (this.state.authStatus === 'authenticated') {
          if (this.state.userRole === 'seller') this.go('onboardSeller');
          else this.go('onboardBuyer');
          return;
        }
        this.go('onboardIdentity');
      },
      /**
       * Creates the real account with Clerk and asks it to send a real code.
       * Nothing local is marked "registered": the next screen only advances
       * once the code the user actually received has been accepted.
       */
      continueFromIdentity: () => {
        const first = (this.state.regFirstName || '').trim();
        const last = (this.state.regLastName || '').trim();
        const email = (this.state.regEmail || '').trim();
        const phone = (this.state.regPhone || '').trim();
        const city = (this.state.regCity || 'douala').trim();
        const password = this.state.regPassword || '';

        if (!first || !last) {
          this.setState({ regError: 'Enter your first and last name.' });
          return;
        }

        // Already signed in (resuming onboarding or editing identity):
        if (this.state.authStatus === 'authenticated') {
          const api = getApi();
          if (api && api.saveOnboardingStep) {
            api.saveOnboardingStep('PERSONAL_INFO', { firstName: first, lastName: last, phone, city }).catch(() => {});
          }
          if (this.state.editFromReview) {
            this.setState({ editFromReview: false });
            this.go('onboardReview');
            return;
          }
          if (this.state.isEmailVerified) {
            if (this.state.userRole === 'seller') {
              this.go('onboardSeller');
            } else {
              this.go('onboardBuyer');
            }
            return;
          }
          this.go('onboardOtp');
          return;
        }

        if (!EMAIL_RE.test(email)) {
          this.setState({ regError: 'Enter a valid email address — this is where your code goes.' });
          return;
        }
        if (this.state.regBusy) return;

        if (password.length < 8) {
          this.setState({ regError: 'Choose a password with at least 8 characters.' });
          return;
        }

        const clerk = getClerk();
        if (!clerk || !clerk.isReady) {
          this.setState({
            regError: this.state.authProviderError
              || 'Account creation is still loading. Give it a moment and try again.'
          });
          return;
        }

        this.setState({ regBusy: true, regError: '' });

        clerk.signUp({ email: email, password: password, firstName: first, lastName: last })
          .then(result => {
            if (this._unmounted) return null;
            this.setState({
              regBusy: false,
              regPassword: '',
              emailVerifyCode: '',
              emailVerifyError: '',
              emailVerifyState: result.needsEmailCode ? 'pending' : 'verified'
            });
            this._startEmailCooldown();
            this.go('onboardOtp');

            // Some Clerk instances complete sign-up without a code; establish
            // the LOUMOO session immediately in that case.
            if (!result.needsEmailCode) return this._establishSession();
            return null;
          })
          .catch(err => {
            if (this._unmounted) return;
            this.setState({ regBusy: false, regError: clerk.describeError(err) });
          });
      },

      /**
       * Verifies the emailed code, establishes the LOUMOO session, records the
       * buyer/seller intent on the server, then continues the wizard.
       */
      continueAfterOtp: () => {
        const now = Date.now();
        if (this._lastOtpClick && (now - this._lastOtpClick) < 1000) {
          return;
        }
        this._lastOtpClick = now;

        const api = getApi();
        const clerk = getClerk();
        const nextScreen = 'onboardAdaptive';

        // Already verified and signed in — just move on.
        if (this.state.emailVerifyState === 'verified' && this.state.authStatus === 'authenticated') {
          this._startServerOnboarding().then(() => { this.go(nextScreen); this._adaptiveLoad(); });
          return;
        }

        const code = (this.state.emailVerifyCode || '').trim();
        if (code.length !== 6 && this.state.emailVerifyState !== 'verified') {
          this.setState({ emailVerifyError: 'Enter the 6-digit code from your email.' });
          return;
        }
        if (!clerk || !clerk.isReady || !api) {
          this.setState({
            emailVerifyError: this.state.authProviderError || 'Verification is unavailable right now.'
          });
          return;
        }
        if (this.state.emailVerifyState === 'verifying') return;

        this.setState({ emailVerifyState: 'verifying', emailVerifyError: '' });

        const attempt = (typeof clerk.verifyEmailCode === 'function')
          ? clerk.verifyEmailCode(code)
          : ((typeof clerk.attemptEmailVerification === 'function')
              ? clerk.attemptEmailVerification(code)
              : Promise.reject(new Error('Verification service not ready')));

        Promise.resolve(attempt)
          .then(() => this._establishSession())
          .then(accountState => {
            // Confirm the authenticated session with the server
            return api.getAccountState().catch(() => accountState);
          })
          .then(accountState => {
            if (this._unmounted) return null;
            this.setState({ emailVerifyState: 'verified', emailVerifyError: '' });
            return this._startServerOnboarding().then(() => {
              this.go(nextScreen);
              this._adaptiveLoad();
            });
          })
          .catch(err => {
            if (this._unmounted) return;
            const clerkErr = err && err.errors && err.errors[0];
            const errCode = clerkErr ? clerkErr.code : (err && err.code);
            const status = (clerkErr && clerkErr.status) || (err && err.status);
            const isRateLimit = errCode === 'too_many_attempts' || status === 429 || String(err && err.message).toLowerCase().includes('too many');

            let msg = 'Verification failed. Please try again.';
            if (isRateLimit) {
              msg = 'Too many attempts on this code. Click "Resend code" below to receive a fresh code.';
            } else if (errCode === 'form_code_incorrect' || errCode === 'verification_failed') {
              msg = 'That code is incorrect. Check your email or click "Resend code" below.';
            } else if (errCode === 'verification_expired') {
              msg = 'That code has expired. Click "Resend code" below to receive a fresh code.';
            } else {
              msg = clerk.describeError(err) || (err && err.message) || msg;
            }

            this.setState({
              emailVerifyState: 'pending',
              emailVerifyError: msg
            });
          });
      },
      resendEmailVerification: () => {
        if (this.state.emailVerifyCooldown > 0) return;
        const clerk = getClerk();
        if (!clerk || !clerk.isReady) {
          this.setState({ emailVerifyError: 'Verification service is initializing. Please wait.' });
          return;
        }
        this.setState({ emailVerifyError: '', emailVerifyCode: '', emailVerifyState: 'pending' });
        clerk.resendEmailCode()
          .then(() => {
            this._startEmailCooldown();
            this.toast('New 6-digit verification code sent to ' + (this.state.regEmail || 'your email'));
          })
          .catch(err => {
            const msg = clerk.describeError(err) || (err && err.message) || 'Could not resend code. Please wait a moment.';
            this.setState({ emailVerifyError: msg });
          });
      },
      changeVerifyEmail: () => {
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('loumoo_onboarding_draft');
            localStorage.removeItem('loumoo_token');
            localStorage.removeItem('loumoo_auth_user');
          }
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.clear();
          }
        } catch (e) {}
        this.setState({ emailVerifyError: '', emailVerifyCode: '', emailVerifyState: 'idle' });
        this.go('onboardIdentity');
      },
      continueAfterBuyer: () => {
        if (this.state.editFromReview) {
          this.setState({ editFromReview: false });
          this.go('onboardReview');
          return;
        }
        if (this.state.userRole === 'both') {
          this.go('onboardSeller');
        } else {
          this.go('onboardReview');
        }
      },
      continueAfterSeller: () => {
        if (this.state.editFromReview) {
          this.setState({ editFromReview: false });
          this.go('onboardReview');
          return;
        }
        if (this.state.sellerType === 'individual') {
          this.go('onboardVerify');
        } else {
          this.go('onboardBusiness');
        }
      },

      // Form Field Two-Way Bindings
      updateRegFirstName: (e) => this.setState({ regFirstName: e && e.target ? e.target.value : e }),
      updateRegLastName: (e) => this.setState({ regLastName: e && e.target ? e.target.value : e }),
      updateRegPhone: (e) => this.setState({ regPhone: e && e.target ? e.target.value : e }),
      updateRegEmail: (e) => this.setState({ regEmail: e && e.target ? e.target.value : e }),
      updateRegCity: (e) => this.setState({ regCity: e && e.target ? e.target.value : e }),
      updateRegAddress: (e) => this.setState({ regAddress: e && e.target ? e.target.value : e }),
      updateRegBusinessName: (e) => this.setState({ regBusinessName: e && e.target ? e.target.value : e }),
      updateRegRccm: (e) => this.setState({ regRccm: e && e.target ? e.target.value : e }),
      updateLegalForm: (e) => this.setState({ legalForm: e && e.target ? e.target.value : e }),

      // Buyer Preferences Toggles
      toggleInterestTech: () => this.setState(s => ({ interestTech: !s.interestTech })),
      toggleInterestFashion: () => this.setState(s => ({ interestFashion: !s.interestFashion })),
      toggleInterestTravel: () => this.setState(s => ({ interestTravel: !s.interestTravel })),
      toggleInterestServices: () => this.setState(s => ({ interestServices: !s.interestServices })),
      togglePriorityVerified: () => this.setState(s => ({ priorityVerified: !(s.priorityVerified ?? true) })),
      togglePriorityPrice: () => this.setState(s => ({ priorityPrice: !s.priorityPrice })),
      togglePrioritySpeed: () => this.setState(s => ({ prioritySpeed: !s.prioritySpeed })),
      togglePriorityWarranty: () => this.setState(s => ({ priorityWarranty: !s.priorityWarranty })),

      // Seller Classification Handlers (Instant smart routing based on seller classification)
      setSellerIndividual: () => {
        this.setState({ sellerType: 'individual' });
        this.go('onboardVerify');
      },
      setSellerPro: () => {
        this.setState({ sellerType: 'pro' });
        this.go('onboardBusiness');
      },
      setSellerCompany: () => {
        this.setState({ sellerType: 'company' });
        this.go('onboardBusiness');
      },
      setSellerService: () => {
        this.setState({ sellerType: 'service' });
        this.go('onboardBusiness');
      },
      toggleProdPhysical: () => this.setState(s => ({ prodPhysical: !(s.prodPhysical ?? true) })),
      toggleProdDigital: () => this.setState(s => ({ prodDigital: !s.prodDigital })),
      toggleProdServices: () => this.setState(s => ({ prodServices: !s.prodServices })),
      toggleProdRentals: () => this.setState(s => ({ prodRentals: !s.prodRentals })),

      // Verification Handlers (Instant smart progression to review with real document upload)
      setVerifyNow: () => {
        this.setState({ verificationChoice: 'now' });
        this.go('onboardReview');
      },
      setVerifyLater: () => {
        this.setState({ verificationChoice: 'later', docUploaded: false });
        this.go('onboardReview');
      },
      setVerifyNa: () => {
        this.setState({ verificationChoice: 'na', docUploaded: false });
        this.go('onboardReview');
      },
      handleVerificationDocUpload: (e) => {
        const file = e && e.target && e.target.files && e.target.files[0];
        if (!file) return;
        const api = getApi();
        this.setState({ docUploading: true, docUploadError: '' });

        // No offline branch. It used to wait 600ms and then declare the
        // document "encrypted and attached for verification" without a single
        // byte leaving the browser — the user believed their CNI was submitted.
        if (!api) {
          this.setState({
            docUploading: false,
            docUploadError: 'LOUMOO is unreachable, so your document was not uploaded. Try again once you are online.'
          });
          return;
        }
        api.uploadVerificationDocument(file, 'cni_front').then(res => {
          if (!this._unmounted) {
            const data = (res && res.data) || res || {};
            if (!data.uploadId) {
              this.setState({
                docUploading: false,
                docUploaded: false,
                docUploadError: 'The upload did not complete. Please try again.'
              });
              return;
            }
            this.setState({
              docUploading: false,
              docUploaded: true,
              docFileName: file.name,
              docFileSize: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
              docUploadId: data.uploadId,
              docUploadUrl: data.url
            });
            // Uploaded is not verified. Saying "verified" told the user a
            // review had already happened and passed.
            this.toast('Document uploaded securely — pending review');
          }
        }).catch(err => {
          if (!this._unmounted) {
            this.setState({
              docUploading: false,
              docUploadError: (err && err.message) || 'Upload failed. Please choose a valid image or PDF (max 10 MB).'
            });
          }
        });
      },
      handleStoreVerDocUpload: (e) => {
        const file = e && e.target && e.target.files && e.target.files[0];
        if (!file) return;
        const api = getApi();
        this.setState({ verDocUploading: true, verDocUploadError: '' });

        if (!api) {
          this.setState({
            verDocUploading: false,
            verDocUploadError: 'LOUMOO is unreachable, so your document was not uploaded. Try again once you are online.'
          });
          return;
        }
        api.uploadVerificationDocument(file, 'rccm').then(res => {
          if (!this._unmounted) {
            const data = (res && res.data) || res || {};
            if (!data.uploadId) {
              this.setState({
                verDocUploading: false,
                verDocUploaded: false,
                verDocAttached: false,
                verDocUploadError: 'The upload did not complete. Please try again.'
              });
              return;
            }
            this.setState({
              verDocUploading: false,
              verDocUploaded: true,
              verDocAttached: true,
              verDocFileName: file.name,
              // Carried into submitStoreVerificationDocs as cniFrontUrl; the
              // previous key `verDocFrontUrl` was written but never read, so the
              // document never reached the verification record.
              verDocUploadUrl: data.url,
              verDocFrontUrl: data.url
            });
            this.toast('Legal document uploaded securely — pending review');
          }
        }).catch(err => {
          if (!this._unmounted) {
            this.setState({
              verDocUploading: false,
              verDocUploadError: (err && err.message) || 'Upload failed. Please choose a valid image or PDF.'
            });
          }
        });
      },
      docUploading: Boolean(this.state.docUploading),
      docUploadError: this.state.docUploadError || '',
      docFileName: this.state.docFileName || '',
      docFileSize: this.state.docFileSize || '',
      verDocUploading: Boolean(this.state.verDocUploading),
      verDocUploadError: this.state.verDocUploadError || '',
      verDocFileName: this.state.verDocFileName || '',
      verDocUploaded: Boolean(this.state.verDocUploaded),
      signOut: () => this.signOut(),
      resendOtp: () => this.toast('New 6-digit verification code sent to ' + (this.state.regPhone || 'your phone')),

      // ── Dedicated Selling & Upload Wizard Handlers ──
      handleSellClick,
      currentStoreName: (this.state.store && this.state.store.name) || this.state.regBusinessName || 'Your Boutique',
      hasOwnStore: Boolean(this.state.primaryStoreId),
      currentStoreSlug: (this.state.store && this.state.store.slug) || (this.state.primaryStoreId ? this.state.primaryStoreId.replace('store_', '') : 'store'),
      openPublicStorefront: () => {
        const slug = (this.state.store && this.state.store.slug) || '';
        if (typeof window !== 'undefined' && slug) {
          window.open('/s/' + encodeURIComponent(slug), '_blank');
        } else {
          this.toast('Storefront URL: /s/' + (slug || 'store'));
        }
      },
      currentStoreCategoryLabel: (() => {
        const LABELS = { electronics:'Electronics & Tech', fashion:'Fashion & Apparel', home:'Home & Living',
          services:'Professional Services', hotels:'Hospitality', hospitality:'Hospitality', food:'Food & Grocery',
          beauty:'Beauty & Care', automotive:'Automotive', travel:'Travel', general:'General Retail' };
        const c = String(this.state.store && (this.state.store.categoryId || this.state.store.category_id || this.state.store.category) || '').toLowerCase();
        return LABELS[c] || 'General Retail';
      })(),
      storeCategory: (this.state.store && (this.state.store.categoryId || this.state.store.category_id || this.state.store.category)) || 'general',

      // ── Seller Studio Dynamic Metrics & Empty States ──
      sellerRevenue: this.state.sellerRevenue || 'XAF 0',
      /* A delta and a note are different things. 'No sales this month yet' was
         being fed into the delta slot, so an empty month rendered as a green
         pill beside the number - the visual language for good news. A delta is
         shown only when there is a real movement to report; otherwise the
         sentence goes underneath as a note, in muted grey. */
      sellerRevenueDelta: /^[+\-]/.test(String(this.state.sellerRevenueDelta || '')) ? this.state.sellerRevenueDelta : '',
      sellerRevenueNote: this.state.sellerRevenueNote
        || (this.state.sellerRevenueDelta && !/^[+\-]/.test(String(this.state.sellerRevenueDelta))
              ? this.state.sellerRevenueDelta
              : 'No sales yet this month. Your first published listing starts the clock.'),
      sellerRevenueDeltaColor: this.state.sellerRevenueDeltaColor || 'var(--color-text-muted)',
      sellerActiveOrdersCount: Number(this.state.sellerActiveOrdersCount || 0),
      sellerActiveOrdersNote: this.state.sellerActiveOrdersNote || '0 ready for dispatch',
      sellerStoreViewsCount: Number(this.state.sellerStoreViewsCount || 0),
      sellerStoreViewsNote: this.state.sellerStoreViewsNote || '0 views this week',
      sellerLiveCount: Number(this.state.sellerLiveCount || (this.state.catalogProducts && this.state.catalogProducts.length ? this.state.catalogProducts.length : 0)),
      sellerDraftCount: Number(this.state.sellerDraftCount || 0),
      sellerSoldCount: Number(this.state.sellerSoldCount || 0),


      // ══════════════════════════════════════════════════════════════════
      // PHASE A — ACCOUNT ACCESS (Sign In · Password Reset · Email Verify)
      // ══════════════════════════════════════════════════════════════════

      signInIdentifier: this.state.signInIdentifier,
      signInPassword: this.state.signInPassword,
      signInShowPassword: this.state.signInShowPassword,
      signInBusy: this.state.signInBusy,
      signInError: this.state.signInError,

      updateSignInIdentifier: (e) => this.setState({
        signInIdentifier: e && e.target ? e.target.value : e, signInError: ''
      }),
      updateSignInPassword: (e) => this.setState({
        signInPassword: e && e.target ? e.target.value : e, signInError: ''
      }),
      toggleSignInPassword: () => this.setState(s => ({ signInShowPassword: !s.signInShowPassword })),

      /**
       * POST /api/v1/auth/signin -> SignInUseCase.
       * The backend accepts an identifier with an optional password; it returns
       * a session token which the API client persists for later calls.
       */
      /** Real sign-in through Clerk; LOUMOO never sees the password. */
      submitSignIn: () => {
        const identifier = (this.state.signInIdentifier || '').trim();
        const password = this.state.signInPassword || '';

        if (!identifier) {
          this.setState({ signInError: 'Enter the email address on your account.' });
          return;
        }
        if (!password) {
          this.setState({ signInError: 'Enter your password.' });
          return;
        }
        if (this.state.signInBusy) return;

        const clerk = getClerk();
        if (!clerk || !clerk.isReady) {
          this.setState({
            signInError: this.state.authProviderError
              || 'Sign-in is still loading. Give it a moment and try again.'
          });
          return;
        }

        this.setState({ signInBusy: true, signInError: '' });

        clerk.signIn(identifier, password)
          .then(() => this._completeSignIn())
          .catch(err => {
            if (this._unmounted) return;
            this.setState({
              signInBusy: false,
              signInPassword: '',
              signInError: clerk.describeError(err)
            });
          });
      },

      // ── Password reset ──
      resetEmail: this.state.resetEmail,
      resetCode: this.state.resetCode,
      resetNewPassword: this.state.resetNewPassword,
      resetConfirmPassword: this.state.resetConfirmPassword,
      resetShowPassword: this.state.resetShowPassword,
      resetBusy: this.state.resetBusy,
      resetError: this.state.resetError,
      resetRequestSent: this.state.resetRequestSent,
      resetServerMessage: this.state.resetServerMessage,
      resetCooldown: this.state.resetCooldown,
      passwordStrengthPct: strength.pct,
      passwordStrengthLabel: strength.label,
      passwordStrengthColor: strength.color,

      updateResetEmail: (e) => this.setState({
        resetEmail: e && e.target ? e.target.value : e, resetError: ''
      }),
      updateResetCode: (e) => this.setState({
        resetCode: (e && e.target ? e.target.value : e || '').replace(/[^0-9]/g, '').slice(0, 6),
        resetError: ''
      }),
      updateResetNewPassword: (e) => this.setState({
        resetNewPassword: e && e.target ? e.target.value : e, resetError: ''
      }),
      updateResetConfirmPassword: (e) => this.setState({
        resetConfirmPassword: e && e.target ? e.target.value : e, resetError: ''
      }),
      toggleResetPassword: () => this.setState(s => ({ resetShowPassword: !s.resetShowPassword })),

      /** Real password reset: Clerk sends the code and checks it. */
      submitResetRequest: () => {
        const email = (this.state.resetEmail || '').trim();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
          this.setState({ resetError: 'Enter a valid email address.' });
          return;
        }
        if (this.state.resetBusy || this.state.resetCooldown > 0) return;

        const clerk = getClerk();
        if (!clerk || !clerk.isReady) {
          this.setState({
            resetError: this.state.authProviderError || 'Password reset is unavailable right now.'
          });
          return;
        }

        this.setState({ resetBusy: true, resetError: '' });

        clerk.requestPasswordReset(email).then(() => {
          if (this._unmounted) return;
          this.setState({
            resetBusy: false,
            resetRequestSent: true,
            // Deliberately uniform: it must not reveal whether the address is
            // registered, so the wording is the same either way.
            resetServerMessage: 'If an account exists for ' + email
              + ', a recovery code has been sent to it.'
          });
          this._startResetCooldown();
        }).catch(err => {
          if (this._unmounted) return;
          // A "not found" is also answered uniformly, for the same reason.
          const notFound = err && err.errors
            && err.errors.some(e => e.code === 'form_identifier_not_found');

          if (notFound) {
            this.setState({
              resetBusy: false,
              resetRequestSent: true,
              resetServerMessage: 'If an account exists for ' + email
                + ', a recovery code has been sent to it.'
            });
            this._startResetCooldown();
            return;
          }

          this.setState({ resetBusy: false, resetError: clerk.describeError(err) });
        });
      },

      submitResetConfirm: () => {
        const code = (this.state.resetCode || '').trim();
        const pwd = this.state.resetNewPassword || '';
        const confirm = this.state.resetConfirmPassword || '';

        if (code.length !== 6 && this.state.emailVerifyState !== 'verified') {
          this.setState({ resetError: 'Enter the 6-digit recovery code.' });
          return;
        }
        if (pwd.length < 8) {
          this.setState({ resetError: 'Your password must be at least 8 characters.' });
          return;
        }
        if (pwd !== confirm) {
          this.setState({ resetError: 'The two passwords do not match.' });
          return;
        }
        if (this.state.resetBusy) return;

        const clerk = getClerk();
        if (!clerk || !clerk.isReady) {
          this.setState({ resetError: 'Password reset is unavailable right now.' });
          return;
        }

        this.setState({ resetBusy: true, resetError: '' });

        clerk.confirmPasswordReset(code, pwd).then(() => {
          if (this._unmounted) return;
          this.setState({
            resetBusy: false, resetCode: '', resetNewPassword: '',
            resetConfirmPassword: '', resetError: '', resetRequestSent: false
          });
          this.toast('Password updated. You are now signed in.');
          return this._completeSignIn();
        }).catch(err => {
          if (this._unmounted) return;
          this.setState({ resetBusy: false, resetError: clerk.describeError(err) });
        });
      },

      // ── Email verification (Clerk sends the code; the server confirms) ──
      emailVerifyState: this.state.emailVerifyState,
      emailVerifyCode: this.state.emailVerifyCode,
      emailVerifyError: this.state.emailVerifyError,
      emailVerifyCooldown: this.state.emailVerifyCooldown,
      otpBtnDisabled: this.state.emailVerifyState === 'verifying',
      otpBtnCursor: this.state.emailVerifyState === 'verifying' ? 'default' : 'pointer',
      otpBtnOpacity: this.state.emailVerifyState === 'verifying' ? '0.65' : '1',
      otpBtnLabel: this.state.emailVerifyState === 'verifying' ? 'CONFIRMING…' : (this.state.emailVerifyState === 'verified' ? 'CONTINUE' : 'VERIFY & CONTINUE'),
      otpBtnArrow: this.state.emailVerifyState === 'verifying' ? '' : '✓',
      verifyEmailAddress: this.state.regEmail || 'your email address',
      // Shown so the screen can say what is being verified and why.
      verifyEmailWhy: 'LOUMOO verifies your email so buyers and sellers can trust who they are dealing with, and so we can reach you about your orders.',
      verifyEmailNext: 'Once verified you can finish setting up your account and start using LOUMOO.',
      verifyEmailNoCodeHelp: 'Check your spam folder, or resend the code. You can also change the address on your account and try again.',
      canChangeVerifyEmail: this.state.authStatus === 'authenticated',

      updateEmailVerifyCode: (e) => this.setState({
        emailVerifyCode: (e && e.target ? e.target.value : e || '').replace(/[^0-9]/g, '').slice(0, 6),
        emailVerifyError: ''
      }),

      /**
       * Submits the code the user actually received from Clerk, then asks the
       * SERVER to confirm the outcome. The screen only shows "verified" after
       * the server has re-read Clerk and mirrored the result — clicking a
       * button never marks anything verified.
       */
      submitEmailVerification: () => {
        const now = Date.now();
        if (this._lastOtpClick && (now - this._lastOtpClick) < 1000) {
          return;
        }
        this._lastOtpClick = now;

        const code = (this.state.emailVerifyCode || '').trim();
        if (code.length !== 6 && this.state.emailVerifyState !== 'verified') {
          this.setState({ emailVerifyError: 'Enter the 6-digit code from your email.' });
          return;
        }
        if (this.state.emailVerifyState === 'verifying') return;

        const clerk = getClerk();
        const api = getApi();

        if (!clerk || !clerk.isReady || !api) {
          this.setState({
            emailVerifyState: 'pending',
            emailVerifyError: this.state.authProviderError
              || 'Verification is unavailable right now. Please try again shortly.'
          });
          return;
        }

        this.setState({ emailVerifyState: 'verifying', emailVerifyError: '' });

        const attempt = clerk.isSignedIn()
          ? clerk.attemptEmailVerification(code)   // already signed in
          : clerk.verifyEmailCode(code);           // finishing a registration

        Promise.resolve(attempt)
          .catch(err => {
            const clerkErr = err && err.errors && err.errors[0];
            const errCode = clerkErr ? clerkErr.code : (err && err.code);
            const msg = (err && err.message) || '';
            if (errCode === 'verification_already_verified' || errCode === 'form_identifier_exists' || msg.toLowerCase().includes('already verified')) {
              return { alreadyVerified: true };
            }
            throw err;
          })
          .then(() => api.refreshVerification())
          .then(result => {
            if (this._unmounted) return;

            const verified = result && result.status && result.status.email.verified;
            if (!verified) {
              this.setState({
                emailVerifyState: 'pending',
                emailVerifyError: 'We could not confirm that verification. Request a new code and try again.'
              });
              return;
            }

            const guard = getGuard();
            if (guard) guard.invalidate();

            this.setState({ emailVerifyState: 'verified', emailVerifyError: '' });
            return this._syncAccountState(true);
          })
          .catch(err => {
            if (this._unmounted) return;

            const clerkErr = err && err.errors && err.errors[0];
            const codeName = clerkErr ? clerkErr.code : (err && err.code);
            const expired = codeName === 'verification_expired';
            const already = codeName === 'verification_already_verified';

            if (already) {
              this.setState({ emailVerifyState: 'verified', emailVerifyError: '' });
              this._syncAccountState(true);
              return;
            }

            this.setState({
              emailVerifyState: expired ? 'expired' : 'pending',
              emailVerifyError: expired ? '' : clerk.describeError(err)
            });
          });
      },

      /** Asks Clerk to send a genuinely new code. */
      resendEmailVerification: () => {
        if (this.state.emailVerifyCooldown > 0) return;

        const clerk = getClerk();
        if (!clerk || !clerk.isReady) {
          this.setState({ emailVerifyError: 'Verification is unavailable right now.' });
          return;
        }

        this.setState({ emailVerifyState: 'pending', emailVerifyCode: '', emailVerifyError: '' });
        this._startEmailCooldown();

        const send = clerk.isSignedIn()
          ? clerk.prepareEmailVerification()
          : clerk.resendEmailCode();

        Promise.resolve(send).then(() => {
          if (this._unmounted) return;
          this.toast('A new code is on its way to ' + (this.state.regEmail || 'your inbox'));
        }).catch(err => {
          if (this._unmounted) return;
          this.setState({ emailVerifyError: clerk.describeError(err) });
        });
      },

      /**
       * Re-checks with the server. Covers the case where the user completed
       * verification in another tab or on their phone.
       */
      recheckEmailVerification: () => {
        const api = getApi();
        if (!api) return;
        this.setState({ emailVerifyState: 'verifying', emailVerifyError: '' });
        api.refreshVerification().then(result => {
          if (this._unmounted) return;
          const verified = result && result.status && result.status.email.verified;
          this.setState({
            emailVerifyState: verified ? 'verified' : 'pending',
            emailVerifyError: verified ? '' : 'Not verified yet. Enter the code from your email.'
          });
          if (verified) this._syncAccountState(true);
        }).catch(() => {
          if (!this._unmounted) this.setState({ emailVerifyState: 'pending' });
        });
      },

      /**
       * Lets the user correct a mistyped address. Signing out returns them to
       * registration with a clean slate — the alternative (silently reusing a
       * wrong address) is what strands people permanently.
       */
      changeVerifyEmail: () => {
        const clerk = getClerk();
        this.setState({ emailVerifyCode: '', emailVerifyError: '', emailVerifyState: 'pending' });

        const done = () => {
          if (this._unmounted) return;
          this._applyAnonymous();
          this.toast('Enter the email address you would like to use.');
          this.go('onboardWelcome');
        };

        if (clerk && clerk.isReady) {
          clerk.signOut().then(done).catch(done);
        } else {
          done();
        }
      },

      finishEmailVerification: () => {
        this.setState({ emailVerifyCode: '' });
        this._syncAccountState(true).then(state => {
          if (this._unmounted) return;
          this._routeByAccountState(state);
        });
      },

      // ══════════════════════════════════════════════════════════════════
      // PHASE B — USER ACCOUNT HUB & PROFILE EXPERIENCE
      // ══════════════════════════════════════════════════════════════════

      // B1. Account Dashboard
      dashboard: this.state.dashboard || {
        profile: {
          // Real values only. This block previously hardcoded a name, an email
          // and isEmailVerified/isPhoneVerified: true, so an unverified account
          // was shown its own dashboard saying it was fully verified.
          name: ((this.state.regFirstName || '') + ' ' + (this.state.regLastName || '')).trim(),
          email: this.state.regEmail || '',
          isPhoneVerified: Boolean(this.state.phoneVerified),
          isEmailVerified: this.state.emailVerifyState === 'verified',
          completionPercentage: score,
          missingSetup: []
        },
        counts: {
          activeDeliveries: 1,
          savedItems: 34,
          followedStores: (this.state.followedStoresList ? this.state.followedStoresList.length : 2),
          addresses: (this.state.addressesList ? this.state.addressesList.length : 0)
        },
        escrowProtection: { enabled: true, badge: 'Escrow Protected Account' },
        defaultAddress: this.state.addressesList && this.state.addressesList.find(a => a.isDefault) || null,
        recentActivities: this.state.activityList || []
      },
      dashboardLoading: this.state.dashboardLoading,
      dashboardError: this.state.dashboardError,
      dashboardRoleLabel: this.state.userRole === 'both' ? 'BUYER & SELLER' : (this.state.userRole === 'seller' ? 'VERIFIED SELLER' : 'VERIFIED BUYER'),
      dashboardCompletionWidth: '85%',
      dashboardHasMissingSetup: false,
      dashboardDisputeLabel: 'Escrow protection is active on all your MoMo & OM orders',
      dashboardDefaultAddressLine: this.state.addressesList && this.state.addressesList[0] ? this.state.addressesList[0].streetAddress + ', ' + this.state.addressesList[0].city : 'No delivery address yet',
      dashboardHasActivity: (this.state.activityList && this.state.activityList.length > 0),

      openAccountDashboard: () => {
        this.go('accountDashboard');
        const api = getApi();
        if (api) {
          this.setState({ dashboardLoading: true });
          api.getDashboard().then(d => {
            if (!this._unmounted && d) this.setState({ dashboard: d, dashboardLoading: false });
          }).catch(e => {
            if (!this._unmounted) this.setState({ dashboardLoading: false, dashboardError: (e && e.message) || '' });
          });
        }
      },
      loadDashboard: () => {
        const api = getApi();
        if (!api) return;
        this.setState({ dashboardLoading: true, dashboardError: '' });
        api.getDashboard().then(d => {
          if (!this._unmounted && d) this.setState({ dashboard: d, dashboardLoading: false });
        }).catch(e => {
          if (!this._unmounted) this.setState({ dashboardLoading: false, dashboardError: (e && e.message) || 'Failed to load account.' });
        });
      },

      // B2. Edit Profile
      profileFormFirstName: this.state.profileFormFirstName,
      profileFormLastName: this.state.profileFormLastName,
      profileFormCity: this.state.profileFormCity,
      profileFormBusinessName: this.state.profileFormBusinessName,
      profileFormSellerType: this.state.profileFormSellerType,
      profileFormDirty: this.state.profileFormDirty,
      profileSaving: this.state.profileSaving,
      profileFormError: this.state.profileFormError,
      profileIsSeller: this.state.userRole !== 'buyer',

      openEditProfile: () => {
        this.setState({
          profileFormFirstName: this.state.regFirstName,
          profileFormLastName: this.state.regLastName,
          profileFormCity: this.state.regCity || 'douala',
          profileFormBusinessName: this.state.regBusinessName || '',
          profileFormSellerType: this.state.sellerType || 'pro',
          profileFormDirty: false,
          profileFormError: ''
        });
        this.go('editProfile');
      },
      pickAvatar: () => this.pickAvatar(),
      removeAvatar: () => this.removeAvatar(),
      updateProfileFirstName: (e) => this.setState({ profileFormFirstName: e && e.target ? e.target.value : e, profileFormDirty: true }),
      updateProfileLastName: (e) => this.setState({ profileFormLastName: e && e.target ? e.target.value : e, profileFormDirty: true }),
      updateProfileCity: (e) => this.setState({ profileFormCity: e && e.target ? e.target.value : e, profileFormDirty: true }),
      updateProfileBusinessName: (e) => this.setState({ profileFormBusinessName: e && e.target ? e.target.value : e, profileFormDirty: true }),
      updateProfileSellerType: (e) => this.setState({ profileFormSellerType: e && e.target ? e.target.value : e, profileFormDirty: true }),
      submitProfileUpdate: () => {
        const api = getApi();
        const updates = {
          firstName: this.state.profileFormFirstName,
          lastName: this.state.profileFormLastName,
          city: this.state.profileFormCity,
          businessName: this.state.profileFormBusinessName
        };
        this.setState({ profileSaving: true, profileFormError: '' });
        const done = () => {
          this.setState({
            profileSaving: false,
            profileFormDirty: false,
            regFirstName: updates.firstName,
            regLastName: updates.lastName,
            regCity: updates.city,
            regBusinessName: updates.businessName
          });
          this.toast('Profile updated successfully');
          this.go('accountDashboard');
        };
        if (!api) { done(); return; }
        api.updateMe(updates).then(done).catch(err => {
          if (!this._unmounted) this.setState({ profileSaving: false, profileFormError: (err && err.message) || 'Failed to update profile.' });
        });
      },

      // B3. Address Book
      addressesList: this.state.addressesList,
      addressesLoading: this.state.addressesLoading,
      addressFormName: this.state.addressFormName,
      addressFormPhone: this.state.addressFormPhone,
      addressFormCity: this.state.addressFormCity,
      addressFormStreet: this.state.addressFormStreet,
      addressFormIsDefault: this.state.addressFormIsDefault,
      addressFormSaving: this.state.addressFormSaving,
      addressFormError: this.state.addressFormError,
      checkoutReturn: Boolean(this.state.checkoutReturn),

      selectCheckoutAddress: (addr) => {
        if (!addr) return;
        this.setState({ selectedDeliveryAddress: addr, checkoutReturn: false });
        this.toast('Delivery destination updated');
        this.go('checkout');
      },
      cancelAddressSelect: () => {
        this.setState({ checkoutReturn: false });
        this.go('checkout');
      },

      openAddresses: () => {
        this.go('addresses');
        const api = getApi();
        if (api) {
          this.setState({ addressesLoading: true });
          api.getAddresses().then(list => {
            // `list.length` was required before, so an account with zero
            // addresses kept whatever was already on screen.
            if (!this._unmounted && Array.isArray(list)) this.setState({ addressesList: list, addressesLoading: false });
            else if (!this._unmounted) this.setState({ addressesLoading: false });
          }).catch(() => { if (!this._unmounted) this.setState({ addressesLoading: false }); });
        }
      },
      openAddAddress: () => {
        this.setState({
          editingAddressId: null,
          addressFormName: (this.state.regFirstName || '') + ' ' + (this.state.regLastName || ''),
          addressFormPhone: this.state.regPhone || '',
          addressFormCity: 'douala',
          addressFormStreet: '',
          addressFormIsDefault: (this.state.addressesList.length === 0),
          addressFormError: ''
        });
        this.go('addAddress');
      },
      editAddressItem: (addr) => {
        if (!addr) return;
        this.setState({
          editingAddressId: addr.id,
          addressFormName: addr.recipientName,
          addressFormPhone: addr.phoneNumber,
          addressFormCity: addr.city ? addr.city.toLowerCase() : 'douala',
          addressFormStreet: addr.streetAddress,
          addressFormIsDefault: addr.isDefault || false,
          addressFormError: ''
        });
        this.go('editAddress');
      },
      updateAddressFormName: (e) => this.setState({ addressFormName: e && e.target ? e.target.value : e, addressFormError: '' }),
      updateAddressFormPhone: (e) => this.setState({ addressFormPhone: e && e.target ? e.target.value : e, addressFormError: '' }),
      updateAddressFormCity: (e) => this.setState({ addressFormCity: e && e.target ? e.target.value : e, addressFormError: '' }),
      updateAddressFormStreet: (e) => this.setState({ addressFormStreet: e && e.target ? e.target.value : e, addressFormError: '' }),
      toggleAddressFormDefault: () => this.setState(s => ({ addressFormIsDefault: !s.addressFormIsDefault })),
      submitAddressForm: () => {
        if (!this.state.addressFormName || !this.state.addressFormPhone || !this.state.addressFormStreet) {
          this.setState({ addressFormError: 'Please fill in all address fields.' });
          return;
        }
        const api = getApi();
        const payload = {
          recipientName: this.state.addressFormName,
          phoneNumber: this.state.addressFormPhone,
          city: this.state.addressFormCity,
          streetAddress: this.state.addressFormStreet,
          isDefault: this.state.addressFormIsDefault
        };
        this.setState({ addressFormSaving: true, addressFormError: '' });
        const done = (item) => {
          const list = this.state.addressesList.slice();
          let savedItem = item;
          if (this.state.editingAddressId) {
            const idx = list.findIndex(a => a.id === this.state.editingAddressId);
            if (idx >= 0) {
              list[idx] = { ...list[idx], ...payload };
              savedItem = list[idx];
            }
          } else {
            savedItem = item || { id: 'addr_' + Date.now(), ...payload };
            list.unshift(savedItem);
          }
          if (payload.isDefault) {
            list.forEach(a => {
              if (a.id !== (item ? item.id : this.state.editingAddressId)) a.isDefault = false;
            });
          }
          if (this.state.checkoutReturn) {
            this.setState({
              addressesList: list,
              addressFormSaving: false,
              selectedDeliveryAddress: savedItem,
              checkoutReturn: false
            });
            this.toast('Delivery destination updated');
            this.go('checkout');
            return;
          }
          this.setState({ addressesList: list, addressFormSaving: false });
          this.toast('Address saved successfully');
          this.go('addresses');
        };
        if (!api) { done(); return; }
        const req = this.state.editingAddressId ? api.updateAddress(this.state.editingAddressId, payload) : api.addAddress(payload);
        req.then(res => { if (!this._unmounted) done(res); }).catch(e => {
          if (!this._unmounted) this.setState({ addressFormSaving: false, addressFormError: (e && e.message) || 'Failed to save address.' });
        });
      },
      confirmDeleteAddress: (id) => {
        const api = getApi();
        if (api) { api.deleteAddress(id).catch(() => {}); }
        this.setState(s => ({ addressesList: s.addressesList.filter(a => a.id !== id) }));
        this.toast('Address deleted');
      },
      makeDefaultAddress: (id) => {
        const api = getApi();
        if (api) { api.setDefaultAddress(id).catch(() => {}); }
        this.setState(s => ({ addressesList: s.addressesList.map(a => ({ ...a, isDefault: a.id === id })) }));
        this.toast('Default delivery address updated');
      },

      // B4. Notification Preferences
      notifInApp: this.state.notifInApp,
      notifEmail: this.state.notifEmail,
      notifPush: this.state.notifPush,
      notifOrders: this.state.notifOrders,
      notifFollowed: this.state.notifFollowed,
      notifPromos: this.state.notifPromos,
      notifSaving: this.state.notifSaving,
      toggleNotifInApp: () => this.setState(s => ({ notifInApp: !s.notifInApp })),
      toggleNotifEmail: () => this.setState(s => ({ notifEmail: !s.notifEmail })),
      toggleNotifPush: () => this.setState(s => ({ notifPush: !s.notifPush })),
      toggleNotifOrders: () => this.setState(s => ({ notifOrders: !s.notifOrders })),
      toggleNotifFollowed: () => this.setState(s => ({ notifFollowed: !s.notifFollowed })),
      toggleNotifPromos: () => this.setState(s => ({ notifPromos: !s.notifPromos })),
      openNotifPrefs: () => {
        this.go('notificationPreferences');
        const api = getApi();
        if (api) {
          api.getNotificationPreferences().then(p => {
            if (p && !this._unmounted) {
              this.setState({
                notifInApp: p.channels?.inApp ?? true,
                notifEmail: p.channels?.email ?? true,
                notifPush: p.channels?.push ?? true,
                notifOrders: p.categories?.orders ?? true,
                notifFollowed: p.categories?.followedStores ?? true,
                notifPromos: p.categories?.promotions ?? false
              });
            }
          }).catch(() => {});
        }
      },
      saveNotifPrefs: () => {
        const api = getApi();
        this.setState({ notifSaving: true });
        const done = () => {
          this.setState({ notifSaving: false });
          this.toast('Notification preferences saved');
          this.go('settings');
        };
        const fail = (msg) => {
          if (this._unmounted) return;
          this.setState({ notifSaving: false });
          this.toast(msg);
        };
        if (!api) { fail('LOUMOO is unreachable. Your preferences were not saved.'); return; }
        api.updateNotificationPreferences({
          channels: { inApp: this.state.notifInApp, email: this.state.notifEmail, push: this.state.notifPush },
          categories: { orders: this.state.notifOrders, followedStores: this.state.notifFollowed, promotions: this.state.notifPromos }
        }).then(done).catch(err => fail((err && err.message) || 'Could not save your notification preferences.'));
      },

      // B5. Privacy & Consent
      privacyPersonalization: this.state.privacyPersonalization,
      privacyAnalytics: this.state.privacyAnalytics,
      privacyMarketing: this.state.privacyMarketing,
      privacySaving: this.state.privacySaving,
      togglePrivacyPersonalization: () => this.setState(s => ({ privacyPersonalization: !s.privacyPersonalization })),
      togglePrivacyAnalytics: () => this.setState(s => ({ privacyAnalytics: !s.privacyAnalytics })),
      togglePrivacyMarketing: () => this.setState(s => ({ privacyMarketing: !s.privacyMarketing })),
      openPrivacy: () => {
        this.go('privacySettings');
        const api = getApi();
        if (api) {
          api.getPrivacy().then(p => {
            if (p && !this._unmounted) {
              this.setState({
                privacyPersonalization: p.personalization ?? true,
                privacyAnalytics: p.analytics ?? true,
                privacyMarketing: p.marketing ?? false
              });
            }
          }).catch(() => {});
        }
      },
      savePrivacySettings: () => {
        const api = getApi();
        this.setState({ privacySaving: true });
        const done = () => {
          this.setState({ privacySaving: false });
          this.toast('Privacy preferences updated');
          this.go('settings');
        };
        const fail = (msg) => {
          if (this._unmounted) return;
          this.setState({ privacySaving: false });
          this.toast(msg);
        };
        if (!api) { fail('LOUMOO is unreachable. Your privacy settings were not saved.'); return; }
        api.updatePrivacy({
          personalization: this.state.privacyPersonalization,
          analytics: this.state.privacyAnalytics,
          marketing: this.state.privacyMarketing
        }).then(done).catch(err => fail((err && err.message) || 'Could not save your privacy settings.'));
      },

      // B6. Security & Sessions
      activeSessionsList: this.state.activeSessionsList,
      sessionsLoading: this.state.sessionsLoading,
      openSecurity: () => {
        this.go('securitySettings');
        const api = getApi();
        if (api) {
          this.setState({ sessionsLoading: true });
          api.getSessions().then(s => {
            if (!this._unmounted && s && s.length) this.setState({ activeSessionsList: s, sessionsLoading: false });
            else if (!this._unmounted) this.setState({ sessionsLoading: false });
          }).catch(() => { if (!this._unmounted) this.setState({ sessionsLoading: false }); });
        }
      },
      revokeUserSession: (id) => {
        const api = getApi();
        if (api) { api.revokeSession(id).catch(() => {}); }
        this.setState(s => ({ activeSessionsList: s.activeSessionsList.filter(sess => sess.id !== id) }));
        this.toast('Session revoked successfully');
      },

      // B7. Followed Stores
      followedStoresList: this.state.followedStoresList,
      followedStoresLoading: this.state.followedStoresLoading,
      openFollowedStores: () => {
        this.go('followedStores');
        const api = getApi();
        if (api) {
          this.setState({ followedStoresLoading: true });
          api.getFollowedStores().then(res => {
            if (!this._unmounted && res && res.stores) this.setState({ followedStoresList: res.stores, followedStoresLoading: false });
            else if (!this._unmounted) this.setState({ followedStoresLoading: false });
          }).catch(() => { if (!this._unmounted) this.setState({ followedStoresLoading: false }); });
        }
      },
      unfollowStoreItem: (id) => {
        const api = getApi();
        if (api) { api.unfollowStore(id).catch(() => {}); }
        this.setState(s => ({ followedStoresList: s.followedStoresList.filter(st => (st.storeId || st.id) !== id) }));
        this.toast('Unfollowed store');
      },

      // B8. Activity History
      activityList: this.state.activityList,
      activityLoading: this.state.activityLoading,
      openActivity: () => {
        this.go('userActivity');
        const api = getApi();
        if (api) {
          this.setState({ activityLoading: true });
          api.getActivities().then(res => {
            if (!this._unmounted && res && res.activities) this.setState({ activityList: res.activities, activityLoading: false });
            else if (!this._unmounted) this.setState({ activityLoading: false });
          }).catch(() => { if (!this._unmounted) this.setState({ activityLoading: false }); });
        }
      },

      // B9. Delete Account
      deleteAccountConfirmText: this.state.deleteAccountConfirmText,
      deleteAccountReason: this.state.deleteAccountReason,
      deleteAccountBusy: this.state.deleteAccountBusy,
      deleteAccountError: this.state.deleteAccountError,
      updateDeleteAccountConfirmText: (e) => this.setState({ deleteAccountConfirmText: e && e.target ? e.target.value : e, deleteAccountError: '' }),
      updateDeleteAccountReason: (e) => this.setState({ deleteAccountReason: e && e.target ? e.target.value : e }),
      openDeleteAccount: () => {
        this.setState({ deleteAccountConfirmText: '', deleteAccountError: '' });
        this.go('deleteAccount');
      },
      submitDeleteAccount: () => {
        if (this.state.deleteAccountConfirmText !== 'DELETE MY ACCOUNT') return;
        const api = getApi();
        this.setState({ deleteAccountBusy: true });
        const done = () => {
          this.setState({ deleteAccountBusy: false });
          this.signOut();
          this.toast('Your account has been deleted.');
        };
        if (!api) { done(); return; }
        api.deleteAccount(this.state.deleteAccountConfirmText, this.state.deleteAccountReason).then(done).catch(err => {
          if (!this._unmounted) this.setState({ deleteAccountBusy: false, deleteAccountError: (err && err.message) || 'Account deletion failed.' });
        });
      },

      // ══════════════════════════════════════════════════════════════════
      // PHASE D — ORDERS, REVIEWS & VERTICALS
      // ══════════════════════════════════════════════════════════════════
      openPurchases: () => this.go('orders'),
      openOrderDetail: (order) => {
        if (order) this.setState({ currentOrder: order });
        this.go('orderDetail');
      },
      currentOrder: this.state.currentOrder,
      openRefundRequest: () => this.go('refundRequest'),
      refundReason: this.state.refundReason,
      refundDetails: this.state.refundDetails,
      refundPhotoAttached: this.state.refundPhotoAttached,
      refundBusy: this.state.refundBusy,
      updateRefundReason: (e) => this.setState({ refundReason: e && e.target ? e.target.value : e }),
      updateRefundDetails: (e) => this.setState({ refundDetails: e && e.target ? e.target.value : e }),
      simulateRefundPhotoUpload: () => {
        this.setState({ refundPhotoAttached: true });
        this.toast('2 Photos Attached to Claim');
      },
      submitRefundRequest: () => {
        this.setState({ refundBusy: true });
        setTimeout(() => {
          this.setState({ refundBusy: false });
          this.toast('Dispute claim submitted. Escrow payout held.');
          this.go('orderDetail');
        }, 800);
      },
      openWriteReview: () => {
        // Capture the product being reviewed from the current PDP context.
        const p = (this.state.currentProductId && typeof PRODUCTS_DATA !== 'undefined')
          ? PRODUCTS_DATA[this.state.currentProductId] : null;
        this.setState({
          reviewTargetId: this.state.currentProductId || '',
          reviewTargetName: (p && p.title) || this.state.reviewTargetName || 'this product',
          reviewStars: 5, reviewRatingLabel: '5.0 EXCELLENT', reviewTitle: '', reviewBody: ''
        });
        this.go('writeReview');
      },
      reviewStars: this.state.reviewStars,
      reviewRatingLabel: this.state.reviewRatingLabel,
      reviewTitle: this.state.reviewTitle,
      reviewBody: this.state.reviewBody,
      reviewTargetName: this.state.reviewTargetName || 'this product',
      setReviewStars: (n) => {
        const labels = { 1: '1.0 TERRIBLE', 2: '2.0 POOR', 3: '3.0 AVERAGE', 4: '4.0 GOOD', 5: '5.0 EXCELLENT' };
        this.setState({ reviewStars: n, reviewRatingLabel: labels[n] || '5.0 EXCELLENT' });
      },
      updateReviewTitle: (e) => this.setState({ reviewTitle: e && e.target ? e.target.value : e }),
      updateReviewBody: (e) => this.setState({ reviewBody: e && e.target ? e.target.value : e }),
      // Reviews for the product currently open, newest first (for the PDP).
      myReviewsForProduct: (this.state.reviews || [])
        .filter((r) => r.productId && r.productId === this.state.currentProductId)
        .map((r) => ({
          author: r.author || 'You',
          starsLabel: '★★★★★☆☆☆☆☆'.slice(5 - (Number(r.rating) || 5), 10 - (Number(r.rating) || 5)),
          title: r.title || '',
          content: r.content || '',
          dateLabel: this._orderDateLabel(r.createdAt)
        })),
      myReviewsCount: (this.state.reviews || []).filter((r) => r.productId === this.state.currentProductId).length,
      submitProductReview: () => {
        const rating = Number(this.state.reviewStars) || 0;
        const content = String(this.state.reviewBody || '').trim();
        const title = String(this.state.reviewTitle || '').trim();
        if (rating < 1 || rating > 5) { this.toast('Please pick a star rating'); return; }
        if (content.length < 5) { this.toast('Please write a few words about your experience'); return; }
        const productId = this.state.reviewTargetId || this.state.currentProductId || '';
        const productName = this.state.reviewTargetName || 'this product';
        const review = {
          id: 'rev_' + Date.now().toString(36),
          productId: productId,
          productName: productName,
          rating: rating,
          title: title,
          content: content,
          author: (this.state.userName || 'You'),
          createdAt: Date.now()
        };
        const list = [review].concat(this.state.reviews || []);
        this.setState({ reviews: list, reviewTitle: '', reviewBody: '', reviewStars: 5, reviewRatingLabel: '5.0 EXCELLENT' });
        this._persistReviews(list);
        // Best-effort: post to the real reviews API when signed in.
        try {
          if (this.state.authStatus === 'authenticated' && productId) {
            const api = getApi();
            if (api && api.createReview) {
              api.createReview({ targetType: 'product', targetId: productId, rating: rating, title: title, content: content }).catch(() => {});
            }
          }
        } catch (e) {}
        this._pushNotif({ tone: 'success', title: 'Review posted', body: 'Thanks for reviewing ' + productName + '.' });
        this.toast('Your review has been posted — thank you!');
        this.back();
      },
      openSellerOrderDetail: () => this.go('sellerOrderDetail'),
      markOrderDispatched: () => {
        this.toast('Order marked dispatched with Moov Express courier');
        this.go('seller');
      },
      printShippingLabel: () => {
        this.toast('Generating PDF Waybill for Douala Express...');
      },
      openSellerPayouts: () => this.go('sellerPayouts'),
      payoutMethod: this.state.payoutMethod,
      payoutPhone: this.state.payoutPhone,
      payoutAmount: this.state.payoutAmount,
      setPayoutMethod: (m) => this.setState({ payoutMethod: m }),
      updatePayoutPhone: (e) => this.setState({ payoutPhone: e && e.target ? e.target.value : e }),
      updatePayoutAmount: (e) => this.setState({ payoutAmount: e && e.target ? e.target.value : e }),
      submitPayoutRequest: () => {
        this.toast('Payout request for XAF ' + (this.state.payoutAmount || '500 000') + ' sent to ' + (this.state.payoutMethod === 'mtn' ? 'MTN MoMo' : 'Orange Money'));
        this.go('seller');
      },
      todayIso: new Date().toISOString().slice(0, 10),
      openHotelSearch: () => {
        this.go('hotelSearch');
        if (!this.state.hotelListLoaded && !this.state.hotelListLoading) this.loadHotels();
      },
      hotelCity: this.state.hotelCity,
      updateHotelCity: (e) => {
        const val = e && e.target ? e.target.value : e;
        this.setState({ hotelCity: val });
        this.loadHotels(val);
      },
      retryHotelList: () => this.loadHotels(),
      hotelListLoading: this.state.hotelListLoading,
      hotelListError: this.state.hotelListError,
      // An empty result is a real answer ("no hotels in that city"), not an
      // error, and it must not be shown while the request is still running.
      hotelListEmpty: this.state.hotelListLoaded
        && !this.state.hotelListLoading
        && !this.state.hotelListError
        && this.state.hotelList.length === 0,

      hotelPopularCards: hotelCards(
        this.state.hotelList.slice().sort((a, b) => (b.rating || 0) - (a.rating || 0))
      ),
      hotelAllCards: hotelCards(this.state.hotelList),

      openHotelDetail: (id) => {
        const hid = (typeof id === 'string' && id) ? id : this.state.hotelSelectedId;
        if (!hid) return;
        this.setState({
          hotelSelectedId: hid,
          hotelRoomIndex: 0,
          hotelSelectedRoomId: '',
          hotelDetailData: null,
          hotelRooms: [],
          hotelSubmitError: ''
        });
        this.go('hotelDetail');
        this.loadHotelDetail(hid);
      },
      hotelCheckIn: this.state.hotelCheckIn,
      hotelCheckOut: this.state.hotelCheckOut,
      // Changing the stay changes both the price and what is still available,
      // so every edit re-asks the server rather than re-doing the maths here.
      updateHotelCheckIn: (e) => {
        const val = e && e.target ? e.target.value : e;
        if (!val) return;
        if (val < isoDaysFromToday(0)) {
          this.toast('Check-in cannot be in the past');
          return;
        }
        const updates = { hotelCheckIn: val, hotelSubmitError: '' };
        if (this.state.hotelCheckOut && val >= this.state.hotelCheckOut) {
          try {
            const d = new Date(val + 'T00:00:00');
            d.setDate(d.getDate() + 1);
            updates.hotelCheckOut = d.toISOString().slice(0, 10);
          } catch (_) {}
        }
        this.setState(updates, () => this.loadHotelRooms());
      },
      updateHotelCheckOut: (e) => {
        const val = e && e.target ? e.target.value : e;
        if (!val) return;
        if (this.state.hotelCheckIn && val <= this.state.hotelCheckIn) {
          this.toast('Check-out date must be after check-in date');
          return;
        }
        this.setState({ hotelCheckOut: val, hotelSubmitError: '' }, () => this.loadHotelRooms());
      },
      hotelGuests: this.state.hotelGuests || 2,
      incHotelGuests: () => this.setState(
        (s) => ({ hotelGuests: Math.min(9, (s.hotelGuests || 2) + 1) }),
        () => this.loadHotelRooms()
      ),
      decHotelGuests: () => this.setState(
        (s) => ({ hotelGuests: Math.max(1, (s.hotelGuests || 2) - 1) }),
        () => this.loadHotelRooms()
      ),

      hotelDetailLoading: this.state.hotelDetailLoading || this.state.hotelRoomsLoading,
      hotelDetailError: this.state.hotelDetailError || this.state.hotelRoomsError,
      retryHotelDetail: () => this.loadHotelDetail(this.state.hotelSelectedId),
      selectHotelRoomId: (roomId) => this.setState({ hotelSelectedRoomId: roomId, hotelSubmitError: '' }),

      // Opens the property's immersive tour INSIDE LOUMOO (a fullscreen iframe
      // modal) so guests stay in the app. A persistent "open in new tab" action
      // is the fallback for tour hosts that block embedding. readTourUrl already
      // validated https+host; this guards again before mounting the frame.
      openHotelVirtualTour: (url) => {
        const u = typeof url === 'string' ? url.trim() : '';
        if (!/^https:\/\/[^\s]+\.[^\s]+/i.test(u)) return;
        this.setState({ tourModalUrl: u, tourModalOpen: true });
      },
      closeHotelVirtualTour: () => this.setState({ tourModalOpen: false, tourModalUrl: '' }),
      openHotelTourInNewTab: () => {
        const u = (this.state && this.state.tourModalUrl) || '';
        if (!/^https:\/\/[^\s]+\.[^\s]+/i.test(u)) return;
        try {
          if (typeof window !== 'undefined' && window.open) window.open(u, '_blank', 'noopener,noreferrer');
        } catch (e) {}
      },
      tourModalOpen: !!(this.state && this.state.tourModalOpen),
      tourModalUrl: (this.state && this.state.tourModalUrl) || '',
      // Client-only favourite mark for the hero heart (not persisted).
      toggleHotelFavorite: () => {
        const id = this.state.hotelSelectedId;
        if (!id) return;
        const next = Object.assign({}, this.state.hotelFavIds);
        if (next[id]) { delete next[id]; } else { next[id] = true; }
        this.setState({ hotelFavIds: next });
      },
      shareHotelDetail: () => {
        const h = this.state.hotelDetailData || {};
        const title = h.name ? (h.name + ' · LOUMOO Stays') : 'LOUMOO Stays';
        let url = '';
        try { if (typeof window !== 'undefined' && window.location) url = window.location.href; } catch (e) {}
        try {
          if (typeof navigator !== 'undefined' && navigator.share) {
            navigator.share({ title: title, text: title, url: url }).catch(() => {});
            return;
          }
          if (url && typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => this.toast('Link copied')).catch(() => this.toast(title));
            return;
          }
        } catch (e) {}
        this.toast(title);
      },

      hotelDetailCard: (() => {
        const h = this.state.hotelDetailData;
        // The template dereferences this object every render, including the
        // first one before the fetch resolves — so it is never null.
        if (!h) {
          return {
            id: '', name: '', area: '', star: '', ratingLabel: '',
            image: '', gallery: [], hasGallery: false, tagline: '',
            verified: false, favorited: false,
            virtualTourUrl: '', hasVirtualTour: false, spaces: [], hasSpaces: false,
            amenities: [], rooms: [], hasRooms: false,
            nightsLabel: '', checkInLabel: '', checkOutLabel: '',
            guests: this.state.hotelGuests || 2, guestsLabel: '', totalLabel: '', hasQuote: false
          };
        }
        const rooms = this.state.hotelRooms || [];
        const sel = rooms.find((r) => r.id === this.state.hotelSelectedRoomId) || rooms[0] || null;
        const nights = this._hotelNights(this.state.hotelCheckIn, this.state.hotelCheckOut);
        // `stayQuote` is the server's own arithmetic for this stay. The client
        // shows what the server will charge, and never recomputes it.
        const quote = sel && sel.stayQuote ? sel.stayQuote : null;
        // Real property imagery only (hero mosaic + "Explore the property").
        const imgs = (h.images || []).filter(Boolean).map(encImg);
        // Optional named spaces — read from the object if present, else empty;
        // nothing is fabricated (the backend does not expose these today).
        const spaces = (Array.isArray(h.spaces) ? h.spaces : []).map((sp) => {
          const url = readTourUrl(sp);
          return {
            name: sp.name || sp.title || '',
            category: sp.category || '',
            description: sp.description || sp.summary || '',
            image: encImg((sp.images && sp.images[0]) || sp.image || ''),
            features: (sp.amenities || sp.features || []).slice(0, 3).join(' · '),
            virtualTourUrl: url,
            hasVirtualTour: !!url
          };
        }).filter((s) => s.name);
        const hotelTour = readTourUrl(h);
        const guestsN = this.state.hotelGuests || 2;
        return {
          id: h.id,
          name: h.name || '',
          area: h.location || h.city || '',
          star: h.starLabel || '',
          ratingLabel: h.rating ? ('★ ' + h.rating) : '',
          verified: (h.status || 'ACTIVE') === 'ACTIVE',
          favorited: !!(this.state.hotelFavIds && this.state.hotelFavIds[h.id]),
          image: imgs[0] || '',
          gallery: imgs.slice(1),
          hasGallery: imgs.length > 1,
          tagline: h.description || '',
          virtualTourUrl: hotelTour,
          hasVirtualTour: !!hotelTour,
          spaces: spaces,
          hasSpaces: spaces.length > 0,
          amenities: h.amenities || [],
          rooms: rooms.map((r) => {
            const size = roomSizeLabel(r);
            const meta = [size, r.capacity ? (r.capacity + ' guest' + (r.capacity === 1 ? '' : 's')) : '', roomBedLabel(r)].filter(Boolean).join(' · ');
            const url = readTourUrl(r);
            return {
              id: r.id,
              name: r.name,
              image: encImg((r.images && r.images[0]) || (h.images && h.images[0]) || ''),
              metaLabel: meta,
              amenityChips: (r.amenities || []).slice(0, 4),
              priceLabel: 'XAF ' + fmt(r.price),
              soldOut: !(r.availableInventory > 0),
              availabilityLabel: r.availableInventory > 0
                ? (r.availableInventory <= 3 ? ('Only ' + r.availableInventory + ' left') : 'Available')
                : 'Sold out',
              cancellationLabel: r.cancellationPolicy === 'NON_REFUNDABLE'
                ? 'Non-refundable'
                : (r.cancellationPolicy === 'MODERATE_48H' ? 'Free cancellation up to 48h' : 'Free cancellation up to 24h'),
              virtualTourUrl: url,
              hasVirtualTour: !!url,
              selected: sel ? r.id === sel.id : false
            };
          }),
          hasRooms: rooms.length > 0,
          nightsLabel: nights + (nights === 1 ? ' night' : ' nights'),
          checkInLabel: this._hotelDateLabel(this.state.hotelCheckIn),
          checkOutLabel: this._hotelDateLabel(this.state.hotelCheckOut),
          guests: guestsN,
          guestsLabel: guestsN + ' guest' + (guestsN === 1 ? '' : 's'),
          totalLabel: quote ? ('XAF ' + fmt(quote.totalAmount)) : '',
          hasQuote: !!quote
        };
      })(),

      openHotelBooking: () => {
        const updates = {};
        if (!this.state.hotelGuestName) {
          updates.hotelGuestName = (this.state.regFirstName ? (this.state.regFirstName + ' ' + (this.state.regLastName || '')).trim() : '') || this.state.travelPaxName || 'Rostand Tchuekam';
        }
        if (!this.state.hotelGuestPhone) {
          const p = this.state.regPhone || this.state.travelPaxPhone || '690 12 34 56';
          updates.hotelGuestPhone = p.startsWith('+') ? p : ('+237 ' + p);
        }
        if (Object.keys(updates).length > 0) this.setState(updates);
        this.go('hotelBooking');
      },
      hotelGuestName: this.state.hotelGuestName !== undefined ? this.state.hotelGuestName : (this.state.regFirstName ? (this.state.regFirstName + ' ' + (this.state.regLastName || '')).trim() : 'Rostand Tchuekam'),
      hotelGuestPhone: this.state.hotelGuestPhone !== undefined ? this.state.hotelGuestPhone : (this.state.regPhone ? (this.state.regPhone.startsWith('+') ? this.state.regPhone : ('+237 ' + this.state.regPhone)) : '+237 690 12 34 56'),
      updateHotelGuestName: (e) => this.setState({ hotelGuestName: e && e.target ? e.target.value : e }),
      updateHotelGuestPhone: (e) => this.setState({ hotelGuestPhone: e && e.target ? e.target.value : e }),

      hotelSubmitting: this.state.hotelSubmitting,
      hotelSubmitError: this.state.hotelSubmitError,

      hotelBookingSummary: (() => {
        const h = this.state.hotelDetailData;
        const rooms = this.state.hotelRooms || [];
        const room = rooms.find((r) => r.id === this.state.hotelSelectedRoomId) || rooms[0] || null;
        if (!h || !room) {
          return {
            hotelName: '', area: '', image: '', roomName: '', roomFeatures: '',
            nights: 0, nightsLabel: '', guests: this.state.hotelGuests || 2,
            checkInLabel: '', checkOutLabel: '', perNightLabel: '', subtotalLabel: '',
            escrowLabel: '', totalLabel: '', cancellationLabel: '', payLabel: 'Reserve'
          };
        }
        const nights = this._hotelNights(this.state.hotelCheckIn, this.state.hotelCheckOut);
        // Every figure below is the server's. The old screen added a flat
        // 3 000 XAF "escrow" the server knew nothing about, so the total the
        // traveller approved was never the total the server would charge.
        const q = room.stayQuote || null;
        return {
          hotelName: h.name,
          area: h.location || h.city || '',
          image: encImg((h.images && h.images[0]) || ''),
          roomName: room.name,
          roomFeatures: (room.amenities || []).slice(0, 3).join(' · ') || room.description || '',
          nights: nights,
          nightsLabel: nights + (nights === 1 ? ' night' : ' nights'),
          guests: this.state.hotelGuests || 2,
          checkInLabel: this._hotelDateLabel(this.state.hotelCheckIn),
          checkOutLabel: this._hotelDateLabel(this.state.hotelCheckOut),
          perNightLabel: 'XAF ' + fmt(room.price),
          subtotalLabel: q ? ('XAF ' + fmt(q.subtotal)) : '',
          escrowLabel: q ? ('XAF ' + fmt(q.serviceFee)) : '',
          totalLabel: q ? ('XAF ' + fmt(q.totalAmount)) : '',
          cancellationLabel: room.cancellationPolicy === 'NON_REFUNDABLE'
            ? 'Non-refundable'
            : (room.cancellationPolicy === 'MODERATE_48H' ? 'Free cancellation up to 48h before check-in' : 'Free cancellation up to 24h before check-in'),
          payLabel: this.state.hotelSubmitting
            ? 'Reserving…'
            : (q ? ('Reserve for XAF ' + fmt(q.totalAmount)) : 'Reserve')
        };
      })(),

      /**
       * Creates the reservation on the server and only then shows a voucher.
       *
       * The previous version wrote a CONFIRMED trip with a client-invented
       * reference, toasted "Reservation confirmed" and navigated to the
       * voucher BEFORE calling the API — then swallowed every error with an
       * empty catch. A traveller whose booking the server refused (no
       * availability, dates in the past, room too small) still saw a confirmed
       * voucher for a reservation that did not exist, and would arrive at the
       * hotel with nothing behind it. Nothing is shown now until the server
       * has actually created the booking, and failures are surfaced.
       */
      submitHotelReservation: () => {
        if (this.state.hotelSubmitting) return;

        const h = this.state.hotelDetailData;
        const rooms = this.state.hotelRooms || [];
        const room = rooms.find((r) => r.id === this.state.hotelSelectedRoomId) || rooms[0] || null;
        if (!h || !room) {
          this.setState({ hotelSubmitError: 'Select a room before reserving.' });
          return;
        }

        const guestName = (this.state.hotelGuestName || '').trim();
        const guestPhone = (this.state.hotelGuestPhone || '').trim();
        if (!guestName) {
          this.setState({ hotelSubmitError: 'Enter the name of the lead guest.' });
          return;
        }
        if (!guestPhone) {
          this.setState({ hotelSubmitError: 'Enter a phone number so the hotel can reach you.' });
          return;
        }

        const api = getApi();
        if (!api || !api.createTravelBooking) {
          this.setState({ hotelSubmitError: 'Booking is temporarily unavailable. Please try again shortly.' });
          return;
        }

        const nights = this._hotelNights(this.state.hotelCheckIn, this.state.hotelCheckOut);
        this.setState({ hotelSubmitting: true, hotelSubmitError: '' });

        api.createTravelBooking({
          type: 'hotel',
          hotelId: h.id,
          roomId: room.id,
          checkIn: this.state.hotelCheckIn,
          checkOut: this.state.hotelCheckOut,
          roomsCount: 1,
          guests: this.state.hotelGuests || 2,
          passengers: [{ name: guestName, phone: guestPhone }]
        }).then((res) => {
          if (this._unmounted) return;
          const booking = (res && res.booking) || (res && res.data && res.data.booking) || (res && res.data) || res;
          if (!booking || !booking.id) {
            this.setState({ hotelSubmitting: false, hotelSubmitError: 'The reservation could not be created. Please try again.' });
            return;
          }

          const q = room.stayQuote || null;
          const trip = {
            reference: booking.bookingReference || booking.reference || '',
            bookingId: booking.id,
            type: 'hotel',
            passenger: guestName,
            phone: guestPhone,
            hotelId: h.id,
            hotelName: h.name,
            area: h.location || h.city || '',
            image: (h.images && h.images[0]) || '',
            roomType: room.name,
            roomFeatures: (room.amenities || []).slice(0, 3).join(' · '),
            checkIn: this.state.hotelCheckIn,
            checkOut: this.state.hotelCheckOut,
            nights: nights,
            guests: this.state.hotelGuests || 2,
            amount: (booking.pricing && booking.pricing.totalAmount) || (q && q.totalAmount) || 0,
            currency: 'XAF',
            // The server decides the status. A reservation is held PENDING
            // until payment is attested; it is not a confirmed stay yet.
            status: booking.status || 'PENDING',
            paymentStatus: (booking.payment && booking.payment.status) || 'PENDING',
            qr: booking.qrCodePayload || '',
            // Hotel WhatsApp contact — persisted so the voucher can notify the hotel directly.
            hotelWhatsApp: (booking.itinerary && (booking.itinerary.hotelWhatsapp || booking.itinerary.hotelPhone)) || h.whatsapp || h.phone || (h.contact && (h.contact.whatsapp || h.contact.phone)) || '',
            createdAt: Date.now()
          };

          const trips = [trip].concat(this.state.trips || []);
          this.setState({ trips, lastTrip: trip, hotelSubmitting: false });
          this._persistTrips(trips);

          try {
            if (typeof this._pushNotif === 'function') {
              this._pushNotif({
                tone: 'success',
                title: 'Reservation held',
                body: h.name + ' · ' + room.name + ' · ' + nights + (nights === 1 ? ' night' : ' nights')
              });
            }
          } catch (e) {}
          this.toast('Reservation held at ' + h.name);
          this.go('hotelVoucher');
          // Availability moved; refresh so the next traveller sees the truth.
          this.loadHotelRooms(h.id);
        }).catch((err) => {
          if (this._unmounted) return;
          this.setState({
            hotelSubmitting: false,
            hotelSubmitError: (err && err.message) || 'The reservation could not be created. Please try again.'
          });
        });
      },
      hotelVoucher: (() => {
        const t = this.state.lastTrip || {};
        const isPaid = t.paymentStatus === 'PAID';
        const isConfirmed = t.status === 'CONFIRMED';
        return {
          ref: t.reference || '',
          hotelName: t.hotelName || 'Your hotel',
          area: t.area || '',
          image: encImg(t.image || ''),
          roomType: t.roomType || 'Room',
          roomFeatures: t.roomFeatures || '',
          checkInLabel: this._hotelDateLabel(t.checkIn),
          checkOutLabel: this._hotelDateLabel(t.checkOut),
          nights: t.nights || 1,
          nightsLabel: (t.nights || 1) + ((t.nights || 1) === 1 ? ' night' : ' nights'),
          guests: t.guests || 1,
          guestName: t.passenger || 'Guest',
          totalLabel: 'XAF ' + fmt(t.amount || 0),
          isHotel: t.type === 'hotel',
          // The voucher states what the reservation actually is. Presenting a
          // held, unpaid booking as "confirmed" sends travellers to a hotel
          // that has taken no money and owes them no room.
          statusLabel: isConfirmed && isPaid ? 'Confirmed' : 'Held — payment required',
          isConfirmed: isConfirmed && isPaid,
          statusNote: isConfirmed && isPaid
            ? 'Show this voucher at reception on arrival.'
            : 'Your room is held. The reservation is confirmed once payment is completed.'
        };
      })(),
      /**
       * Sends a structured booking notice DIRECTLY to the hotel's WhatsApp
       * front-desk line. The message includes: guest name, room type, check-in,
       * check-out, number of guests, and booking reference — everything the
       * front desk needs to prepare the room before arrival.
       *
       * Falls back to the generic share sheet if no hotel number is on file.
       */
      notifyHotelWhatsApp: () => {
        const t = this.state.lastTrip || {};
        const cleanWa = (t.hotelWhatsApp || '').replace(/[^0-9]/g, '').replace(/^00/, '');
        const ref = t.reference || 'N/A';
        const guestName = t.passenger || 'Guest';
        const roomType = t.roomType || 'Room';
        const nights = t.nights || 1;
        const guests = t.guests || 1;
        const checkIn = t.checkIn || '';
        const checkOut = t.checkOut || '';
        const amount = t.amount ? ('XAF ' + Number(t.amount).toLocaleString('fr-FR')) : '';
        const hotelName = t.hotelName || 'your hotel';
        try {
          const msg = [
            '🏨 *Nouvelle réservation LOUMOO*',
            '',
            `Référence: *${ref}*`,
            `Hôtel: ${hotelName}`,
            `Chambre: ${roomType}`,
            `Nom du client: ${guestName}`,
            `Arrivée: ${checkIn}`,
            `Départ: ${checkOut}`,
            `${nights} nuit${nights > 1 ? 's' : ''} · ${guests} voyageur${guests > 1 ? 's' : ''}`,
            amount ? `Montant total: ${amount}` : '',
            '',
            "Merci de confirmer la disponibilité de la chambre et de préparer l'accueil."
          ].filter(Boolean).join('\n');
          const url = cleanWa
            ? ('https://wa.me/' + cleanWa + '?text=' + encodeURIComponent(msg))
            : ('https://api.whatsapp.com/send?text=' + encodeURIComponent(msg));
          window.open(url, '_blank');
        } catch (e) {
          this.toast("Impossible d'ouvrir WhatsApp");
        }
      },

      downloadHotelVoucher: () => this.toast('Voucher saved to My Trips'),
      shareHotelVoucher: () => {
        const t = this.state.lastTrip || {};
        const cleanWa = (t.hotelWhatsApp || '').replace(/[^0-9]/g, '').replace(/^00/, '');
        const ref = t.reference || 'N/A';
        const guestName = t.passenger || 'Guest';
        const hotelName = t.hotelName || 'hotel';
        const roomType = t.roomType || 'Room';
        const checkIn = t.checkIn || '';
        const checkOut = t.checkOut || '';
        const nights = t.nights || 1;
        const amount = t.amount ? ('XAF ' + Number(t.amount).toLocaleString('fr-FR')) : '';
        try {
          const msg = [
            '🏨 *Réservation LOUMOO*',
            `Hôtel: ${hotelName} — ${roomType}`,
            `Client: ${guestName}`,
            `Arrivée: ${checkIn} | Départ: ${checkOut} | ${nights} nuit${nights > 1 ? 's' : ''}`,
            amount ? `Total: ${amount}` : '',
            `Référence: ${ref}`
          ].filter(Boolean).join('\n');
          // Send directly to the hotel if we have a number, otherwise fallback
          // to the user's WhatsApp contact picker.
          const url = cleanWa
            ? ('https://wa.me/' + cleanWa + '?text=' + encodeURIComponent(msg))
            : ('https://api.whatsapp.com/send?text=' + encodeURIComponent(msg));
          window.open(url, '_blank');
        } catch (e) { this.toast("Impossible d'ouvrir WhatsApp"); }
      },

      // ══════════════════════════════════════════════════════════════════
      // PHASE E — STORE & BUSINESS SYSTEM (Prompt 05)
      // ══════════════════════════════════════════════════════════════════
      openCreateStore: () => this.go('createStore'),
      openStoreOnboarding: () => this.go('storeOnboarding'),
      openStoreSettings: () => {
        const store = this.state.store || this.state.currentStore || {};
        const profile = store.profile || {};
        const populate = (source) => {
          const sourceProfile = source.profile || {};
          const sourceLocation = source.location || {};
          const schedule = (source.hours && source.hours.schedule) || {};
          const weekday = schedule.monday || schedule.open || {};
          this.setState({
            storeName: source.name || '',
            storeDescription: source.description || '',
            storeBio: sourceProfile.bio || '',
            storeTagline: sourceProfile.tagline || source.tagline || '',
            storeReturnPolicy: sourceProfile.returnPolicy || '',
            storeWarrantyPolicy: sourceProfile.warrantyPolicy || '',
            storeShippingPolicy: sourceProfile.shippingPolicy || '',
            storePhone: source.phoneNumber || source.phone_number || '',
            storeLogoUrl: source.logoUrl || source.logo_url || this.state.storeLogoUrl || '',
            storeOpenTime: weekday.open || this.state.storeOpenTime,
            storeCloseTime: weekday.close || this.state.storeCloseTime,
            storeLocationStreet: sourceLocation.streetAddress || sourceLocation.street_address || '',
            storeLocationLandmark: sourceLocation.landmark || ''
          });
        };
        populate(store);
        this.go('storeSettings');
        const api = getApi();
        const storeId = this.state.primaryStoreId || store.id;
        if (api && storeId && typeof api.getPublicStorefront === 'function') {
          api.getPublicStorefront(storeId).then(res => {
            if (this._unmounted) return;
            const source = (res && (res.seller || res.data)) || res;
            if (source && typeof source === 'object') populate(source);
          }).catch(() => {});
        }
      },
      openStoreVerification: () => this.go('storeVerification'),
      refreshStoreAnalytics: () => {
        const period = this.state.analyticsPeriod || '30d';
        const api = getApi();
        const storeId = this.state.primaryStoreId;
        if (api && storeId && typeof api.getStoreAnalytics === 'function') {
          api.getStoreAnalytics(storeId, period).then(r => {
            if (this._unmounted || !r) return;
            const data = (r && r.data) || r;
            const summary = data.summary || {};
            const top = Array.isArray(data.topSellingProducts) ? data.topSellingProducts.map(item => ({
              id: item.id,
              title: item.title,
              salesCount: item.salesCount || 0,
              revenueFormatted: (Number(item.revenueXaf) || 0).toLocaleString('fr-FR') + ' XAF'
            })) : [];
            this.setState({
              analyticsRevenueFormatted: summary.totalRevenueFormatted || ((Number(summary.totalRevenueXaf) || 0).toLocaleString('fr-FR') + ' XAF'),
              analyticsOrdersCount: summary.totalOrders || 0,
              analyticsViewsCount: String(summary.totalStoreViews || 0),
              analyticsTopProducts: top
            });
            this.toast('Storefront analytics refreshed');
          }).catch(() => {});
        }
      },
      openStoreAnalytics: () => {
        this.go('storeAnalytics');
        const period = this.state.analyticsPeriod || '30d';
        const api = getApi();
        const storeId = this.state.primaryStoreId;
        if (api && storeId && typeof api.getStoreAnalytics === 'function') {
          api.getStoreAnalytics(storeId, period).then(r => {
            if (this._unmounted || !r) return;
            const data = (r && r.data) || r;
            const summary = data.summary || {};
            const top = Array.isArray(data.topSellingProducts) ? data.topSellingProducts.map(item => ({
              id: item.id,
              title: item.title,
              salesCount: item.salesCount || 0,
              revenueFormatted: (Number(item.revenueXaf) || 0).toLocaleString('fr-FR') + ' XAF'
            })) : [];
            this.setState({
              analyticsRevenueFormatted: summary.totalRevenueFormatted || ((Number(summary.totalRevenueXaf) || 0).toLocaleString('fr-FR') + ' XAF'),
              analyticsOrdersCount: summary.totalOrders || 0,
              analyticsViewsCount: String(summary.totalStoreViews || 0),
              analyticsTopProducts: top
            });
          }).catch(() => {});
        }
      },
      analyticsTopProducts: this.state.analyticsTopProducts || [],
      analyticsHasTopProducts: (this.state.analyticsTopProducts || []).length > 0,
      analyticsPeriodLabel: this.state.analyticsPeriod === 'today' ? 'Today' : this.state.analyticsPeriod === '7d' ? 'Last 7 Days' : this.state.analyticsPeriod === '90d' ? 'Last 90 Days' : 'Last 30 Days',
      createStoreName: this.state.createStoreName,
      createStoreLogoUrl: this.state.createStoreLogoUrl || '',
      createStoreCategory: this.state.createStoreCategory,
      createStoreDesc: this.state.createStoreDesc,
      createStoreCity: this.state.createStoreCity,
      createStorePhone: this.state.createStorePhone,
      createStoreBusy: this.state.createStoreBusy,
      createStoreError: this.state.createStoreError,
      handleCreateStoreLogoUpload: (e) => {
        const file = (e && e.target && e.target.files && e.target.files[0]) || (e && e.file);
        if (!file) {
          if (e && typeof e === 'string' && (e.startsWith('data:') || e.startsWith('http'))) {
            this.setState({ createStoreLogoUrl: e });
            this.toast('Store photo selected');
          }
          return;
        }
        this.processStoreLogoFile(file, (dataUrl) => {
          this.setState({ createStoreLogoUrl: dataUrl });
          this.toast('Store logo selected');
        }, (err) => {
          this.setState({ createStoreError: err });
          this.toast(err);
        });
      },
      removeCreateStoreLogo: () => {
        this.setState({ createStoreLogoUrl: '' });
        this.toast('Store logo removed');
      },
      selectCreateStorePresetLogo: (presetKey) => {
        const presets = {
          tech_blue: { from: '#1e3a8a', to: '#3b82f6' },
          emerald: { from: '#064e3b', to: '#10b981' },
          luxury_gold: { from: '#78350f', to: '#f59e0b' },
          royal_purple: { from: '#4c1d95', to: '#8b5cf6' },
          crimson: { from: '#881337', to: '#f43f5e' },
          dark_carbon: { from: '#09090b', to: '#27272a' }
        };
        const p = presets[presetKey] || presets.tech_blue;
        const avatar = this.generateStorePresetAvatar(p, this.state.createStoreName);
        this.setState({ createStoreLogoUrl: avatar });
        this.toast('Preset brand avatar selected');
      },
      updateCreateStoreName: (e) => this.setState({ createStoreName: e && e.target ? e.target.value : e }),
      updateCreateStoreCategory: (e) => this.setState({ createStoreCategory: e && e.target ? e.target.value : e }),
      updateCreateStoreDesc: (e) => this.setState({ createStoreDesc: e && e.target ? e.target.value : e }),
      updateCreateStoreCity: (e) => this.setState({ createStoreCity: e && e.target ? e.target.value : e }),
      updateCreateStorePhone: (e) => this.setState({ createStorePhone: e && e.target ? e.target.value : e }),
      submitCreateStore: () => {
        if (!this.state.createStoreName.trim()) {
          this.setState({ createStoreError: 'Store name is required' });
          return;
        }
        this.setState({ createStoreBusy: true, createStoreError: '' });
        const api = getApi();
        const done = () => {
          // Refresh the account so `primaryStoreId` is populated immediately.
          // Without it the client still believed the user had no boutique and
          // sent them back to create a second one.
          this._syncAccountState(true);
          this.setState({ createStoreBusy: false });
          this.toast('Storefront created! Finish setup to go live.');
          this.go('storeOnboarding');
        };
        api.createStore({
          name: this.state.createStoreName,
          categoryId: this.state.createStoreCategory,
          description: this.state.createStoreDesc,
          city: this.state.createStoreCity,
          phoneNumber: this.state.createStorePhone,
          logoUrl: this.state.createStoreLogoUrl || null
        }).then(res => {
          const store = (res && res.data) || res;
          const storeId = (store && store.id) || null;
          if (storeId) {
            this.setState({ primaryStoreId: storeId, store: store, storeLogoUrl: this.state.createStoreLogoUrl });
          }
          this._syncAccountState(true);
          this.setState({ createStoreBusy: false });
          this.toast('Storefront created! Finish setup to go live.');
          this.go('storeOnboarding');
        }).catch(err => {
          if (!this._unmounted) {
            const conflictStoreId = (err && err.details && err.details.storeId) || null;
            const conflictStore = (err && err.details && err.details.store) || null;
            if (conflictStoreId || (err && (err.code === 'CONFLICT' || /already have a LOUMOO boutique/i.test(err.message || '')))) {
              if (conflictStoreId) {
                this.setState({ primaryStoreId: conflictStoreId, store: conflictStore || this.state.store });
              }
              this._syncAccountState(true);
              this.setState({ createStoreBusy: false });
              this.toast('You already have an active boutique! Opening your studio...');
              this.go('seller');
              return;
            }
            this.setState({ createStoreBusy: false, createStoreError: (err && err.message) || 'Store creation failed' });
          }
        });
      },
      storeOnboardingPercentage: this.state.storeOnboardingPercentage,
      storeActivating: Boolean(this.state.storeActivating),
      storeActivateError: this.state.storeActivateError || '',
      activateStorefront: () => {
        /*
         * This used to set a local percentage to 100, toast "LIVE" and walk
         * away without calling anything. The store stayed DRAFT, the account
         * stayed SELLER_VERIFICATION_REQUIRED, and pressing Sell bounced the
         * user back to the seller-type question - for ever.
         *
         * Activation is the ONE transition that makes an account SELLER_READY,
         * so it has to be a real request whose outcome is reported honestly.
         * It never requires a verification document.
         */
        const api = getApi();
        const storeId = this.state.primaryStoreId;
        if (this.state.storeActivating) return;

        const fail = (msg) => {
          if (this._unmounted) return;
          this.setState({ storeActivating: false, storeActivateError: msg });
          this.toast(msg);
        };

        if (!storeId) { this.go('createStore'); return; }
        if (!api) { fail('LOUMOO is unreachable. Your storefront was not activated.'); return; }

        this.setState({ storeActivating: true, storeActivateError: '' });
        api.updateStoreOnboarding(storeId, 'ACTIVE')
          .then(() => this._syncAccountState(true))
          .then(() => {
            if (this._unmounted) return;
            this.setState({ storeActivating: false, storeOnboardingPercentage: 100 });
            this.toast('Your storefront is now LIVE on LOUMOO!');
            this.go('seller');
          })
          .catch(err => {
            // Name what is actually missing instead of bouncing the user to a
            // screen that asks something they already answered.
            const msg = (err && err.message) || 'Could not activate your storefront.';
            fail(msg);
          });
      },
      storeVerificationStatusLabel: this.state.storeVerificationStatusLabel,
      verLegalName: this.state.verLegalName,
      verBusinessType: this.state.verBusinessType,
      verRccm: this.state.verRccm,
      verNiu: this.state.verNiu,
      verDocAttached: this.state.verDocAttached,
      updateVerLegalName: (e) => this.setState({ verLegalName: e && e.target ? e.target.value : e }),
      updateVerBusinessType: (e) => this.setState({ verBusinessType: e && e.target ? e.target.value : e }),
      updateVerRccm: (e) => this.setState({ verRccm: e && e.target ? e.target.value : e }),
      updateVerNiu: (e) => this.setState({ verNiu: e && e.target ? e.target.value : e }),
      verSubmitting: Boolean(this.state.verSubmitting),
      verSubmitError: this.state.verSubmitError || '',
      submitStoreVerificationDocs: () => {
        const api = getApi();
        const storeId = this.state.primaryStoreId;
        if (this.state.verSubmitting) return;

        // Previously `.then(done).catch(done)`: a rejected request reported
        // "submitted for official review!" and navigated away. A seller could
        // wait indefinitely for a review of a document the server never got.
        const fail = (msg) => {
          if (this._unmounted) return;
          this.setState({ verSubmitting: false, verSubmitError: msg });
          this.toast(msg);
        };

        if (!storeId) {
          fail('Create your boutique before submitting verification documents.');
          return;
        }
        // No document is required. Verification is an optional trust upgrade,
        // never a gate on selling, so a seller may submit their legal details
        // now and attach a document later.
        if (!api) {
          fail('LOUMOO is unreachable. Check your connection and try again.');
          return;
        }

        this.setState({ verSubmitting: true, verSubmitError: '' });
        api.submitStoreVerification(storeId, {
          legalBusinessName: this.state.verLegalName || this.state.regBusinessName || '',
          businessType: this.state.verBusinessType || 'individual',
          rccmNumber: this.state.verRccm || null,
          taxIdNiu: this.state.verNiu || null,
          representativeIdType: 'cni',
          cniFrontUrl: this.state.verDocUploadUrl || this.state.docUploadUrl || null
        }).then(() => {
          if (this._unmounted) return;
          this.setState({ verSubmitting: false, storeVerificationStatusLabel: 'SUBMITTED' });
          this.toast('Verification documents submitted for official review');
          this.go('storeOnboarding');
        }).catch(err => {
          fail((err && err.message) || 'Could not submit your documents. Please try again.');
        });
      },
      analyticsPeriod: this.state.analyticsPeriod,
      analyticsRevenueFormatted: this.state.analyticsRevenueFormatted,
      analyticsOrdersCount: this.state.analyticsOrdersCount,
      analyticsViewsCount: this.state.analyticsViewsCount,
      analyticsUniqueVisitors: this.state.analyticsUniqueVisitors,
      analyticsConversionRate: this.state.analyticsConversionRate,
      setAnalyticsPeriodToday: () => {
        this.setState({ analyticsPeriod: 'today' });
        const api = getApi();
        if (api && this.state.primaryStoreId) {
          api.getStoreAnalytics(this.state.primaryStoreId, 'today').then(r => {
            const d = (r && r.data) || r;
            const s = d.summary || {};
            const top = Array.isArray(d.topSellingProducts) ? d.topSellingProducts.map(item => ({ id: item.id, title: item.title, salesCount: item.salesCount || 0, revenueFormatted: (Number(item.revenueXaf) || 0).toLocaleString('fr-FR') + ' XAF' })) : [];
            this.setState({ analyticsRevenueFormatted: s.totalRevenueFormatted || ((Number(s.totalRevenueXaf) || 0).toLocaleString('fr-FR') + ' XAF'), analyticsOrdersCount: s.totalOrders || 0, analyticsViewsCount: String(s.totalStoreViews || 0), analyticsTopProducts: top });
          }).catch(() => {});
        }
      },
      setAnalyticsPeriod7d: () => {
        this.setState({ analyticsPeriod: '7d' });
        const api = getApi();
        if (api && this.state.primaryStoreId) {
          api.getStoreAnalytics(this.state.primaryStoreId, '7d').then(r => {
            const d = (r && r.data) || r;
            const s = d.summary || {};
            const top = Array.isArray(d.topSellingProducts) ? d.topSellingProducts.map(item => ({ id: item.id, title: item.title, salesCount: item.salesCount || 0, revenueFormatted: (Number(item.revenueXaf) || 0).toLocaleString('fr-FR') + ' XAF' })) : [];
            this.setState({ analyticsRevenueFormatted: s.totalRevenueFormatted || ((Number(s.totalRevenueXaf) || 0).toLocaleString('fr-FR') + ' XAF'), analyticsOrdersCount: s.totalOrders || 0, analyticsViewsCount: String(s.totalStoreViews || 0), analyticsTopProducts: top });
          }).catch(() => {});
        }
      },
      setAnalyticsPeriod30d: () => {
        this.setState({ analyticsPeriod: '30d' });
        const api = getApi();
        if (api && this.state.primaryStoreId) {
          api.getStoreAnalytics(this.state.primaryStoreId, '30d').then(r => {
            const d = (r && r.data) || r;
            const s = d.summary || {};
            const top = Array.isArray(d.topSellingProducts) ? d.topSellingProducts.map(item => ({ id: item.id, title: item.title, salesCount: item.salesCount || 0, revenueFormatted: (Number(item.revenueXaf) || 0).toLocaleString('fr-FR') + ' XAF' })) : [];
            this.setState({ analyticsRevenueFormatted: s.totalRevenueFormatted || ((Number(s.totalRevenueXaf) || 0).toLocaleString('fr-FR') + ' XAF'), analyticsOrdersCount: s.totalOrders || 0, analyticsViewsCount: String(s.totalStoreViews || 0), analyticsTopProducts: top });
          }).catch(() => {});
        }
      },
      setAnalyticsPeriod90d: () => {
        this.setState({ analyticsPeriod: '90d' });
        const api = getApi();
        if (api && this.state.primaryStoreId) {
          api.getStoreAnalytics(this.state.primaryStoreId, '90d').then(r => {
            const d = (r && r.data) || r;
            const s = d.summary || {};
            const top = Array.isArray(d.topSellingProducts) ? d.topSellingProducts.map(item => ({ id: item.id, title: item.title, salesCount: item.salesCount || 0, revenueFormatted: (Number(item.revenueXaf) || 0).toLocaleString('fr-FR') + ' XAF' })) : [];
            this.setState({ analyticsRevenueFormatted: s.totalRevenueFormatted || ((Number(s.totalRevenueXaf) || 0).toLocaleString('fr-FR') + ' XAF'), analyticsOrdersCount: s.totalOrders || 0, analyticsViewsCount: String(s.totalStoreViews || 0), analyticsTopProducts: top });
          }).catch(() => {});
        }
      },
      storeLogoUrl: this.state.storeLogoUrl || (this.state.currentStore && (this.state.currentStore.logoUrl || this.state.currentStore.logo_url)) || '',
      currentStoreInitial: String((this.state.currentStore && this.state.currentStore.name) || this.state.businessStoreName || 'S').trim().charAt(0).toUpperCase(),
      handleStoreLogoUpload: (e) => {
        const file = (e && e.target && e.target.files && e.target.files[0]) || (e && e.file);
        if (!file) {
          if (e && typeof e === 'string' && (e.startsWith('data:') || e.startsWith('http'))) {
            this.setState({ storeLogoUrl: e });
            if (this.state.currentStore) {
              this.setState(st => ({ currentStore: { ...st.currentStore, logoUrl: e } }));
            }
            this.toast('Store profile picture updated');
          }
          return;
        }
        this.processStoreLogoFile(file, (dataUrl) => {
          this.setState({ storeLogoUrl: dataUrl });
          if (this.state.currentStore) {
            this.setState(st => ({ currentStore: { ...st.currentStore, logoUrl: dataUrl } }));
          }
          const api = getApi();
          const storeId = this.state.primaryStoreId || (this.state.currentStore && this.state.currentStore.id);
          if (api && storeId) {
            api.updateStore(storeId, { logoUrl: dataUrl }).catch(() => {});
          }
          this.toast('Store profile picture updated!');
        }, (err) => {
          this.setState({ storeSettingsError: err });
          this.toast(err);
        });
      },
      removeStoreLogo: () => {
        this.setState({ storeLogoUrl: '' });
        if (this.state.currentStore) {
          this.setState(st => ({ currentStore: { ...st.currentStore, logoUrl: '' } }));
        }
        const api = getApi();
        const storeId = this.state.primaryStoreId || (this.state.currentStore && this.state.currentStore.id);
        if (api && storeId) {
          api.updateStore(storeId, { logoUrl: null }).catch(() => {});
        }
        this.toast('Store profile picture removed');
      },
      selectStoreSettingsPresetLogo: (presetKey) => {
        const presets = {
          tech_blue: { from: '#1e3a8a', to: '#3b82f6' },
          emerald: { from: '#064e3b', to: '#10b981' },
          luxury_gold: { from: '#78350f', to: '#f59e0b' },
          royal_purple: { from: '#4c1d95', to: '#8b5cf6' },
          crimson: { from: '#881337', to: '#f43f5e' },
          dark_carbon: { from: '#09090b', to: '#27272a' }
        };
        const p = presets[presetKey] || presets.tech_blue;
        const storeName = (this.state.currentStore && this.state.currentStore.name) || this.state.businessStoreName || 'S';
        const avatar = this.generateStorePresetAvatar(p, storeName);
        this.setState({ storeLogoUrl: avatar });
        if (this.state.currentStore) {
          this.setState(st => ({ currentStore: { ...st.currentStore, logoUrl: avatar } }));
        }
        const api = getApi();
        const storeId = this.state.primaryStoreId || (this.state.currentStore && this.state.currentStore.id);
        if (api && storeId) {
          api.updateStore(storeId, { logoUrl: avatar }).catch(() => {});
        }
        this.toast('Preset brand avatar selected');
      },
      storeName: this.state.storeName || (this.state.store && this.state.store.name) || '',
      storeDescription: this.state.storeDescription || (this.state.store && this.state.store.description) || '',
      storeBio: this.state.storeBio,
      storeTagline: this.state.storeTagline,
      storeReturnPolicy: this.state.storeReturnPolicy,
      storeWarrantyPolicy: this.state.storeWarrantyPolicy,
      storeShippingPolicy: this.state.storeShippingPolicy,
      storePhone: this.state.storePhone || (this.state.currentStore && (this.state.currentStore.phoneNumber || this.state.currentStore.phone || this.state.currentStore.phone_number)) || '',
      storeOpenStatusBadge: this.state.storeOpenStatusBadge,
      storeOpenTime: this.state.storeOpenTime,
      storeCloseTime: this.state.storeCloseTime,
      storeLocationStreet: this.state.storeLocationStreet,
      storeLocationLandmark: this.state.storeLocationLandmark,
      updateStoreName: (e) => this.setState({ storeName: e && e.target ? e.target.value : e }),
      updateStoreDescription: (e) => this.setState({ storeDescription: e && e.target ? e.target.value : e }),
      updateStoreBio: (e) => this.setState({ storeBio: e && e.target ? e.target.value : e }),
      updateStoreTagline: (e) => this.setState({ storeTagline: e && e.target ? e.target.value : e }),
      updateStoreReturnPolicy: (e) => this.setState({ storeReturnPolicy: e && e.target ? e.target.value : e }),
      updateStoreWarrantyPolicy: (e) => this.setState({ storeWarrantyPolicy: e && e.target ? e.target.value : e }),
      updateStoreShippingPolicy: (e) => this.setState({ storeShippingPolicy: e && e.target ? e.target.value : e }),
      updateStorePhone: (e) => this.setState({ storePhone: e && e.target ? e.target.value : e }),
      updateStoreOpenTime: (e) => this.setState({ storeOpenTime: e && e.target ? e.target.value : e }),
      updateStoreCloseTime: (e) => this.setState({ storeCloseTime: e && e.target ? e.target.value : e }),
      updateStoreLocationStreet: (e) => this.setState({ storeLocationStreet: e && e.target ? e.target.value : e }),
      updateStoreLocationLandmark: (e) => this.setState({ storeLocationLandmark: e && e.target ? e.target.value : e }),
      storeSettingsSaving: Boolean(this.state.storeSettingsSaving),
      storeSettingsError: this.state.storeSettingsError || '',
      saveStoreSettingsAll: () => {
        const api = getApi();
        const storeId = this.state.primaryStoreId || (this.state.currentStore && this.state.currentStore.id) || (this.state.store && this.state.store.id) || 'store_primary';
        if (this.state.storeSettingsSaving) return;

        const fail = (msg) => {
          if (this._unmounted) return;
          this.setState({ storeSettingsSaving: false, storeSettingsError: msg });
          this.toast(msg);
        };

        this.setState({ storeSettingsSaving: true, storeSettingsError: '' });

        if (!api) {
          setTimeout(() => {
            if (this._unmounted) return;
            if (this.state.currentStore) {
              this.setState(st => ({ currentStore: { ...st.currentStore, name: this.state.storeName, description: this.state.storeDescription, logoUrl: this.state.storeLogoUrl, phoneNumber: this.state.storePhone } }));
            }
            this.setState({ storeSettingsSaving: false });
            this.toast('All store settings saved successfully');
            this.go('storeOnboarding');
          }, 600);
          return;
        }

        Promise.all([
          api.updateStore(storeId, { name: this.state.storeName, description: this.state.storeDescription, logoUrl: this.state.storeLogoUrl || null, phoneNumber: this.state.storePhone || null }),
          api.updateStoreProfile(storeId, { tagline: this.state.storeTagline, bio: this.state.storeBio, returnPolicy: this.state.storeReturnPolicy, warrantyPolicy: this.state.storeWarrantyPolicy, shippingPolicy: this.state.storeShippingPolicy, logoUrl: this.state.storeLogoUrl || null }),
          api.updateStoreHours(storeId, { schedule: { open: this.state.storeOpenTime, close: this.state.storeCloseTime } }),
          api.updateStoreLocation(storeId, { streetAddress: this.state.storeLocationStreet, landmark: this.state.storeLocationLandmark })
        ]).then(() => {
          if (this._unmounted) return;
          if (this.state.currentStore) {
            this.setState(st => ({
              store: Object.assign({}, st.store, { name: this.state.storeName, description: this.state.storeDescription, logoUrl: this.state.storeLogoUrl, phoneNumber: this.state.storePhone }),
              currentStore: Object.assign({}, st.currentStore, {
                name: this.state.storeName,
                description: this.state.storeDescription,
                logoUrl: this.state.storeLogoUrl,
                phoneNumber: this.state.storePhone,
                profile: Object.assign({}, st.currentStore && st.currentStore.profile, {
                  bio: this.state.storeBio,
                  tagline: this.state.storeTagline,
                  returnPolicy: this.state.storeReturnPolicy,
                  warrantyPolicy: this.state.storeWarrantyPolicy,
                  shippingPolicy: this.state.storeShippingPolicy
                })
              })
            }));
          }
          this.setState({ storeSettingsSaving: false });
          this.toast('All store settings saved successfully');
          this.go('storeOnboarding');
        }).catch(err => {
          fail((err && err.message) || 'Could not save your store settings. Please try again.');
        });
      },

      // ── Stores & Brands Discovery / Storefront Getters & Actions ──
      storeSearchQuery: this.state.storeSearchQuery || '',
      updateStoreSearch: (e) => {
        const value = e && e.target ? e.target.value : e;
        this.setState({ storeSearchQuery: value });
        this.loadStoreDiscovery();
      },
      clearStoreSearch: () => { this.setState({ storeSearchQuery: '' }); this.loadStoreDiscovery(); },
      storeCityFilter: this.state.storeCityFilter || 'all',
      updateStoreCityFilter: (e) => {
        const value = e && e.target ? e.target.value : e;
        this.setState({ storeCityFilter: value });
        this.loadStoreDiscovery();
      },
      storeCategoryFilter: this.state.storeCategoryFilter || 'all',
      /* Category chip classes, resolved here rather than as a ternary in the
         template. The engine returns the comparison's BOOLEAN and discards the
         branches, so every chip rendered `class="tag false"` - no selected
         state was ever visible and the filter gave no feedback when tapped. */
      storeCatAllClass: (this.state.storeCategoryFilter || 'all') === 'all' ? 'tag-accent' : 'tag-neutral',
      storeCatTechClass: (this.state.storeCategoryFilter || 'all') === 'tech' ? 'tag-accent' : 'tag-neutral',
      storeCatFashionClass: (this.state.storeCategoryFilter || 'all') === 'fashion' ? 'tag-accent' : 'tag-neutral',
      storeCatHospitalityClass: (this.state.storeCategoryFilter || 'all') === 'hospitality' ? 'tag-accent' : 'tag-neutral',
      storeCatHomeClass: (this.state.storeCategoryFilter || 'all') === 'home' ? 'tag-accent' : 'tag-neutral',
      storeCatServicesClass: (this.state.storeCategoryFilter || 'all') === 'services' ? 'tag-accent' : 'tag-neutral',
      setStoreCategory: (cat) => { this.setState({ storeCategoryFilter: cat }); this.loadStoreDiscovery(); },
      storeVerifiedOnly: Boolean(this.state.storeVerifiedOnly),
      toggleStoreVerifiedOnly: () => {
        this.setState(st => ({ storeVerifiedOnly: !st.storeVerifiedOnly }));
        this.loadStoreDiscovery();
      },
      storeDiscoveryTotal: this.state.storeDiscoveryTotal || 0,
      storeDiscoveryLoading: Boolean(this.state.storeDiscoveryLoading),
      storeDiscoveryError: this.state.storeDiscoveryError || '',
      storeDiscoveryCards: (this.state.storeDiscovery || []).filter(store => {
        // Defence-in-depth: strip QA/test boutiques client-side.
        if (/^store_test_/i.test(String(store.id || ''))) return false;
        if (/test\s*boutique/i.test(String(store.name || ''))) return false;

        const q = (this.state.storeSearchQuery || '').toLowerCase().trim();
        if (q) {
          const matchName = (store.name || '').toLowerCase().includes(q);
          const matchDesc = (store.description || '').toLowerCase().includes(q);
          const matchCity = (store.city || '').toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchCity) return false;
        }
        const city = (this.state.storeCityFilter || 'all').toLowerCase();
        if (city !== 'all' && (store.city || '').toLowerCase() !== city) {
          return false;
        }
        const cat = (this.state.storeCategoryFilter || 'all').toLowerCase();
        if (cat !== 'all') {
          const storeCat = (store.categoryId || store.category_id || '').toLowerCase();
          if (storeCat && !storeCat.includes(cat) && !cat.includes(storeCat)) return false;
        }
        if (this.state.storeVerifiedOnly && !store.isVerified && !store.is_verified) {
          return false;
        }
        return true;
      }).map(store => ({
        id: store.id,
        name: store.name || 'Unnamed store',
        description: store.description || 'LOUMOO storefront',
        rating: Number(store.rating || 0).toFixed(1),
        city: store.city || '',
        isVerified: Boolean(store.isVerified || store.is_verified),
        initial: String(store.name || 'S').trim().charAt(0).toUpperCase(),
        logoUrl: store.logoUrl || store.logo_url || store.logo || store.avatar || ''
      })),
      reloadStoreDiscovery: () => this.loadStoreDiscovery(),
      openDiscoveredStore: (store) => {
        if (!store || !store.id) return;
        this.setState({
          currentStoreId: store.id,
          currentStore: store,
          storeProfileError: ''
        });
        this.go('business');
      },
      businessStoreName: (this.state.currentStore && this.state.currentStore.name) || 'Storefront',
      businessStoreLogoUrl: (this.state.currentStore && (this.state.currentStore.logoUrl || this.state.currentStore.logo_url || this.state.currentStore.logo)) || (this.state.primaryStoreId && this.state.currentStore && this.state.currentStore.id === this.state.primaryStoreId ? this.state.storeLogoUrl : '') || '',
      businessStoreDescription: (this.state.currentStore && (this.state.currentStore.description || (this.state.currentStore.profile && (this.state.currentStore.profile.tagline || this.state.currentStore.profile.bio)))) || '',
      businessStoreCity: (this.state.currentStore && ((this.state.currentStore.location && this.state.currentStore.location.city) || this.state.currentStore.city)) || '',
      businessStorePhone: (this.state.currentStore && (this.state.currentStore.phoneNumber || this.state.currentStore.phone_number)) || '',
      businessStoreHasRating: Boolean(this.state.currentStore && Number(this.state.currentStore.ratingCount || this.state.currentStore.rating_count || 0) > 0),
      businessStoreRating: this.state.currentStore && this.state.currentStore.rating != null ? Number(this.state.currentStore.rating).toFixed(1) : '',
      businessStoreRatingCount: Number((this.state.currentStore && (this.state.currentStore.ratingCount || this.state.currentStore.rating_count)) || 0),
      businessStoreFollowerCount: Number((this.state.currentStore && (this.state.currentStore.followerCount || this.state.currentStore.follower_count)) || 0),
      businessStoreListingCount: Number((this.state.currentStore && (this.state.currentStore.listingCount || this.state.currentStore.productCount || this.state.currentStore.product_count)) || 0),
      businessStoreInitial: String((this.state.currentStore && this.state.currentStore.name) || 'S').trim().charAt(0).toUpperCase(),
      businessStoreVerified: Boolean(this.state.currentStore && (this.state.currentStore.isVerified || this.state.currentStore.is_verified)),
      businessStoreIsOwner: Boolean(this.state.currentStore && this.state.primaryStoreId && this.state.currentStore.id === this.state.primaryStoreId),
      businessStoreListings: (this.state.currentStore && Array.isArray(this.state.currentStore.listings) ? this.state.currentStore.listings : []).map(listing => ({
        id: listing.id,
        title: listing.title || 'Untitled listing',
        description: listing.description || '',
        imageUrl: encImg(listing.coverImageUrl || listing.cover_image_url || ''),
        hasImage: Boolean(listing.coverImageUrl || listing.cover_image_url),
        priceLabel: 'XAF ' + fmt(Number(listing.priceXaf ?? listing.price_xaf ?? listing.sale_price_minor ?? listing.base_price_minor ?? 0)),
        hasRating: Number(listing.ratingCount || listing.rating_count || 0) > 0,
        ratingLabel: Number(listing.rating || 0).toFixed(1),
        ratingCount: Number(listing.ratingCount || listing.rating_count || 0),
        categoryLabel: String(listing.categoryId || listing.category_id || listing.listingType || listing.listing_type || 'Listings').replace(/[_-]+/g, ' '),
        listingType: listing.listingType || listing.listing_type || ''
      })),
      businessFeaturedListings: (this.state.currentStore && Array.isArray(this.state.currentStore.listings) ? this.state.currentStore.listings : []).slice(0, 4).map(listing => ({
        id: listing.id,
        title: listing.title || 'Untitled listing',
        description: listing.description || '',
        imageUrl: encImg(listing.coverImageUrl || listing.cover_image_url || ''),
        hasImage: Boolean(listing.coverImageUrl || listing.cover_image_url),
        priceLabel: 'XAF ' + fmt(Number(listing.priceXaf ?? listing.price_xaf ?? listing.sale_price_minor ?? listing.base_price_minor ?? 0)),
        hasRating: Number(listing.ratingCount || listing.rating_count || 0) > 0,
        ratingLabel: Number(listing.rating || 0).toFixed(1),
        ratingCount: Number(listing.ratingCount || listing.rating_count || 0)
      })),
      businessHeroListing: (() => {
        const listings = this.state.currentStore && Array.isArray(this.state.currentStore.listings) ? this.state.currentStore.listings : [];
        const listing = listings[0];
        if (!listing) return null;
        return {
          id: listing.id,
          title: listing.title || 'Latest listing',
          description: listing.description || '',
          priceLabel: 'XAF ' + fmt(Number(listing.priceXaf ?? listing.price_xaf ?? listing.sale_price_minor ?? listing.base_price_minor ?? 0))
        };
      })(),
      businessHasListings: Boolean(this.state.currentStore && Array.isArray(this.state.currentStore.listings) && this.state.currentStore.listings.length > 0),
      businessHasMoreListings: Boolean(this.state.currentStore && Number(this.state.currentStore.listingCount || 0) > (Array.isArray(this.state.currentStore.listings) ? this.state.currentStore.listings.length : 0)),
      businessCollectionGroups: (() => {
        const listings = this.state.currentStore && Array.isArray(this.state.currentStore.listings) ? this.state.currentStore.listings : [];
        const groups = {};
        listings.forEach(listing => {
          const raw = String(listing.categoryId || listing.category_id || listing.listingType || listing.listing_type || 'Listings');
          const key = raw.toLowerCase();
          if (!groups[key]) groups[key] = { label: raw.replace(/[_-]+/g, ' '), count: 0, countLabel: '' };
          groups[key].count += 1;
        });
        return Object.keys(groups).map(key => {
          const group = groups[key];
          group.countLabel = group.count + ' published item' + (group.count === 1 ? '' : 's');
          return group;
        });
      })(),
      businessHasCollectionGroups: Boolean(this.state.currentStore && Array.isArray(this.state.currentStore.listings) && this.state.currentStore.listings.length > 0),
      businessStoreBio: (this.state.currentStore && ((this.state.currentStore.profile && this.state.currentStore.profile.bio) || this.state.currentStore.description)) || '',
      businessStoreTagline: (this.state.currentStore && this.state.currentStore.profile && this.state.currentStore.profile.tagline) || '',
      businessStoreWarrantyPolicy: (this.state.currentStore && this.state.currentStore.profile && this.state.currentStore.profile.warrantyPolicy) || '',
      businessStoreReturnPolicy: (this.state.currentStore && this.state.currentStore.profile && this.state.currentStore.profile.returnPolicy) || '',
      businessStoreShippingPolicy: (this.state.currentStore && this.state.currentStore.profile && this.state.currentStore.profile.shippingPolicy) || '',
      businessStoreAddress: (this.state.currentStore && this.state.currentStore.location && (this.state.currentStore.location.formattedAddress || this.state.currentStore.location.approximateLocation)) || '',
      businessStoreHours: (() => {
        const hours = this.state.currentStore && this.state.currentStore.hours;
        if (!hours) return [];
        if (hours.isAlwaysOpen) return [{ label: 'Every day', value: 'Open 24 hours' }];
        const schedule = hours.schedule || {};
        return Object.keys(schedule).map(day => {
          const entry = schedule[day] || {};
          return { label: day.charAt(0).toUpperCase() + day.slice(1), value: entry.closed ? 'Closed' : ((entry.open && entry.close) ? entry.open + ' - ' + entry.close : '') };
        }).filter(item => item.value);
      })(),
      businessHasStoreHours: Boolean(this.state.currentStore && this.state.currentStore.hours && (this.state.currentStore.hours.isAlwaysOpen || Object.keys(this.state.currentStore.hours.schedule || {}).length > 0)),
      businessHasStoreCopy: Boolean(this.state.currentStore && ((this.state.currentStore.profile && (this.state.currentStore.profile.tagline || this.state.currentStore.profile.bio)) || this.state.currentStore.description)),
      businessHasStorePolicies: Boolean(this.state.currentStore && this.state.currentStore.profile && (this.state.currentStore.profile.returnPolicy || this.state.currentStore.profile.warrantyPolicy || this.state.currentStore.profile.shippingPolicy)),
      businessStoreOpenLabel: (this.state.currentStore && this.state.currentStore.hours && this.state.currentStore.hours.currentStatus && this.state.currentStore.hours.currentStatus.label) || '',
      businessRatingSummary: (this.state.currentStore && this.state.currentStore.ratingSummary) || null,
      businessHasRatingSummary: Boolean(this.state.currentStore && this.state.currentStore.ratingSummary && Number(this.state.currentStore.ratingSummary.total || 0) > 0),
      businessHasReviews: Boolean(this.state.currentStore && Array.isArray(this.state.currentStore.reviews) && this.state.currentStore.reviews.length > 0),
      businessReviews: (this.state.currentStore && Array.isArray(this.state.currentStore.reviews) ? this.state.currentStore.reviews : []).map(review => ({
        authorName: (review.author && review.author.name) || 'LOUMOO buyer',
        ratingLabel: Number(review.rating || 0).toFixed(1),
        title: review.title || '',
        content: review.content || '',
        isVerifiedPurchase: Boolean(review.isVerifiedPurchase)
      })),
      businessStoreProfileLoading: Boolean(this.state.storeProfileLoading),
      businessStoreProfileError: (/permission|authorized|authorization|forbidden|manage/i.test(this.state.storeProfileError || '')) ? '' : (this.state.storeProfileError || ''),
      reloadStoreProfile: () => this.loadStoreProfile(),
      /* Storefront tabs, fully resolved in JS.

         The template engine does not evaluate a ternary whose test is a
         comparison: `{{ tab === 'products' ? 'tag-accent' : 'tag-neutral' }}`
         rendered the literal string "false" as the class, and the matching
         sc-if never opened - which is why STORE HOME was a blank page and the
         inactive tabs had no styling at all. Booleans and finished class
         strings cannot be misparsed. */
      storeActiveTab: this.state.storeActiveTab || 'home',
      storeTabIsHome: (this.state.storeActiveTab || 'home') === 'home',
      storeTabHomeClass: (this.state.storeActiveTab || 'home') === 'home' ? 'tag-accent' : 'tag-neutral',
      storeTabHomeBorder: (this.state.storeActiveTab || 'home') === 'home' ? 'var(--color-accent)' : 'transparent',
      storeTabIsProducts: (this.state.storeActiveTab || 'home') === 'products',
      storeTabProductsClass: (this.state.storeActiveTab || 'home') === 'products' ? 'tag-accent' : 'tag-neutral',
      storeTabProductsBorder: (this.state.storeActiveTab || 'home') === 'products' ? 'var(--color-accent)' : 'transparent',
      storeTabIsCollections: (this.state.storeActiveTab || 'home') === 'collections',
      storeTabCollectionsClass: (this.state.storeActiveTab || 'home') === 'collections' ? 'tag-accent' : 'tag-neutral',
      storeTabCollectionsBorder: (this.state.storeActiveTab || 'home') === 'collections' ? 'var(--color-accent)' : 'transparent',
      storeTabIsAbout: (this.state.storeActiveTab || 'home') === 'about',
      storeTabAboutClass: (this.state.storeActiveTab || 'home') === 'about' ? 'tag-accent' : 'tag-neutral',
      storeTabAboutBorder: (this.state.storeActiveTab || 'home') === 'about' ? 'var(--color-accent)' : 'transparent',
      storeTabIsReviews: (this.state.storeActiveTab || 'home') === 'reviews',
      storeTabReviewsClass: (this.state.storeActiveTab || 'home') === 'reviews' ? 'tag-accent' : 'tag-neutral',
      storeTabReviewsBorder: (this.state.storeActiveTab || 'home') === 'reviews' ? 'var(--color-accent)' : 'transparent',
      /* Vertical gates for the Sell wizard, computed here rather than as long
         `a === x || a === y || ...` expressions inside sc-if. The template
         parser mishandles a condition that mixes comparison with logical-or -
         the storefront's default tab used one and rendered a blank page. A
         plain boolean cannot misparse. */
      storeSellsPhysical: ['', 'electronics', 'fashion', 'home', 'food', 'beauty', 'automotive', 'general']
        .includes(String(this.state.store && (this.state.store.category_id || this.state.store.category) || 'electronics').toLowerCase()),
      storeSellsService: ['services', 'education', 'professional']
        .includes(String(this.state.store && (this.state.store.categoryId || this.state.store.category_id || this.state.store.category) || '').toLowerCase()),
      storeSellsHospitality: ['hotels', 'hospitality']
        .includes(String(this.state.store && (this.state.store.category_id || this.state.store.category) || '').toLowerCase()),
      setStoreActiveTab: (tab) => this.setState({ storeActiveTab: tab }),
      resetStoreFilters: () => { this.setState({ storeSearchQuery: '', storeCityFilter: 'all', storeCategoryFilter: 'all', storeVerifiedOnly: false }); this.toast('Store discovery filters reset'); },
      shareStore: () => { this.toast('Store link copied to clipboard!'); },
      shareBrand: () => { this.toast('Official brand link copied to clipboard!'); },

      // ── Brand Destinations Hub Getters & Actions ──
      selectedBrand: this.state.selectedBrand || 'apple',
      selectBrand: (b) => this.setState({ selectedBrand: b }),
      openBrand: (b) => { this.setState({ selectedBrand: b }); this.go('brand'); },
      isBrandApple: (this.state.selectedBrand || 'apple') === 'apple',
      isBrandSony: this.state.selectedBrand === 'sony',
      isBrandSamsung: this.state.selectedBrand === 'samsung',
      isBrandAnker: this.state.selectedBrand === 'anker',
      isBrandNike: this.state.selectedBrand === 'nike',
      brandFollowed: Boolean(this.state.brandFollowed),
      toggleBrandFollow: () => {
        const next = !this.state.brandFollowed;
        this.setState({ brandFollowed: next });
        this.toast(next ? 'Following official brand updates' : 'Unfollowed official brand');
      },

      // ── All Categories & Taxonomy Discovery Getters & Actions ──
      categorySearchQuery: this.state.categorySearchQuery || '',
      updateCategorySearch: (e) => this.setState({ categorySearchQuery: e && e.target ? e.target.value : e }),
      clearCategorySearch: () => this.setState({ categorySearchQuery: '' }),
      categorySelectedDomain: this.state.categorySelectedDomain || 'all',
      selectCategoryDomain: (dom) => this.setState({ categorySelectedDomain: dom }),
      isCategoryDomainAll: (this.state.categorySelectedDomain || 'all') === 'all',
      isCategoryDomainShop: this.state.categorySelectedDomain === 'shop',
      isCategoryDomainServices: this.state.categorySelectedDomain === 'services',
      isCategoryDomainTravel: this.state.categorySelectedDomain === 'travel',
      isCategoryDomainBusiness: this.state.categorySelectedDomain === 'business',

      activeCategorySlug: this.state.activeCategorySlug || 'all',
      isCategoryDirectory: (this.state.activeCategorySlug || 'all') === 'all',
      isCategoryDrilldown: (this.state.activeCategorySlug || 'all') !== 'all',
      isCategoryElectronics: this.state.activeCategorySlug === 'electronics',
      isCategoryFashion: this.state.activeCategorySlug === 'fashion',
      isCategoryHome: this.state.activeCategorySlug === 'home',
      isCategoryAutomotive: this.state.activeCategorySlug === 'automotive',
      isCategoryServices: this.state.activeCategorySlug === 'services',
      isCategoryHotels: this.state.activeCategorySlug === 'hotels',
      isCategoryTravel: this.state.activeCategorySlug === 'travel',
      isCategoryRealEstate: this.state.activeCategorySlug === 'real_estate',
      isCategoryBanks: this.state.activeCategorySlug === 'banks',
      isCategoryDigital: this.state.activeCategorySlug === 'digital',
      isCategoryBeauty: this.state.activeCategorySlug === 'beauty',
      isCategorySports: this.state.activeCategorySlug === 'sports',
      isCategoryGroceries: this.state.activeCategorySlug === 'groceries',

      activeSubcategorySlug: this.state.activeSubcategorySlug || 'all',
      selectSubcategory: (sub) => this.setState({ activeSubcategorySlug: sub }),
      isSubcatAll: (this.state.activeSubcategorySlug || 'all') === 'all',

      openAllCategories: () => {
        this.setState({ activeCategorySlug: 'all', activeSubcategorySlug: 'all', categorySearchQuery: '' });
        this.go('category');
      },
      openCategory: (catSlug) => {
        this.setState({ activeCategorySlug: catSlug, activeSubcategorySlug: 'all', categorySearchQuery: '' });
        this.go('category');
      },

      // ── Data-driven category drill-down grid ────────────────────────────
      // Every category resolves to real products (curated + live catalogue),
      // so categories without a bespoke editorial block never render blank.
      categoryProductCards: (() => {
        const activeCat = this.state.activeCategorySlug || 'all';
        const activeSub = this.state.activeSubcategorySlug || 'all';
        let pool = this._categoryProductPool(activeCat);
        if (activeSub !== 'all') {
          pool = pool.filter(p => this._matchesSubcategory(p, activeSub));
        }
        const parseNum = (str) => {
          const n = parseInt(String(str || '').replace(/[^0-9]/g, ''), 10);
          return isNaN(n) ? 0 : n;
        };
        const limit = this.state.categoryFeedLimit || 24;
        return pool.slice(0, limit).map((p) => {
          const rawP = p.price || (p.priceNumeric ? ('XAF ' + fmt(p.priceNumeric)) : (p.base_price_minor ? ('XAF ' + fmt(p.base_price_minor)) : ''));
          const rawSale = p.salePrice || '';
          let heroPrice = rawP || 'Ask price';
          let strikePrice = '';
          if (rawSale && rawP && rawSale !== rawP) {
            const n1 = parseNum(rawP);
            const n2 = parseNum(rawSale);
            if (n1 > 0 && n2 > 0 && n1 !== n2) {
              heroPrice = n1 < n2 ? rawP : rawSale;
              strikePrice = n1 < n2 ? rawSale : rawP;
            } else {
              heroPrice = rawSale;
              strikePrice = rawP;
            }
          } else if (rawSale && !rawP) {
            heroPrice = rawSale;
          }
          return {
            id: p.id,
            title: p.title || p.name || 'Untitled listing',
            imageUrl: encImg(p.coverImage || p.imageUrl || p.image || (p.images && p.images[0]) || ''),
            priceLabel: heroPrice,
            strikeLabel: strikePrice,
            ratingLabel: '★ ' + (p.rating != null ? p.rating : '4.9'),
            storeLabel: (p.storeName || p.merchant || p.store || 'LOUMOO verified seller') + (p.merchantCity || p.storeCity ? (' · ' + (p.merchantCity || p.storeCity)) : ''),
            badge: p.badge || (p.verified ? '✓ Verified' : ''),
            verified: Boolean(p.verified)
          };
        });
      })(),
      categoryDisplayName: (() => {
        const NAMES = { electronics: 'Electronics & Technology', fashion: 'Fashion & Luxury', hotels: 'Hospitality & Stays', travel: 'Travel & Mobility', services: 'Professional Services', automotive: 'Vehicles & Automotive', real_estate: 'Real Estate & Property', banks: 'Banks & Financial Services', home: 'Home & Living', digital: 'Digital Products', supermarket: 'Supermarket & Essentials', beauty: 'Beauty & Wellness', sports: 'Sports & Active Gear', groceries: 'Groceries & Daily Essentials' };
        return NAMES[this.state.activeCategorySlug || 'all'] || 'this category';
      })(),
      categoryHasPartnerStores: ['electronics','services','hotels','travel'].indexOf(this.state.activeCategorySlug || 'all') !== -1,
      categoryUsesDataGrid: (() => {
        const slug = this.state.activeCategorySlug || 'all';
        return slug !== 'all' && ['hotels','travel','services'].indexOf(slug) === -1;
      })(),
      categoryShowEmptyState: (() => {
        const slug = this.state.activeCategorySlug || 'all';
        if (slug === 'all' || ['hotels','travel','services'].indexOf(slug) !== -1) return false;
        return this._categoryProductPool(slug).length === 0;
      })(),
      subcatSmartphonesCount: this._categoryProductPool('electronics').filter(p => this._matchesSubcategory(p, 'smartphones')).length,
      subcatPowerCount: this._categoryProductPool('electronics').filter(p => this._matchesSubcategory(p, 'power_accessories')).length,
      subcatAudioCount: this._categoryProductPool('electronics').filter(p => this._matchesSubcategory(p, 'audio')).length,
      subcatLaptopsCount: this._categoryProductPool('electronics').filter(p => this._matchesSubcategory(p, 'laptops')).length,
      subcatFootwearCount: this._categoryProductPool('fashion').filter(p => this._matchesSubcategory(p, 'footwear')).length,
      subcatClothingCount: this._categoryProductPool('fashion').filter(p => this._matchesSubcategory(p, 'clothing')).length,
      subcatBagsCount: this._categoryProductPool('fashion').filter(p => this._matchesSubcategory(p, 'bags')).length,
      subcatWatchesCount: this._categoryProductPool('fashion').filter(p => this._matchesSubcategory(p, 'watches_jewelry')).length,
      subcatAppliancesCount: this._categoryProductPool('home').filter(p => this._matchesSubcategory(p, 'appliances')).length,
      subcatCookwareCount: this._categoryProductPool('home').filter(p => this._matchesSubcategory(p, 'cookware')).length,
      subcatTablewareCount: this._categoryProductPool('home').filter(p => this._matchesSubcategory(p, 'tableware')).length,
      subcatHomeCareCount: this._categoryProductPool('home').filter(p => this._matchesSubcategory(p, 'home_care')).length,
      electronicsTotalCount: this._categoryProductPool('electronics').length,
      fashionTotalCount: this._categoryProductPool('fashion').length,
      homeTotalCount: this._categoryProductPool('home').length,
      categoryTotalCount: this._categoryProductPool(this.state.activeCategorySlug || 'all').length,

      // Category Search Match helpers
      categoryHasQuery: Boolean((this.state.categorySearchQuery || '').trim()),
      matchElectronics: (() => {
        const q = (this.state.categorySearchQuery || '').trim().toLowerCase();
        if (!q) return true;
        return 'electronics technology laptop phone audio smartphone charger macbook iphone tech'.includes(q) || q.includes('elec') || q.includes('tech') || q.includes('phone') || q.includes('lap') || q.includes('mac') || q.includes('gadget');
      })(),
      matchFashion: (() => {
        const q = (this.state.categorySearchQuery || '').trim().toLowerCase();
        if (!q) return true;
        return 'fashion luxury clothing shoes footwear sneakers watch apparel dress streetwear'.includes(q) || q.includes('fash') || q.includes('shoe') || q.includes('cloth') || q.includes('lux') || q.includes('wear');
      })(),
      matchHome: (() => {
        const q = (this.state.categorySearchQuery || '').trim().toLowerCase();
        if (!q) return true;
        return 'home living furniture appliances kitchen decor sofa office table bed'.includes(q) || q.includes('home') || q.includes('furn') || q.includes('appli') || q.includes('kitch');
      })(),
      matchAutomotive: (() => {
        const q = (this.state.categorySearchQuery || '').trim().toLowerCase();
        if (!q) return true;
        return 'automotive vehicles cars suv motorbike spare parts tires toyota nissan'.includes(q) || q.includes('car') || q.includes('auto') || q.includes('veh') || q.includes('tire') || q.includes('moto');
      })(),
      matchServices: (() => {
        const q = (this.state.categorySearchQuery || '').trim().toLowerCase();
        if (!q) return true;
        return 'services repairs phone repair screen battery creative photography design education coding training'.includes(q) || q.includes('serv') || q.includes('rep') || q.includes('fix') || q.includes('photo') || q.includes('code') || q.includes('edu');
      })(),
      matchHotels: (() => {
        const q = (this.state.categorySearchQuery || '').trim().toLowerCase();
        if (!q) return true;
        return 'hotels hospitality lodging suites resort stays room studio bed sawa akwa'.includes(q) || q.includes('hot') || q.includes('stay') || q.includes('suit') || q.includes('lodg') || q.includes('room') || q.includes('resort');
      })(),
      matchTravel: (() => {
        const q = (this.state.categorySearchQuery || '').trim().toLowerCase();
        if (!q) return true;
        return 'travel mobility bus flights trains finexs camair camrail ticket transport chauffeur airport'.includes(q) || q.includes('trav') || q.includes('bus') || q.includes('flig') || q.includes('train') || q.includes('tick');
      })(),
      matchRealEstate: (() => {
        const q = (this.state.categorySearchQuery || '').trim().toLowerCase();
        if (!q) return true;
        return 'real estate property houses duplex apartments land plots commercial office villa'.includes(q) || q.includes('real') || q.includes('prop') || q.includes('hous') || q.includes('apart') || q.includes('land') || q.includes('villa');
      })(),
      matchBanks: (() => {
        const q = (this.state.categorySearchQuery || '').trim().toLowerCase();
        if (!q) return true;
        return 'banks finance banking money transfer microfinance loan agency orange mtn'.includes(q) || q.includes('bank') || q.includes('fin') || q.includes('mon') || q.includes('loan');
      })(),
      matchDigital: (() => {
        const q = (this.state.categorySearchQuery || '').trim().toLowerCase();
        if (!q) return true;
        return 'digital products software licenses templates saas courses download kits'.includes(q) || q.includes('dig') || q.includes('soft') || q.includes('temp') || q.includes('down') || q.includes('app');
      })(),

      categorySortBy: this.state.categorySortBy || 'popular',
      setCategorySort: (sort) => this.setState({ categorySortBy: sort }),
      categoryCityFilter: this.state.categoryCityFilter || 'all',
      updateCategoryCity: (e) => this.setState({ categoryCityFilter: e && e.target ? e.target.value : e }),
      categoryVerifiedOnly: Boolean(this.state.categoryVerifiedOnly),
      toggleCategoryVerified: () => this.setState(st => ({ categoryVerifiedOnly: !st.categoryVerifiedOnly })),
      resetCategoryFilters: () => {
        this.setState({
          categorySearchQuery: '',
          categorySelectedDomain: 'all',
          categoryCityFilter: 'all',
          categoryVerifiedOnly: false,
          activeSubcategorySlug: 'all'
        });
        this.toast('Category filters reset');
      },

      // ══════════════════════════════════════════════════════════════════
      // PUBLISHING STUDIO
      // ------------------------------------------------------------------
      // Everything below is derived, never stored. The engine owns the truth;
      // this block turns it into the exact values the templates bind to, so
      // the templates stay free of business rules.
      // ══════════════════════════════════════════════════════════════════
      ...(() => {
        const pub = getPublishing();
        const draft = this.state.pubDraft;

        // The intent chooser is available before any draft exists.
        const storeCategory = String(
          (this.state.store && (this.state.store.categoryId || this.state.store.category_id || this.state.store.category)) || ''
        ).toLowerCase();

        const base = {
          pubIntents: pub ? pub.intentsForStore(storeCategory) : [],
          pubStartIntent: (key) => this.startPublishing(key),
          pubResumeDraft: () => this.resumePublishingDraft(),
          pubDiscardDraft: () => this.discardPublishingDraft(),
          pubResumable: Boolean(this.state.pubResumable),
          pubResumableLabel: '',
          pubResumablePercent: 0,
          pubResumableWhen: '',
          pubCurrencyLabel: 'FCFA',
          pubDurationPresets: [
            { value: '30', label: '30 min' }, { value: '60', label: '1 hour' },
            { value: '90', label: '1h 30m' }, { value: '120', label: '2 hours' },
            { value: '240', label: 'Half day' }, { value: '480', label: 'Full day' },
            { value: '1440', label: '1 day' }
          ]
        };

        if (pub && this.state.pubResumable && this.state.pubResumable.draft) {
          const saved = this.state.pubResumable.draft;
          const savedReadiness = pub.readiness(saved, {
            categorySchema: null, broadcastSchema: this.state.pubBroadcastSchema
          });
          base.pubResumableLabel = (saved.values.title || '').trim()
            || ((pub.INTENTS[saved.intent] || {}).label || 'Untitled');
          base.pubResumablePercent = savedReadiness.percent;
          base.pubResumableWhen = pub.formatDateTime(this.state.pubResumable.savedAt);
        }

        if (!pub || !draft) {
          return Object.assign(base, {
            pubTitle: 'New publication',
            pubSections: [],
            pubBasicFields: [],
            pubAdvancedFields: [],
            pubPreviewCard: pub ? pub.emptyCard() : {
              chips: [], meta: [], highlights: [], isPlaceholder: true, title: '', hasMedia: false
            },
            pubMedia: [],
            pubPercent: 0,
            pubReadinessSummary: '',
            pubBlockers: [],
            pubWarnings: [],
            pubSectionLabel: '',
            pubSectionHint: '',
            pubSectionIndex: 0,
            pubSectionTotal: 0,
            pubHasNextSection: false,
            pubHasPrevSection: false,
            pubNextSectionLabel: '',
            pubPrevSectionLabel: '',
            pubCanPublish: false,
            pubPublishDisabled: true,
            pubPublishLabel: 'Publish',
            pubParentCategories: [],
            pubChildCategories: [],
            pubCategoryNote: '',
            pubVariantOptions: [],
            pubVariantCount: 0,
            pubAttachableListings: [],
            pubSchedule: [],
            pubCanAddMedia: false,
            pubMediaCount: 0,
            pubSuccessTitle: '',
            pubSuccessBlurb: '',
            pubSuccessActions: []
          });
        }

        const ctx = this._pubContext();
        const allSections = pub.sections(draft, ctx);
        const report = pub.readiness(draft, ctx);
        /* Which errors to show inline.
         *
         * Painting every untouched required field red the moment a section
         * opens is hostile — the seller has not failed at anything yet. So an
         * inline error appears once the seller has touched that field, or once
         * they have asked to publish (from Review, where every blocker is
         * listed anyway). Errors the SERVER returned always show: those are
         * about something that was actually submitted.
         */
        const reveal = this.state.pubRevealErrors;
        const computed = report.errors || {};
        const errors = Object.assign({}, this.state.pubFieldErrors || {});
        Object.keys(computed).forEach(path => {
          if (reveal || draft.touched[path]) errors[path] = computed[path];
        });

        const activeKey = this.state.pubSectionKey
          || (allSections[0] ? allSections[0].key : null);
        const activeIndex = Math.max(0, allSections.findIndex(s => s.key === activeKey));
        const active = allSections[activeIndex] || { fields: [], label: '', hint: '' };

        /* ---- resolve one field into everything the template binds to ---- */
        const resolveField = (f) => {
          const raw = pub.getValue(draft, f.path);
          const error = errors[f.path];

          const resolved = Object.assign({}, f, {
            value: raw === undefined || raw === null ? '' : raw,
            hasError: Boolean(error),
            error: error || '',
            // Some category attributes carry the unit in their own name
            // ("Battery Health (%)"); appending it again reads as a stutter.
            showUnit: Boolean(f.unit) && String(f.label).indexOf(f.unit) === -1,
            isSimpleInput: ['text', 'number', 'date', 'time', 'datetime'].indexOf(f.type) !== -1,
            inputType: f.type === 'datetime' ? 'datetime-local'
              : f.type === 'number' ? 'number'
                : f.type === 'date' ? 'date'
                  : f.type === 'time' ? 'time' : 'text'
          });

          if (f.type === 'longtext') {
            resolved.length = String(raw || '').length;
            resolved.overLimit = Boolean(f.maxLength && resolved.length > f.maxLength);
          }

          if (f.type === 'money') {
            const n = parseInt(String(raw || '').replace(/[^0-9]/g, ''), 10);
            resolved.formatted = n > 0 ? pub.formatMoney(n, draft.values.currency) : '';
          }

          if (f.type === 'select' || f.type === 'segmented'
            || f.type === 'radiocards' || f.type === 'multiselect') {
            const selectedList = Array.isArray(raw) ? raw.map(String) : [String(raw)];
            resolved.options = (f.options || []).map(o => Object.assign({}, o, {
              selected: selectedList.indexOf(String(o.value)) !== -1
            }));
            const hit = resolved.options.find(o => o.selected);
            resolved.selectedHint = hit ? (hit.hint || '') : '';
          }

          if (f.type === 'chips') {
            resolved.chips = (Array.isArray(raw) ? raw : []).map(v => ({ label: String(v) }));
            resolved.chipDraft = (this.state.pubChipDrafts || {})[f.path] || '';
            resolved.suggestions = (f.suggestions || [])
              .filter(s => (Array.isArray(raw) ? raw : []).indexOf(s) === -1)
              .slice(0, 6)
              .map(s => ({ label: s }));
          }

          if (f.type === 'toggle') resolved.value = Boolean(raw);

          return resolved;
        };

        const advancedOpen = this.state.pubAdvancedOpen;
        const activeFields = (active.fields || []).map(resolveField);
        const basicFields = activeFields.filter(f => !f.advanced);
        const advancedFields = activeFields.filter(f => f.advanced);

        /* ---- section states for the rail, the chips and the checklist ---- */
        const sectionStates = report.sections.map((s, i) => Object.assign({}, s, {
          index: i + 1,
          active: s.key === activeKey,
          firstIssue: s.issues && s.issues.length ? s.issues[0].message : ''
        }));

        /* ---- categories ---- */
        const taxonomy = this.state.pubTaxonomy || [];
        const allowedTypes = (pub.INTENTS[draft.intent] || {}).listingTypes || [];
        const relevant = taxonomy.filter(node => {
          const types = node.supportedListingTypes || node.supported_listing_types || [];
          return types.some(t => allowedTypes.indexOf(t) !== -1);
        });
        const parentId = draft.values.parentCategoryId
          || (relevant.find(n => (n.children || []).some(c => c.id === draft.values.categoryId)) || {}).id
          || '';

        const parentCategories = relevant.map(n => ({
          id: n.id,
          name: n.name,
          childCount: (n.children || []).length,
          selected: n.id === parentId
        }));

        const parentNode = relevant.find(n => n.id === parentId);
        const childCategories = parentNode
          ? (parentNode.children || []).map(c => ({
            id: c.id, name: c.name, selected: c.id === draft.values.categoryId
          }))
          : [];

        // A level-one category with no children IS the category — offering an
        // empty subcategory column would look broken.
        if (parentNode && childCategories.length === 0) {
          childCategories.push({
            id: parentNode.id, name: parentNode.name + ' (general)',
            selected: parentNode.id === draft.values.categoryId
          });
        }

        /* ---- variants ---- */
        const variantDefs = pub.variantOptionsOf(this.state.pubCategorySchema);
        const chosenVariants = draft.values.variantOptions || {};
        const variantOptions = variantDefs.map(vo => ({
          slug: vo.slug,
          name: vo.name,
          values: vo.values.map(v => ({
            value: v,
            selected: (chosenVariants[vo.slug] || []).indexOf(v) !== -1
          }))
        }));
        const variantCount = Object.keys(chosenVariants)
          .filter(k => (chosenVariants[k] || []).length > 0)
          .reduce((n, k) => n * chosenVariants[k].length, 1);

        /* ---- weekly schedule ---- */
        const schedule = draft.values.weeklySchedule || {};
        const scheduleRows = pub.WEEKDAYS.map(d => {
          const windows = schedule[d.key] || [];
          return {
            key: d.key, label: d.label,
            open: windows.length > 0,
            start: windows.length ? windows[0].start : '08:00',
            end: windows.length ? windows[0].end : '18:00'
          };
        });

        /* ---- media ---- */
        const mediaMax = draft.intent === 'BROADCAST' ? 8 : 12;
        const media = draft.media.map((m, i) => Object.assign({}, m, {
          isCover: i === 0,
          canMoveLeft: i > 0,
          canMoveRight: i < draft.media.length - 1
        }));

        /* ---- post-publish actions ---- */
        const published = this.state.pubPublished;
        const isBroadcast = draft.intent === 'BROADCAST';
        const scheduled = isBroadcast && draft.values.publishMode === 'SCHEDULE';

        const successActions = isBroadcast
          ? [
            { key: 'view', label: 'View announcement', primary: true },
            { key: 'share', label: 'Share' },
            { key: 'edit', label: 'Edit' },
            { key: 'performance', label: 'View performance' },
            { key: 'another', label: 'Create another' }
          ]
          : [
            { key: 'view', label: 'View listing', primary: true },
            { key: 'feed', label: 'View in feed' },
            { key: 'share', label: 'Share' },
            { key: 'edit', label: 'Edit' },
            { key: 'manage', label: 'Manage inventory' },
            { key: 'another', label: 'Create another' }
          ];

        return Object.assign(base, {
          /* identity */
          pubTitle: (draft.values.title || '').trim()
            || (draft.mode === 'edit' ? 'Edit publication' : 'New ' + ((pub.INTENTS[draft.intent] || {}).label || 'publication').toLowerCase()),
          pubIntent: draft.intent,

          /* sections */
          pubSections: sectionStates,
          pubSectionLabel: active.label,
          pubSectionHint: active.hint,
          pubSectionIndex: activeIndex + 1,
          pubSectionTotal: allSections.length,
          pubHasNextSection: activeIndex < allSections.length - 1,
          pubHasPrevSection: activeIndex > 0,
          pubNextSectionLabel: allSections[activeIndex + 1] ? allSections[activeIndex + 1].label : '',
          pubPrevSectionLabel: allSections[activeIndex - 1] ? allSections[activeIndex - 1].label : '',

          /* fields */
          pubBasicFields: basicFields,
          pubAdvancedFields: advancedFields,
          pubAdvancedOpen: advancedOpen,

          /* readiness */
          pubPercent: report.percent,
          pubReadinessSummary: report.summary,
          pubBlockers: report.blockers,
          pubWarnings: (report.warnings || []).map(w => ({ label: w })),
          pubCanPublish: report.canPublish,
          pubPublishDisabled: Boolean(this.state.pubLifecycle) || !report.canPublish,
          pubPublishLabel: this.state.pubLifecycle
            ? 'Publishing…'
            : scheduled ? 'Schedule this broadcast'
              : draft.mode === 'edit' && draft.remoteStatus === 'PUBLISHED' ? 'Save changes'
                : isBroadcast ? 'Publish to Announce' : 'Publish to LOUMOO',

          /* preview — the SAME projection the real feed renders */
          pubPreviewCard: pub.toFeedCard(draft, ctx),
          pubPreviewOpen: this.state.pubPreviewOpen,
          pubPreviewDevice: this.state.pubPreviewDevice,

          /* pickers */
          pubParentCategories: parentCategories,
          pubChildCategories: childCategories,
          pubCategoryNote: this.state.pubCategorySchema
            ? this.state.pubCategorySchema.attributes.length
              + ' detail fields buyers can filter on in ' + this.state.pubCategorySchema.categoryName + '.'
            : '',
          pubVariantOptions: variantOptions,
          pubVariantCount: Object.keys(chosenVariants).some(k => (chosenVariants[k] || []).length)
            ? variantCount : 0,
          pubSchedule: scheduleRows,
          pubAttachableListings: (this.state.pubAttachable || []).map(l => ({
            id: l.id,
            title: l.title,
            coverUrl: l.coverUrl || '',
            priceLine: pub.formatMoney(l.sale_price_minor || l.base_price_minor, l.currency || 'XAF'),
            selected: l.id === draft.values.attachmentId
          })),

          /* media */
          pubMedia: media,
          pubMediaCount: draft.media.length,
          pubCanAddMedia: draft.media.length < mediaMax,
          pubMediaError: this.state.pubMediaError,
          pubMediaBusy: this.state.pubMediaBusy,

          /* lifecycle */
          pubLifecycle: this.state.pubLifecycle,
          pubBusyLabel: this.state.pubBusyLabel,
          pubServerError: this.state.pubServerError,
          pubRetryable: this.state.pubRetryable,
          pubSaveState: this.state.pubSaveState,
          pubOffline: this.state.pubOffline,

          /* success */
          pubSuccessTitle: scheduled ? 'Scheduled' : isBroadcast ? 'Your broadcast is live' : 'Your listing is live',
          pubSuccessBlurb: scheduled
            ? 'It will publish automatically at the time you chose. You can still edit or cancel it until then.'
            : isBroadcast
              ? 'It is in the LOUMOO Announce feed now, in front of the audience you chose.'
              : 'Buyers can find it in the marketplace, in search, and on your boutique page.',
          pubSuccessActions: successActions,

          /* ---------- actions ---------- */
          pubSetField: (path, value) => this.setPublishingField(path, value),

          pubToggleValue: (path, value) => {
            const current = pub.getValue(draft, path) || [];
            const next = current.indexOf(value) === -1
              ? current.concat([value])
              : current.filter(v => v !== value);
            this.setPublishingField(path, next);
          },

          pubSetChipDraft: (path, value) => this.setState(st => ({
            pubChipDrafts: Object.assign({}, st.pubChipDrafts, { [path]: value })
          })),

          pubAddChip: (path, value) => {
            const text = String(value || '').trim();
            if (!text) return;
            const current = pub.getValue(draft, path) || [];
            if (current.indexOf(text) !== -1) return;
            this.setPublishingField(path, current.concat([text]));
            this.setState(st => ({
              pubChipDrafts: Object.assign({}, st.pubChipDrafts, { [path]: '' })
            }));
          },

          pubRemoveChip: (path, value) => {
            const current = pub.getValue(draft, path) || [];
            this.setPublishingField(path, current.filter(v => v !== value));
          },

          // Enter commits the chip; Backspace on an empty box removes the last
          // one, which is what every tag input people already use does.
          pubChipKey: (path, e) => {
            if (!e) return;
            const text = String((this.state.pubChipDrafts || {})[path] || '').trim();
            if (e.key === 'Enter' || e.key === ',') {
              if (e.preventDefault) e.preventDefault();
              if (!text) return;
              const current = pub.getValue(draft, path) || [];
              if (current.indexOf(text) === -1) this.setPublishingField(path, current.concat([text]));
              this.setState(st => ({
                pubChipDrafts: Object.assign({}, st.pubChipDrafts, { [path]: '' })
              }));
            } else if (e.key === 'Backspace' && !text) {
              const current = pub.getValue(draft, path) || [];
              if (current.length) this.setPublishingField(path, current.slice(0, -1));
            }
          },

          pubToggleVariantValue: (slug, value) => {
            const current = Object.assign({}, draft.values.variantOptions || {});
            const values = (current[slug] || []).slice();
            const i = values.indexOf(value);
            if (i === -1) values.push(value); else values.splice(i, 1);
            if (values.length) current[slug] = values; else delete current[slug];
            this.setPublishingField('variantOptions', current);
          },

          pubToggleDay: (dayKey) => {
            const current = Object.assign({}, draft.values.weeklySchedule || {});
            current[dayKey] = (current[dayKey] || []).length
              ? []
              : [{ start: '08:00', end: '18:00' }];
            this.setPublishingField('weeklySchedule', current);
          },

          pubSetDayTime: (dayKey, which, value) => {
            const current = Object.assign({}, draft.values.weeklySchedule || {});
            const windows = (current[dayKey] || []).slice();
            const window = Object.assign({ start: '08:00', end: '18:00' }, windows[0] || {});
            window[which] = value;
            windows[0] = window;
            current[dayKey] = windows;
            this.setPublishingField('weeklySchedule', current);
          },

          pubApplyWeekdays: () => {
            const next = {};
            pub.WEEKDAYS.forEach(d => {
              next[d.key] = (d.key === 'saturday' || d.key === 'sunday')
                ? [] : [{ start: '08:00', end: '18:00' }];
            });
            this.setPublishingField('weeklySchedule', next);
          },

          pubApplyEveryDay: () => {
            const next = {};
            pub.WEEKDAYS.forEach(d => { next[d.key] = [{ start: '08:00', end: '18:00' }]; });
            this.setPublishingField('weeklySchedule', next);
          },

          pubSelectParentCategory: (id) => {
            this.setState({ pubDraft: pub.setValue(draft, 'parentCategoryId', id) });
          },

          pubSelectCategory: (id) => this.setPublishingField('categoryId', id),

          pubAttachListing: (id) => this.setPublishingField(
            'attachmentId', draft.values.attachmentId === id ? '' : id
          ),

          pubPickImages: (e) => {
            const files = e && e.target && e.target.files ? Array.from(e.target.files) : [];
            if (!files.length) return;
            this.uploadPublishingImages(files);
            // Let the same file be chosen again after a removal.
            if (e && e.target) { try { e.target.value = ''; } catch (_) {} }
          },
          pubRemoveImage: (id) => this.removePublishingImage(id),
          pubRetryImage: (id) => this.retryPublishingImage(id),
          pubSetCover: (id) => this.setPublishingCover(id),
          pubMoveImage: (id, dir) => this.movePublishingImage(id, dir),

          pubGoSection: (key) => {
            this.setState({ pubSectionKey: key, pubAdvancedOpen: false });
            if (this.state.screen !== 'publishStudio') this.go('publishStudio');
            scrollStudioToTop();
          },
          pubNextSection: () => {
            const next = allSections[activeIndex + 1];
            if (next) { this.setState({ pubSectionKey: next.key, pubAdvancedOpen: false }); scrollStudioToTop(); }
          },
          pubPrevSection: () => {
            const prev = allSections[activeIndex - 1];
            if (prev) { this.setState({ pubSectionKey: prev.key, pubAdvancedOpen: false }); scrollStudioToTop(); }
          },
          pubToggleAdvanced: () => this.setState(st => ({ pubAdvancedOpen: !st.pubAdvancedOpen })),
          pubTogglePreview: () => this.setState(st => ({ pubPreviewOpen: !st.pubPreviewOpen })),
          pubSetPreviewDevice: (device) => this.setState({ pubPreviewDevice: device }),

          pubOpenReview: () => {
            // Asking to publish is the moment every gap becomes fair to show.
            this.setState({ pubRevealErrors: true });
            this._syncPublishingDraft().catch(() => {});
            this.go('publishReview');
          },
          pubBackToStudio: () => this.go('publishStudio'),

          // Jumping to an issue opens its section AND focuses the field, so
          // "3 things need attention" is three clicks to fixed, not a hunt.
          pubJumpToIssue: (sectionKey, path) => {
            this.setState({ pubSectionKey: sectionKey, pubAdvancedOpen: true });
            this.go('publishStudio');
            focusStudioField(path);
          },

          pubPublish: () => this.publishNow(),
          pubRetry: () => {
            this.setState({ pubServerError: '', pubRetryable: false });
            if (this.state.screen === 'publishReview') this.publishNow();
            else this._syncPublishingDraft().catch(() => {});
          },
          pubSaveDraftNow: () => {
            this._syncPublishingDraft()
              .then(() => this.toast('Draft saved'))
              .catch(() => this.toast('Saved on this device — it will sync when you reconnect'));
          },
          pubExit: () => this.exitPublishing(),

          pubSuccessAction: (key) => {
            const id = (this.state.pubDraft && this.state.pubDraft.remoteId) || null;
            if (key === 'view') {
              if (isBroadcast && id) this.openAnnouncement(id);
              else if (id) this.openProduct(id);
              return;
            }
            if (key === 'feed') { this.go(isBroadcast ? 'announce' : 'home'); return; }
            if (key === 'manage') { this.go('myListings'); return; }
            if (key === 'performance') { this.go('announceCampaigns'); this.loadStoreAnnounceTelemetry(); return; }
            if (key === 'edit') { this.editPublication(id, draft.intent); return; }
            if (key === 'share') { this.sharePublication(id, draft.intent, draft.values.title); return; }
            if (key === 'another') {
              this.setState({ pubDraft: null, pubPublished: null, pubResumable: null });
              this.go('publishIntent');
            }
          }
        });
      })(),

      // ══════════════════════════════════════════════════════════════════
      // DISCOVERY SURFACES
      // The Announce feed and the seller's catalogue, projected through the
      // SAME PublicationCard the studio previews.
      // ══════════════════════════════════════════════════════════════════
      ...(() => {
        const pub = getPublishing();
        const ctx = { broadcastSchema: this.state.pubBroadcastSchema };

        const ANNOUNCE_FILTERS = [
          { key: 'all', label: 'Everything' },
          { key: 'PROMOTION', label: 'Deals' },
          { key: 'PRODUCT_DROP', label: 'New arrivals' },
          { key: 'SERVICE_AVAILABLE', label: 'Services' },
          { key: 'EVENT', label: 'Events' },
          { key: 'HIRING', label: 'Jobs' },
          { key: 'ALERT', label: 'Tenders' },
          { key: 'ANNOUNCEMENT', label: 'Store news' }
        ];

        const SELLER_TABS = [
          { key: 'all', label: 'Everything', countKey: 'all' },
          { key: 'live', label: 'Live', countKey: 'live' },
          { key: 'drafts', label: 'Drafts', countKey: 'drafts' },
          { key: 'paused', label: 'Paused', countKey: 'paused' },
          { key: 'sold', label: 'Sold', countKey: 'sold' }
        ];

        const counts = this.state.sellerTabCounts || {};
        const tab = this.state.sellerListingTab || 'all';

        const listings = (this.state.sellerListings || []).filter(l => {
          if (tab === 'sold') return (l.order_count || 0) > 0;
          return true;
        });

        return {
          /* ---------- Announce ---------- */
          activeAnnouncementCard: this.state.activeAnnouncement
            ? ((pub && pub.cardFromAnnouncement) ? (() => { try { return pub.cardFromAnnouncement(this.state.activeAnnouncement, ctx); } catch (e) { return null; } })() : null) || this._formatAnnouncementCard(this.state.activeAnnouncement)
            : null,
          hasActiveAnnouncement: Boolean(this.state.activeAnnouncement),
          activeAnnouncementId: this.state.activeAnnouncementId || '',
          announceDetailLoading: this.state.announceDetailLoading,
          announceCards: (this.state.announcements || []).map(a => {
            if (pub && pub.cardFromAnnouncement) {
              try { return pub.cardFromAnnouncement(a, ctx); } catch (e) {}
            }
            return this._formatAnnouncementCard(a);
          }),
          announceTotal: this.state.announceTotal || (this.state.announcements || []).length,
          announceLoading: this.state.announceLoading,
          announceError: this.state.announceError,
          announceSearch: this.state.announceSearch,
          announceHasMore: (this.state.announcements || []).length < (this.state.announceTotal || (this.state.announcements || []).length),
          announceEmptyBlurb: this.state.announceFilter === 'all' && !this.state.announceSearch
            ? 'Be the first — a broadcast puts your boutique in front of buyers browsing right now.'
            : 'Nothing matches that filter yet. Try another one.',
          announceFilters: ANNOUNCE_FILTERS.map(f => Object.assign({}, f, {
            active: f.key === (this.state.announceFilter || 'all')
          })),
          setAnnounceFilter: (key) => {
            this.setState({ announceFilter: key, announcements: [] }, () => this.ensureAnnouncements());
          },
          setAnnounceSearch: (value) => {
            this.setState({ announceSearch: value });
            if (this._announceSearchTimer) clearTimeout(this._announceSearchTimer);
            this._announceSearchTimer = setTimeout(() => {
              if (this._unmounted) return;
              this.setState({ announcements: [] }, () => this.ensureAnnouncements());
            }, 400);
          },
          reloadAnnouncements: () => this.loadAnnouncements({ force: true }),
          loadMoreAnnouncements: () => this.loadAnnouncements({ append: true }),
          openAnnouncement: (id) => this.openAnnouncement(id),
          shareAnnouncement: (ann) => this.shareAnnouncement(ann || this.state.activeAnnouncement),
          activateAnnouncementCta: (ann) => this.activateAnnouncementCta(ann || this.state.activeAnnouncement),

          /* ---------- Announce: Zero Telemetry for New Stores ---------- */
          announcePeriod: this.state.announcePeriod || '7d',
          setAnnouncePeriodToday: () => { this.setState({ announcePeriod: 'today' }); this.loadStoreAnnounceTelemetry(); },
          setAnnouncePeriod7d: () => { this.setState({ announcePeriod: '7d' }); this.loadStoreAnnounceTelemetry(); },
          setAnnouncePeriod30d: () => { this.setState({ announcePeriod: '30d' }); this.loadStoreAnnounceTelemetry(); },
          announceTotalReach: this.state.announceTotalReach || '0',
          announceUniqueViewers: this.state.announceUniqueViewers || '0',
          announceUniqueRatio: this.state.announceUniqueRatio || '0.0%',
          announceActionClicks: this.state.announceActionClicks || '0',
          announceAverageCtr: this.state.announceAverageCtr || '0.00%',
          announceWhatsappInquiries: this.state.announceWhatsappInquiries || '0',
          announcePipelineValue: this.state.announcePipelineValue || '0 XAF',
          announceActiveCampaignsCount: this.state.announceActiveCampaignsCount || 0,
          announceCampaignsCountLabel: this.state.announceCampaignsCountLabel || '0 Active Broadcasts',
          announceHasCampaigns: Boolean(this.state.announceHasCampaigns),
          announceCampaignsList: this.state.announceCampaigns || [],
          announceTelemetryLoading: Boolean(this.state.announceTelemetryLoading),
          announceDoualaReach: this.state.announceDoualaReach || '0%',
          announceYaoundeReach: this.state.announceYaoundeReach || '0%',
          announceRegionalReach: this.state.announceRegionalReach || '0%',
          openAnnounceDetail: (id) => this.openAnnouncement(id),

          /* ---------- My Listings ---------- */
          sellerListingCards: listings.map(l => {
            const isBroadcast = l.kind === 'BROADCAST' || l.type === 'ANNOUNCEMENT' || l.broadcastType;
            if (isBroadcast && pub && pub.cardFromAnnouncement) {
              try {
                const card = pub.cardFromAnnouncement(l, ctx);
                card.kind = 'BROADCAST';
                card.canPublish = l.status === 'DRAFT';
                card.canPause = l.status === 'PUBLISHED';
                card.canResume = l.status === 'PAUSED';
                return card;
              } catch (e) {}
            }
            if (pub && pub.cardFromListing) {
              try {
                const card = pub.cardFromListing(l, { storeName: (this.state.store && this.state.store.name) || '' });
                card.kind = 'PRODUCT';
                card.canPublish = l.status === 'DRAFT';
                card.canPause = l.status === 'PUBLISHED';
                card.canResume = l.status === 'PAUSED';
                return card;
              } catch (e) {}
            }
            return {
              id: l.id,
              kind: isBroadcast ? 'BROADCAST' : 'PRODUCT',
              title: l.title || 'Untitled listing',
              priceLine: l.base_price_minor ? (typeof fmt === 'function' ? 'XAF ' + fmt(l.base_price_minor) : l.base_price_minor + ' XAF') : '',
              coverUrl: l.coverUrl || (l.mediaUrls && l.mediaUrls[0]) || '',
              statusLabel: l.status || 'PUBLISHED',
              canPublish: l.status === 'DRAFT',
              canPause: l.status === 'PUBLISHED',
              canResume: l.status === 'PAUSED'
            };
          }),
          sellerTabs: SELLER_TABS.map(t => Object.assign({}, t, {
            active: t.key === tab,
            count: counts[t.countKey] || 0
          })),
          sellerListingsLoading: this.state.sellerListingsLoading,
          sellerListingsError: this.state.sellerListingsError,
          sellerEmptyTitle: tab === 'all' ? 'Nothing published yet' : 'Nothing in ' + tab,
          sellerEmptyBlurb: tab === 'all'
            ? 'What you publish appears here, and in the LOUMOO marketplace at the same time.'
            : 'Switch tabs to see the rest of your catalogue.',
          setSellerTab: (key) => {
            this.setState({ sellerListingTab: key });
            this.loadSellerListings();
          },
          reloadSellerListings: () => this.loadSellerListings(),
          editListing: (id) => {
            const item = (this.state.sellerListings || []).find(x => x.id === id);
            const kind = (item && (item.kind === 'BROADCAST' || item.type === 'ANNOUNCEMENT' || item.broadcastType)) ? 'BROADCAST' : 'PRODUCT';
            this.editPublication(id, kind);
          },
          publishExisting: (id) => this.transitionListing(id, 'publish'),
          pauseListing: (id) => this.transitionListing(id, 'pause'),
          archiveListing: (id, title) => this.transitionListing(
            id, 'archive',
            'Remove "' + (title || 'this item') + '" from the marketplace? Buyers will no longer see it.'
          ),
          shareListing: (id, title) => {
            const item = (this.state.sellerListings || []).find(x => x.id === id);
            const kind = (item && (item.kind === 'BROADCAST' || item.type === 'ANNOUNCEMENT' || item.broadcastType)) ? 'BROADCAST' : 'PRODUCT';
            this.sharePublication(id, kind, title);
          },
          openPublication: (card) => {
            if (!card || !card.id) return;
            if (card.kind === 'BROADCAST' || card.type === 'ANNOUNCEMENT') {
              if (card.statusLabel === 'PUBLISHED') this.openAnnouncement(card.id);
              else this.editPublication(card.id, 'BROADCAST');
            } else {
              if (card.statusLabel === 'PUBLISHED') this.openProduct(card.id);
              else this.editPublication(card.id, 'PRODUCT');
            }
          }
        };
      })(),

      // ══════════════════════════════════════════════════════════════════
      // SEARCH & FILTER INTERACTIONS
      // ══════════════════════════════════════════════════════════════════
      searchQuery: this.state.searchQuery,
      searchBusy: Boolean(this.state.searchBusy),
      searchError: this.state.searchError || '',
      searchQueryTrimmed: (this.state.searchQuery || '').trim(),
      // A query is "active" once it is long enough to have reached the backend.
      searchActive: (this.state.searchQuery || '').trim().length >= 2,
      searchResultCount: Array.isArray(this.state.searchResults) ? this.state.searchResults.length : 0,
      // Result-list heading and empty-state copy. Both read naturally whether the
      // result set came from a text query, an active filter, or both.
      searchResultsHeading: (Array.isArray(this.state.searchResults) ? this.state.searchResults.length : 0)
        + (Array.isArray(this.state.searchResults) && this.state.searchResults.length === 1 ? ' result' : ' results')
        + ((this.state.searchQuery || '').trim() ? (' for “' + (this.state.searchQuery || '').trim() + '”') : ''),
      searchEmptyLabel: (this.state.searchQuery || '').trim()
        ? ('No results for “' + (this.state.searchQuery || '').trim() + '”')
        : 'No results match your filters',
      // Mutually-exclusive view flags so the search screen shows exactly one state.
      searchShowLoading: Boolean(this.state.searchBusy),
      searchShowError: !this.state.searchBusy && !!this.state.searchError,
      searchShowResults: !this.state.searchBusy && !this.state.searchError && Array.isArray(this.state.searchResults) && this.state.searchResults.length > 0,
      searchShowEmpty: !this.state.searchBusy && !this.state.searchError && Array.isArray(this.state.searchResults) && this.state.searchResults.length === 0,
      searchShowDefault: !this.state.searchBusy && !this.state.searchError && !Array.isArray(this.state.searchResults),
      // Display-ready result cards, built from the canonical GET /products
      // payload ({ items }). encImg/fmt are the same helpers the home rail uses.
      searchResultCards: (Array.isArray(this.state.searchResults) ? this.state.searchResults : []).map((p) => ({
        id: p.id,
        title: p.title || 'Untitled listing',
        imageUrl: encImg(p.imageUrl || p.image || ''),
        hasImage: !!(p.imageUrl || p.image),
        priceLabel: p.price || (p.priceNumeric ? ('XAF ' + fmt(p.priceNumeric)) : 'Ask price'),
        storeLabel: (p.storeName || 'LOUMOO seller') + (p.merchantCity ? (' · ' + p.merchantCity) : ''),
        ratingLabel: p.rating != null ? ('★ ' + p.rating) : '',
        inStock: p.inStock !== false
      })),
      // Type-through search: live, debounced, race-guarded (see _executeSearch).
      handleSearchInput: (e) => {
        const query = e && e.target ? e.target.value : (e || '');
        this.setState({ searchQuery: query });
        clearTimeout(this._searchTimer);
        // Bump the race token on every keystroke so any in-flight response for
        // an earlier query is dropped the instant the user types again.
        this._searchSeq = (this._searchSeq || 0) + 1;
        if (String(query).trim().length < 2) {
          // A short/empty query with an active filter is still a valid browse
          // ("all verified stores"); otherwise return to the default state.
          if (this.state.filterCity || this.state.filterVerifiedOnly) {
            this._searchTimer = setTimeout(() => {
              if (!this._unmounted) this._executeSearch(query);
            }, 240);
          } else {
            this.setState({ searchResults: null, searchBusy: false, searchError: '' });
          }
          return;
        }
        this._searchTimer = setTimeout(() => {
          if (!this._unmounted) this._executeSearch(query);
        }, 240);
      },
      // Enter from the Hub search field: run now and reveal the results screen.
      handleHubSearchKey: (e) => {
        if (e && (e.key === 'Enter' || e.keyCode === 13)) {
          if (e.preventDefault) e.preventDefault();
          clearTimeout(this._searchTimer);
          this._executeSearch(this.state.searchQuery);
          this.go('search');
        }
      },
      // The Hub magnifier button — explicit submit affordance.
      submitSearch: () => {
        clearTimeout(this._searchTimer);
        this._executeSearch(this.state.searchQuery);
        this.go('search');
      },
      // Popular-search chips: set the query, run it, and show the results screen.
      runSearch: (term) => {
        const q = String(term == null ? '' : term);
        this.setState({ searchQuery: q });
        clearTimeout(this._searchTimer);
        this._executeSearch(q);
        this.go('search');
      },

      // ── Filter drawer (is.filters) — refines the same /products query ──
      filterCity: this.state.filterCity || '',
      filterVerifiedOnly: Boolean(this.state.filterVerifiedOnly),
      hasActiveFilters: Boolean(this.state.filterCity) || Boolean(this.state.filterVerifiedOnly),
      // Precompute chip classes in JS: the DC template engine does not evaluate
      // `a === 'literal'` inside {{…}}, so the active state must be resolved here
      // and interpolated as a ready-made class string.
      cityChipClass: {
        douala: 'tag ' + (this.state.filterCity === 'douala' ? 'tag-accent' : 'tag-neutral'),
        yaounde: 'tag ' + (this.state.filterCity === 'yaounde' ? 'tag-accent' : 'tag-neutral'),
        kribi: 'tag ' + (this.state.filterCity === 'kribi' ? 'tag-accent' : 'tag-neutral')
      },
      // Full inline styles for the verified switch (full-attribute interpolation
      // is the DC-safe way to make a style depend on state).
      vfTrackStyle: 'width:42px;height:24px;border-radius:999px;position:relative;flex-shrink:0;transition:background .18s ease;background:'
        + (this.state.filterVerifiedOnly ? 'var(--color-accent)' : 'var(--color-neutral-300)'),
      vfKnobStyle: 'position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:transform .18s ease;transform:'
        + (this.state.filterVerifiedOnly ? 'translateX(18px)' : 'translateX(0)'),
      // City chip: single-select, tapping the active one clears it (back to all).
      setFilterCity: (c) => {
        this.setState({ filterCity: this.state.filterCity === c ? '' : c });
      },
      toggleVerifiedOnly: () => {
        this.setState({ filterVerifiedOnly: !this.state.filterVerifiedOnly });
      },
      // Apply: run the current query with the chosen filters and reveal results.
      applyFilters: () => {
        clearTimeout(this._searchTimer);
        this._executeSearch(this.state.searchQuery);
        this.go('search');
      },
      // Reset: clear filters in place (stays on the drawer so chips visibly clear).
      resetFilters: () => {
        this.setState({ filterCity: '', filterVerifiedOnly: false });
      },

      // Authentication State & Header CTA Reactivity
      isLoggedIn: this.state.isLoggedIn,
      authStatus: this.state.authStatus,
      // Only shown once the session has genuinely resolved to anonymous, so an
      // authenticated user never sees the promotional CTA flash during boot.
      showGetStarted: this.state.authStatus === 'anonymous',
      userInitials: (this.state.regFirstName ? this.state.regFirstName[0].toUpperCase() : 'T') + (this.state.regLastName ? this.state.regLastName[0].toUpperCase() : 'K'),
      userAvatar: this.state.regAvatar || '',
      hasUserAvatar: !!this.state.regAvatar,
      profileRoleLabel: this.state.userRole === 'both' ? 'VERIFIED BUYER & SELLER' : (this.state.userRole === 'seller' ? 'VERIFIED SELLER' : 'VERIFIED BUYER'),
      // Stored numbers already carry their country code, so blindly prefixing
      // '+237' rendered "+237 +237690000001". Normalise instead of concatenate,
      // and show nothing rather than a stranger's placeholder number.
      userPhoneCity: (() => {
        const raw = String(this.state.regPhone || '').trim();
        const digits = raw.replace(/[^0-9]/g, '');
        const phone = !digits
          ? ''
          : (digits.startsWith('237') ? '+' + digits : '+237 ' + digits);
        const city = this.state.regCity
          ? this.state.regCity.charAt(0).toUpperCase() + this.state.regCity.slice(1)
          : 'Douala';
        return (phone ? phone + ' · ' : '') + city + ', Cameroon';
      })(),
      /*
       * These were the literal strings '1 Active Delivery' and
       * '34 Products Saved', shown identically to every account — a brand-new
       * user with an empty wishlist was told they had 34 saved products.
       * GET /users/me/dashboard already returns real counts; use them, and say
       * "None" honestly when there are none.
       */
      activeDeliveriesLabel: (() => {
        const n = Number((this.state.dashboard && this.state.dashboard.counts
          && this.state.dashboard.counts.activeDeliveries) || 0);
        return n === 0 ? 'No active delivery' : (n + (n === 1 ? ' Active Delivery' : ' Active Deliveries'));
      })(),
      savedItemsLabel: (() => {
        const local = Object.keys(this.state.productWishlist || {}).length;
        const n = local || Number((this.state.dashboard && this.state.dashboard.counts
          && this.state.dashboard.counts.savedItems) || 0);
        return n === 0 ? 'No saved products yet' : (n + (n === 1 ? ' Product Saved' : ' Products Saved'));
      })(),
      // "Sell on LOUMOO" always leads somewhere useful. The guard asks the
      // server whether this account may create a listing and, if not, sends
      // the user to the ONE screen that lets them become eligible — with the
      // listing wizard remembered as the destination to resume afterwards.
      ctaAction: () => this.requireCapability('publishIntent', 'canCreateListing'),
      ctaLabel: this.state.isLoggedIn ? 'Sell on LOUMOO' : 'Join LOUMOO',
      navUploadAction: () => this.requireCapability('publishIntent', 'canCreateListing'),
      navUploadLabel: this.state.isLoggedIn ? 'Upload a listing' : 'Join LOUMOO',
      canCreateListing: Boolean(this.state.capabilities.canCreateListing),
      canPurchase: Boolean(this.state.capabilities.canPurchase),
      accountStateLabel: this.state.accountState || '',
      // The header's "Sign in" affordance opens the real sign-in screen. It
      // no longer *performs* a sign-in: only Clerk can do that.
      signIn: () => this.go('signIn'),

      /** Ends the Clerk session, then clears every cached principal. */
      signOut: () => {
        const api = getApi();
        const clerk = getClerk();
        const guard = getGuard();

        const finish = () => {
          if (this._unmounted) return;
          this._applyAnonymous();
          if (guard) { guard.invalidate(); guard.clearIntent(); }
          if (typeof localStorage !== 'undefined') {
            try {
              localStorage.removeItem('loumoo_auth_user');
              localStorage.removeItem('loumoo_onboarding_draft');
            } catch (e) {}
          }
          this.toast('Signed out of LOUMOO');
          this.go('home');
        };

        if (api) { try { api.signOut(); } catch (e) {} }
        if (clerk && clerk.isReady) {
          clerk.signOut().then(finish).catch(finish);
        } else {
          finish();
        }
      },

      // Server-backed onboarding progress, for the review screen and the
      // progress indicator.
      onboardingBusy: this.state.onboardingBusy,
      onboardingError: this.state.onboardingError,
      onboardingPercentage: this.state.serverOnboarding
        ? this.state.serverOnboarding.percentage
        : completionScore,
      onboardingNextStep: this.state.serverOnboarding
        ? this.state.serverOnboarding.nextStep
        : null,

      /**
       * Submits every outstanding onboarding step to the server, in order.
       * The server records completion; the browser only reports the answers.
       * If any step is rejected the wizard stays put and says which field.
       */
      completeOnboarding: () => {
        if (this.state.onboardingBusy) return;

        const api = getApi();
        if (!api || this.state.authStatus !== 'authenticated') {
          this.setState({
            onboardingError: 'Your session ended. Sign in again to finish setting up your account.'
          });
          this.go('signIn');
          return;
        }

        this.setState({ onboardingBusy: true, onboardingError: '' });

        this._submitRemainingOnboardingSteps()
          .then(state => {
            if (this._unmounted) return;
            this.setState({ onboardingBusy: false });

            if (typeof localStorage !== 'undefined') {
              try { localStorage.removeItem('loumoo_onboarding_draft'); } catch (e) {}
            }

            if (state && state.onboarding && state.onboarding.status !== 'COMPLETED') {
              this.setState({
                onboardingError: 'A few details are still needed: ' + (state.onboarding.nextStep || 'check the previous steps') + '.'
              });
              return;
            }
            this.go('onboardSuccess');
          })
          .catch(err => {
            if (this._unmounted) return;
            const fields = err && err.details && err.details.fields;
            this.setState({
              onboardingBusy: false,
              onboardingError: fields && fields.length
                ? fields.map(f => f.message).join(' ')
                : ((err && err.message) || 'We could not save your details. Please try again.')
            });
          });
      },
      // The greeting is the AUTHENTICATED user's name. It used to fall back to
      // the literal 'Tchuekam', so every LOUMOO account was greeted by another
      // real person's name — and a signed-out visitor saw a name too.
      userName: (() => {
        const u = this.state.sessionUser;
        const candidate = (u && (u.firstName || (u.fullName || '').split(' ')[0]))
          || this.state.regFirstName
          || '';
        if (candidate && !candidate.includes('@')) return candidate;
        if (u && u.lastName && !u.lastName.includes('@')) return u.lastName;
        if (this.state.regLastName && !this.state.regLastName.includes('@')) return this.state.regLastName;
        return 'Member';
      })(),
      showAds: this.props.showAds ?? true,
      cartCount: (this.state.cartItems || []).reduce((n, it) => n + (Number(it.qty) || 1), 0),
      cartHasItems: (this.state.cartItems || []).length > 0,
      cartItemsList: (this.state.cartItems || []).map((it) => ({
        id: it.id,
        name: it.name,
        image: it.image,
        store: it.store,
        qty: it.qty,
        lineLabel: 'XAF ' + fmt((Number(it.priceXaf) || 0) * (Number(it.qty) || 1))
      })),
      cartLabel: (() => {
        const items = this.state.cartItems || [];
        const n = items.reduce((a, it) => a + (Number(it.qty) || 1), 0);
        const sellers = new Set(items.map((it) => it.store)).size;
        if (n === 0) return 'Your bag is empty';
        return n + (n === 1 ? ' item' : ' items') + (sellers > 1 ? (' · ' + sellers + ' sellers') : '');
      })(),

      // ── Checkout Delivery Destination ──
      checkoutRecipientName: (() => {
        const sel = this.state.selectedDeliveryAddress;
        if (sel && sel.recipientName) return sel.recipientName;
        const addrs = this.state.addressesList || [];
        const def = addrs.find(a => a.isDefault) || addrs[0];
        if (def && def.recipientName) return def.recipientName;
        const name = [this.state.regFirstName, this.state.regLastName].filter(Boolean).join(' ');
        return name || 'Rostand Tchuekam';
      })(),
      checkoutRecipientPhone: (() => {
        const sel = this.state.selectedDeliveryAddress;
        if (sel && sel.phoneNumber) return sel.phoneNumber;
        const addrs = this.state.addressesList || [];
        const def = addrs.find(a => a.isDefault) || addrs[0];
        if (def && def.phoneNumber) return def.phoneNumber;
        return this.state.regPhone || '690 12 34 56';
      })(),
      checkoutDeliveryAddress: (() => {
        const sel = this.state.selectedDeliveryAddress;
        if (sel && sel.streetAddress) {
          return sel.streetAddress + (sel.city ? ', ' + (sel.city.charAt(0).toUpperCase() + sel.city.slice(1)) : '') + (sel.region ? ', ' + sel.region : ', Cameroon');
        }
        const addrs = this.state.addressesList || [];
        const def = addrs.find(a => a.isDefault) || addrs[0];
        if (def && def.streetAddress) {
          return def.streetAddress + (def.city ? ', ' + (def.city.charAt(0).toUpperCase() + def.city.slice(1)) : '') + (def.region ? ', ' + def.region : ', Cameroon');
        }
        return 'Rue Joss, Bonanjo Commercial District (Near Standard Chartered Bank), Douala';
      })(),
      changeDeliveryDestination: () => {
        this.setState({ checkoutReturn: true });
        this.openAddresses();
      },

      // ── Notifications feed ──
      notifHasItems: (this.state.notifications || []).length > 0,
      notifUnreadCount: (this.state.notifications || []).filter((n) => !n.read).length,
      notifHasUnread: (this.state.notifications || []).some((n) => !n.read),
      notifBadgeLabel: (() => {
        const n = (this.state.notifications || []).filter((x) => !x.read).length;
        return n > 9 ? '9+' : (n > 0 ? String(n) : '');
      })(),
      notifList: (this.state.notifications || []).map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        read: Boolean(n.read),
        toneColor: n.tone === 'success' ? 'var(--color-success)' : (n.tone === 'sale' ? 'var(--color-accent-sale)' : 'var(--color-accent)'),
        dateLabel: this._orderDateLabel(n.createdAt)
      })),
      markNotifsRead: () => this._markNotifsRead(),
      // ── Order confirmation (success screen) ──
      lastOrderNumber: this.state.lastOrder ? this.state.lastOrder.orderNumber : '',
      lastOrderTotal: this.state.lastOrder ? ('XAF ' + fmt(this.state.lastOrder.totalXaf)) : '',
      lastOrderSeller: this.state.lastOrder ? this.state.lastOrder.seller : 'the seller',
      lastOrderSellerPhone: this.state.lastOrder ? (this.state.lastOrder.sellerPhone || this.state.lastOrder.sellerWhatsapp || '') : '',
      lastOrderPayMethod: this.state.lastOrder ? this.state.lastOrder.paymentMethod : '',
      lastOrderItemsLabel: (() => {
        const o = this.state.lastOrder;
        if (!o) return '';
        return o.itemCount + (o.itemCount === 1 ? ' item' : ' items');
      })(),
      // ── Order history ──
      ordersHasItems: (this.state.orders || []).length > 0,
      ordersList: (this.state.orders || []).map((o) => ({
        orderNumber: o.orderNumber,
        dateLabel: 'Placed ' + this._orderDateLabel(o.createdAt),
        statusLabel: this._orderStatusLabel(o.status),
        itemsSummary: (o.items || []).map((it) => (it.qty > 1 ? (it.qty + '× ') : '') + it.name).join(', '),
        firstImage: (o.items && o.items[0] && o.items[0].image) || '',
        itemCountLabel: o.itemCount + (o.itemCount === 1 ? ' item' : ' items'),
        totalLabel: 'XAF ' + fmt(o.totalXaf),
        seller: o.seller,
        sellerPhone: o.sellerPhone || o.sellerWhatsapp || (o.items && o.items[0] && o.items[0].storePhone) || '',
        sellerWhatsapp: o.sellerWhatsapp || o.sellerPhone || (o.items && o.items[0] && o.items[0].storePhone) || '',
        payLabel: (o.paymentMethod || 'Pay on delivery') + ' · pay on delivery'
      })),
      vsCount: this.state.vs,
      vsFilterAll: this.state.vsFilterMode === 'all',
      vsFilterDiff: this.state.vsFilterMode === 'diff',
      vsFilterWinners: this.state.vsFilterMode === 'winners',
      setVsFilterAll: () => { this.setState({ vsFilterMode: 'all' }); this.toast('Showing all 9 specification categories'); },
      setVsFilterDiff: () => { this.setState({ vsFilterMode: 'diff' }); this.toast('Filtered: showing differences only'); },
      setVsFilterWinners: () => { this.setState({ vsFilterMode: 'winners' }); this.toast('Filtered: highlighting key winners'); },

      vsPriPerf: this.state.vsPriority === 'perf',
      vsPriPrice: this.state.vsPriority === 'price',
      vsPriDisp: this.state.vsPriority === 'display',
      vsPriBatt: this.state.vsPriority === 'battery',
      vsPriPort: this.state.vsPriority === 'portability',
      vsPriWarr: this.state.vsPriority === 'warranty',

      setVsPriorityPerf: () => { this.setState({ vsPriority: 'perf' }, () => this.runCompare()); },
      setVsPriorityPrice: () => { this.setState({ vsPriority: 'price' }, () => this.runCompare()); },
      setVsPriorityDisp: () => { this.setState({ vsPriority: 'display' }, () => this.runCompare()); },
      setVsPriorityBatt: () => { this.setState({ vsPriority: 'battery' }, () => this.runCompare()); },
      setVsPriorityPort: () => { this.setState({ vsPriority: 'portability' }, () => this.runCompare()); },
      setVsPriorityWarr: () => { this.setState({ vsPriority: 'warranty' }, () => this.runCompare()); },
      vsResultLoading: Boolean(this.state.vsResultLoading),
      vsRecommendTitle: (() => {
        const r = this.state.vsResult && this.state.vsResult.recommendation;
        return (r && r.recommendedTitle) ? String(r.recommendedTitle).replace(/\s+\d+GB.*/, '').trim() : '';
      })(),
      vsRecommendMatch: (() => {
        const r = this.state.vsResult && this.state.vsResult.recommendation;
        return (r && r.matchPercentage != null) ? (r.matchPercentage + '% match') : '';
      })(),
      vsRecommendReason: (() => {
        const r = this.state.vsResult && this.state.vsResult.recommendation;
        return (r && Array.isArray(r.topReasons) && r.topReasons.length) ? r.topReasons.slice(0, 2).join(' · ') : '';
      })(),

      vsSlot1Active: this.state.vsSlot1Active !== false,
      vsSlot2Active: this.state.vsSlot2Active !== false,
      vsSlot3Active: Boolean(this.state.vsSlot3Active),
      vsSlot4Active: Boolean(this.state.vsSlot4Active),
      vsEmpty: !this.state.vsSlot1Active && !this.state.vsSlot2Active && !this.state.vsSlot3Active && !this.state.vsSlot4Active && (!this.state.vsCompareIds || this.state.vsCompareIds.length === 0),

      removeVsSlot1: () => {
        const nextIds = (this.state.vsCompareIds || []).filter(x => x !== 'elec-1');
        this.setState(st => ({ vsSlot1Active: false, vs: Math.max(0, st.vs - 1), vsCompareIds: nextIds }));
        this.toast('Removed MacBook Air from comparison');
      },
      removeVsSlot2: () => {
        const nextIds = (this.state.vsCompareIds || []).filter(x => x !== 'elec-macbook-pro');
        this.setState(st => ({ vsSlot2Active: false, vs: Math.max(0, st.vs - 1), vsCompareIds: nextIds }));
        this.toast('Removed MacBook Pro from comparison');
      },
      toggleVsSlot3: () => {
        const next = !this.state.vsSlot3Active;
        const currentIds = (this.state.vsCompareIds || []).slice();
        const nextIds = next ? (!currentIds.includes('elec-lenovo-x1') ? currentIds.concat(['elec-lenovo-x1']) : currentIds) : currentIds.filter(x => x !== 'elec-lenovo-x1');
        this.setState(st => ({ vsSlot3Active: next, vs: next ? st.vs + 1 : Math.max(0, st.vs - 1), vsCompareIds: nextIds }));
        this.toast(next ? 'Added Lenovo ThinkPad X1 to comparison' : 'Removed ThinkPad X1');
      },
      addVsThinkPad: () => {
        const currentIds = (this.state.vsCompareIds || []).slice();
        const nextIds = !currentIds.includes('elec-lenovo-x1') ? currentIds.concat(['elec-lenovo-x1']) : currentIds;
        this.setState(st => ({ vsSlot3Active: true, vs: st.vsSlot3Active ? st.vs : st.vs + 1, vsCompareIds: nextIds }));
        this.toast('Added Lenovo ThinkPad X1 Carbon Gen 11');
      },
      addVsXps: () => {
        const currentIds = (this.state.vsCompareIds || []).slice();
        const nextIds = !currentIds.includes('elec-dell-xps') ? currentIds.concat(['elec-dell-xps']) : currentIds;
        this.setState(st => ({ vsSlot4Active: true, vs: st.vsSlot4Active ? st.vs : st.vs + 1, vsCompareIds: nextIds }));
        this.toast('Added Dell XPS 15 OLED (3.5K)');
      },
      removeVsSlot4: () => {
        const nextIds = (this.state.vsCompareIds || []).filter(x => x !== 'elec-dell-xps');
        this.setState(st => ({ vsSlot4Active: false, vs: Math.max(0, st.vs - 1), vsCompareIds: nextIds }));
        this.toast('Removed Dell XPS 15 from comparison');
      },
      clearVsAll: () => {
        this.setState({ vs: 0, vsSlot1Active: false, vsSlot2Active: false, vsSlot3Active: false, vsSlot4Active: false, vsCompareIds: [] });
        this.toast('Comparison workspace cleared');
      },
      resetVsDefaults: () => {
        this.setState({ vs: 2, vsSlot1Active: true, vsSlot2Active: true, vsSlot3Active: false, vsSlot4Active: false, vsCompareIds: ['elec-1', 'elec-macbook-pro'] });
        this.toast('Restored MacBook Air vs MacBook Pro comparison');
      },

      addToCompare: (id) => this.addToCompare(id),
      removeFromCompare: (id) => this.removeFromCompare(id),
      clearCompare: () => this.clearCompare(),
      loadVsPreset: (key) => this.loadVsPreset(key),
      vsPickerQuery: this.state.vsPickerQuery || '',
      vsPickerCat: this.state.vsPickerCat || 'all',
      setVsPickerCat: (cat) => this.setState({ vsPickerCat: cat }),
      handleVsPickerInput: (e) => this.setState({ vsPickerQuery: (e && e.target && e.target.value) || '' }),
      vsPickerResults: this.searchCompareCandidates(this.state.vsPickerQuery, this.state.vsPickerCat),
      vsPickerHasResults: this.searchCompareCandidates(this.state.vsPickerQuery, this.state.vsPickerCat).length > 0,
      vsCanAddMore: (this.state.vsCompareIds || []).length < 4,
      vsCustomCompareCards: (() => {
        const ids = this.state.vsCompareIds || [];
        const standardSlotIds = [];
        if (this.state.vsSlot1Active) standardSlotIds.push('elec-1');
        if (this.state.vsSlot2Active) standardSlotIds.push('elec-macbook-pro');
        if (this.state.vsSlot3Active) standardSlotIds.push('elec-lenovo-x1');
        if (this.state.vsSlot4Active) standardSlotIds.push('elec-dell-xps');
        return ids
          .filter(id => !standardSlotIds.includes(id))
          .map(id => this._resolveCompareEntity(id))
          .filter(Boolean);
      })(),
      vsActiveCards: (() => {
        const ids = (this.state.vsCompareIds && this.state.vsCompareIds.length) ? this.state.vsCompareIds.slice() : [];
        if (!ids.length) {
          if (this.state.vsSlot1Active) ids.push('elec-1');
          if (this.state.vsSlot2Active) ids.push('elec-macbook-pro');
          if (this.state.vsSlot3Active) ids.push('elec-lenovo-x1');
          if (this.state.vsSlot4Active) ids.push('elec-dell-xps');
        }
        return ids.map(id => this._resolveCompareEntity(id)).filter(Boolean);
      })(),
      vsIsCustomComparison: (() => {
        const ids = this.state.vsCompareIds || [];
        if (ids.length !== 2) return ids.length > 0 && !(ids.length === 2 && ids.includes('elec-1') && ids.includes('elec-macbook-pro'));
        return !ids.includes('elec-1') || !ids.includes('elec-macbook-pro');
      })(),
      vsCompareTitle: (() => {
        const ids = this.state.vsCompareIds || [];
        if (ids.length >= 2) {
          const e1 = this._resolveCompareEntity(ids[0]);
          const e2 = this._resolveCompareEntity(ids[1]);
          if (e1 && e2) return (e1.title || 'Item 1') + ' vs ' + (e2.title || 'Item 2');
        }
        return 'MacBook Air M2 vs MacBook Pro 14”';
      })(),
      vsStickyAction: () => {
        const ids = this.state.vsCompareIds || ['elec-1', 'elec-macbook-pro'];
        const first = this._resolveCompareEntity(ids[0]);
        if (first && first.category === 'Verified Store') {
          this.toast('Opening ' + first.title + ' storefront');
        } else if (first && first.category === 'Hotels & Stays') {
          this.toast('Viewing availability for ' + first.title);
        } else {
          this.addToCart('macbook_m2');
        }
      },
      vsStickyActionLabel: (() => {
        const ids = this.state.vsCompareIds || [];
        const first = ids.length ? this._resolveCompareEntity(ids[0]) : null;
        if (first && first.category === 'Verified Store') return 'Visit Store';
        if (first && first.category === 'Hotels & Stays') return 'Book Stay';
        return 'Add to bag';
      })(),
      vsStickyText: (() => {
        const ids = this.state.vsCompareIds || [];
        if (ids.length >= 2) {
          const best = this._resolveCompareEntity(ids[0]);
          if (best) return 'Top Match · ' + best.title + ' · ' + best.price;
        }
        return 'Recommended · Pro 14” · XAF 1.25M';
      })(),

      vsSecPerfOpen: this.state.vsSecPerfOpen !== false,
      vsSecDispOpen: this.state.vsSecDispOpen !== false,
      vsSecBattOpen: this.state.vsSecBattOpen !== false,
      vsSecBuildOpen: this.state.vsSecBuildOpen !== false,
      vsSecPortsOpen: this.state.vsSecPortsOpen !== false,
      vsSecCommOpen: this.state.vsSecCommOpen !== false,

      toggleVsPerfSec: () => this.setState(st => ({ vsSecPerfOpen: !st.vsSecPerfOpen })),
      toggleVsDispSec: () => this.setState(st => ({ vsSecDispOpen: !st.vsSecDispOpen })),
      toggleVsBattSec: () => this.setState(st => ({ vsSecBattOpen: !st.vsSecBattOpen })),
      toggleVsBuildSec: () => this.setState(st => ({ vsSecBuildOpen: !st.vsSecBuildOpen })),
      toggleVsPortsSec: () => this.setState(st => ({ vsSecPortsOpen: !st.vsSecPortsOpen })),
      toggleVsCommSec: () => this.setState(st => ({ vsSecCommOpen: !st.vsSecCommOpen })),
      toast: this.state.toast,
      back: () => {
        if (this.state.checkoutReturn) {
          this.setState({ checkoutReturn: false });
          this.go('checkout');
          return;
        }
        this.back();
      },
      showNav: !NO_NAV.includes(s),
      isNavHome: ['home', 'category', 'bestpicks', 'freeday', 'notifications', 'search', 'product', 'cart', 'chat'].includes(s),
      isNavStore: ['store', 'business', 'sellerPublicPage'].includes(s),
      isNavVs: ['vs', 'vsCompare'].includes(s),
      isNavTravel: ['travel', 'travelBus', 'travelPackages', 'travelVisa', 'travelResults', 'travelDetail', 'travelPassenger', 'travelTicket', 'hotelSearch', 'hotelDetail', 'hotelBooking', 'hotelVoucher'].includes(s),
      isNavAnnounce: ['announce', 'announceCampaigns', 'announceDetail'].includes(s),
      isNavProfile: ['profile', 'seller', 'orders', 'settings', 'accountDashboard', 'editProfile', 'addresses', 'notificationPreferences', 'privacySettings', 'securitySettings', 'followedStores', 'userActivity', 'publicUserProfile', 'signIn', 'forgotPassword', 'resetPassword', 'verifyEmail'].includes(s),
      navHome: this.navColor('home', 'category', 'bestpicks', 'freeday', 'notifications', 'search', 'product', 'cart', 'chat'),
      navStore: this.navColor('store', 'business', 'sellerPublicPage'),
      navVs: this.navColor('vs', 'vsCompare'),
      navUpload: this.navColor('publishIntent', 'publishStudio', 'publishReview', 'publishSuccess', 'myListings'),
      navTravel: this.navColor('travel', 'travelBus', 'travelPackages', 'travelVisa', 'travelResults', 'travelDetail', 'travelPassenger', 'travelTicket', 'hotelSearch', 'hotelDetail', 'hotelBooking', 'hotelVoucher'),
      navAnnounce: this.navColor('announce', 'announceCampaigns', 'announceDetail'),
      navProfile: this.navColor('profile', 'seller', 'orders', 'settings', 'accountDashboard', 'editProfile', 'addresses', 'notificationPreferences', 'privacySettings', 'securitySettings', 'followedStores', 'userActivity', 'publicUserProfile', 'signIn', 'forgotPassword', 'resetPassword', 'verifyEmail'),
      setScroller: (el) => {
        this._sc = el;
        if (el && !this._scrollAttached) {
          this._scrollAttached = true;
          let scrollThrottle = false;
          const handleScroll = () => {
            if (scrollThrottle) return;
            scrollThrottle = true;
            setTimeout(() => { scrollThrottle = false; }, 120);

            const target = el || document.documentElement || document.body;
            const scrollTop = target.scrollTop || window.pageYOffset || 0;
            const clientHeight = target.clientHeight || window.innerHeight || 0;
            const scrollHeight = target.scrollHeight || document.documentElement.scrollHeight || 0;
            const distanceToBottom = scrollHeight - (scrollTop + clientHeight);

            // SMART PROACTIVE PREFETCH: Triggers 1000px before the bottom
            // Loads well before the user ever reaches the bottom of the feed
            if (distanceToBottom <= 1000) {
              if (this.state.screen === 'home') {
                if ((this.state.infiniteFeedBatch || 1) < 3) {
                  this.setState({ infiniteFeedBatch: 3 });
                }
                if (!this._loadingHomeBatch) {
                  this._loadingHomeBatch = true;
                  const currentLimit = this.state.homeFeedLimit || 24;
                  const pool = this._categoryProductPool('all');
                  const nextLimit = currentLimit + 24;
                  this.setState({ homeFeedLimit: nextLimit });

                  if (nextLimit >= pool.length && this.state.catalogHasMore && !this.state.catalogLoading) {
                    const nextPage = (this.state.catalogPage || 1) + 1;
                    this.setState({ catalogPage: nextPage });
                    this.loadCatalogProducts({ page: nextPage, limit: 16 }, true);
                  }
                  setTimeout(() => { this._loadingHomeBatch = false; }, 300);
                }
              } else if (this.state.screen === 'category' || this.state.screen === 'collections') {
                if (!this._loadingCategoryBatch) {
                  this._loadingCategoryBatch = true;
                  const currentLimit = this.state.categoryFeedLimit || 24;
                  const activeCat = this.state.activeCategorySlug || 'all';
                  const pool = this._categoryProductPool(activeCat);
                  const nextLimit = currentLimit + 24;
                  this.setState({ categoryFeedLimit: nextLimit });

                  if (nextLimit >= pool.length && this.state.catalogHasMore && !this.state.catalogLoading) {
                    const nextPage = (this.state.catalogPage || 1) + 1;
                    this.setState({ catalogPage: nextPage });
                    this.loadCatalogProducts({ page: nextPage, limit: 16, category: activeCat !== 'all' ? activeCat : undefined }, true);
                  }
                  setTimeout(() => { this._loadingCategoryBatch = false; }, 300);
                }
              }
            }
          };

          el.addEventListener('scroll', handleScroll, { passive: true });
          window.addEventListener('scroll', handleScroll, { passive: true });
        }
      },
      addToCart: (arg) => {
        // Resolve which product to add: an explicit id string, otherwise the
        // product currently open on the PDP. No product context = honest nudge.
        let id = (typeof arg === 'string' && arg) ? arg : null;
        if (!id && this.state.currentProductId) id = this.state.currentProductId;
        if (!id) { this.toast('Open a product to add it to your bag'); return; }
        const list = (this.state.cartItems || []).map((it) => ({ ...it }));
        const qtyToAdd = (this.state.screen === 'product') ? Math.max(1, Number(this.state.qty) || 1) : 1;
        const existing = list.find((it) => it.id === id);
        let name;
        if (existing) {
          existing.qty = Math.min(99, (Number(existing.qty) || 1) + qtyToAdd);
          name = existing.name;
        } else {
          const entry = this._cartEntry(id);
          entry.qty = qtyToAdd;
          list.push(entry);
          name = entry.name;
        }
        this.setState({ cartItems: list });
        this._persistCart(list);
        this.toast('Added ' + name + ' to your bag');
      },
      // Buy now: add the open product to the bag and jump straight to checkout.
      buyNowProduct: () => {
        const id = this.state.currentProductId;
        if (!id) { this.toast('Open a product to buy it'); return; }
        const list = (this.state.cartItems || []).map((it) => ({ ...it }));
        const qtyToAdd = Math.max(1, Number(this.state.qty) || 1);
        const existing = list.find((it) => it.id === id);
        if (existing) existing.qty = Math.min(99, (Number(existing.qty) || 1) + qtyToAdd);
        else { const entry = this._cartEntry(id); entry.qty = qtyToAdd; list.push(entry); }
        this.setState({ cartItems: list });
        this._persistCart(list);
        this.go('checkout');
      },
      incCartQty: (id) => {
        const list = (this.state.cartItems || []).map((it) => it.id === id ? { ...it, qty: Math.min(99, (Number(it.qty) || 1) + 1) } : it);
        this.setState({ cartItems: list });
        this._persistCart(list);
      },
      decCartQty: (id) => {
        const list = (this.state.cartItems || []).map((it) => it.id === id ? { ...it, qty: (Number(it.qty) || 1) - 1 } : it).filter((it) => (Number(it.qty) || 0) > 0);
        this.setState({ cartItems: list });
        this._persistCart(list);
      },
      removeCartItem: (id) => {
        const list = (this.state.cartItems || []).filter((it) => it.id !== id);
        this.setState({ cartItems: list });
        this._persistCart(list);
        this.toast('Removed from bag');
      },
      // Place the order from the bag. Payment is deferred, so the order is
      // created as "pending / pay on delivery" — no charge is taken.
      placeOrder: () => {
        const cart = this.state.cartItems || [];
        if (!cart.length) { this.toast('Your bag is empty'); return; }
        const subtotal = cart.reduce((a, it) => a + (Number(it.priceXaf) || 0) * (Number(it.qty) || 1), 0);
        const escrow = subtotal > 0 ? 3000 : 0;
        const total = subtotal + escrow;
        const orderNumber = 'LM-' + Date.now().toString(36).toUpperCase().slice(-6);
        const payMap = { mtn: 'MTN MoMo', om: 'Orange Money', card: 'Bank card' };
        const method = payMap[this.state.sel && this.state.sel.pay] || 'Pay on delivery';

        const selAddr = this.state.selectedDeliveryAddress || (this.state.addressesList && (this.state.addressesList.find(a => a.isDefault) || this.state.addressesList[0]));
        const recipientName = (selAddr && selAddr.recipientName)
          || [this.state.regFirstName, this.state.regLastName].filter(Boolean).join(' ')
          || 'LOUMOO customer';
        const recipientPhone = (selAddr && selAddr.phoneNumber) || this.state.regPhone || '690 12 34 56';
        const street = (selAddr && selAddr.streetAddress) || 'Rue Joss, Bonanjo Commercial District';
        const city = (selAddr && selAddr.city) || this.state.regCity || 'Douala';

        const address = {
          name: recipientName,
          phone: recipientPhone,
          city: city,
          street: street
        };
        const items = cart.map((it) => ({
          id: it.id,
          name: it.name || it.title || 'Product',
          image: it.image || '',
          priceXaf: it.priceXaf,
          qty: it.qty,
          store: it.store || 'LOUMOO seller',
          storePhone: it.storePhone || it.sellerPhone || null
        }));
        const primarySellerPhone = (items[0] && (items[0].storePhone || items[0].sellerPhone)) || null;
        const order = {
          orderNumber: orderNumber,
          status: 'pending',
          paymentStatus: 'pending',
          paymentMethod: method,
          items: items,
          itemCount: items.reduce((n, it) => n + (Number(it.qty) || 1), 0),
          subtotalXaf: subtotal,
          escrowXaf: escrow,
          totalXaf: total,
          seller: (items[0] && items[0].store) || 'LOUMOO seller',
          sellerPhone: primarySellerPhone,
          sellerWhatsapp: primarySellerPhone,
          address: address,
          createdAt: Date.now()
        };
        const list = [order].concat(this.state.orders || []);
        this.setState({ orders: list, lastOrder: order, cartItems: [] });
        this._persistOrders(list);
        this._persistCart([]);

        // Instant Realtime Notification: Push immediately to in-app notification center and update unread badge
        const firstItemName = (items[0] && items[0].name) || 'item';
        const notifBody = 'Order ' + orderNumber + ' confirmed (' + firstItemName + (items.length > 1 ? ' +' + (items.length - 1) + ' more' : '') + ') · Pay on delivery via ' + method + ' (XAF ' + fmt(total) + ').';
        this._pushNotif({
          tone: 'accent',
          title: 'Order ' + orderNumber + ' confirmed',
          body: notifBody
        });

        // Try Web Notification if supported and permitted
        try {
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('LOUMOO — Order Confirmed', {
              body: notifBody,
              icon: '/favicon.ico'
            });
          }
        } catch (_) {}

        // Mirror to backend order service
        const authed = this.state.authStatus === 'authenticated';
        try {
          const api = getApi();
          if (api && typeof api.createOrder === 'function') {
            const serverPayload = {
              orderNumber: orderNumber,
              items: cart.map(it => ({
                id: String(it.id || it.listingId || it.productId || 'item_1'),
                listingId: String(it.listingId || it.productId || it.id || 'item_1'),
                quantity: Math.max(1, parseInt(it.qty, 10) || 1),
                unitPriceXaf: Number(it.priceXaf) || 0,
                title: it.name || it.title || 'Product'
              })),
              shippingAddress: {
                fullName: recipientName,
                phone: recipientPhone,
                street: street,
                city: city
              },
              deliveryMethod: 'HOME_DELIVERY',
              totalAmountXaf: total
            };
            api.createOrder(serverPayload)
              .then(() => { if (!this._unmounted) this.loadServerNotifications(); })
              .catch(() => {});
          }
        } catch (e) {}

        this.toast('🎉 Order ' + orderNumber + ' confirmed! Notification sent.');
        this.go('success');
      },
      addToVs: () => { this.setState(st => ({ vs: st.vs + 1 })); this.go('vsCompare'); },
      claimGift: () => this.toast('Gift claimed. The seller will message you shortly.'),
      toggleFollow: () => {
        const store = this.state.currentStore || {};
        const storeId = store.id || this.state.currentStoreId;
        const wasFollowing = Boolean(store.isFollowing ?? this.state.following);
        const next = !wasFollowing;
        const previousFollowerCount = Number(store.followerCount || store.follower_count || 0);

        this.setState({
          following: next,
          currentStore: Object.assign({}, store, {
            isFollowing: next,
            followerCount: Math.max(0, previousFollowerCount + (next ? 1 : -1))
          })
        });

        const api = getApi();
        const request = api && storeId
          ? (next ? api.followStoreById(storeId) : api.unfollowStoreById(storeId))
          : null;
        if (!request) {
          this.toast(next ? 'Following ' + (store.name || 'store') : 'Unfollowed');
          return;
        }

        request.then(result => {
          if (this._unmounted) return;
          const data = (result && result.data) || result || {};
          this.setState(st => ({
            following: Boolean(data.isFollowing ?? next),
            currentStore: Object.assign({}, st.currentStore, {
              isFollowing: Boolean(data.isFollowing ?? next),
              followerCount: Number(data.followerCount ?? st.currentStore.followerCount ?? previousFollowerCount)
            })
          }));
          this.toast(next ? 'Following ' + (store.name || 'store') : 'Unfollowed');
        }).catch(err => {
          if (this._unmounted) return;
          this.setState({
            following: wasFollowing,
            currentStore: Object.assign({}, store, { isFollowing: wasFollowing, followerCount: previousFollowerCount })
          });
          this.toast((err && err.message) || 'Could not update follow status.');
        });
      },
      // `following` is read directly by templates (e.g. the store card's
      // follow button variant). It lived in state but was never exposed, so
      // every `{{ following ? ... }}` resolved to an empty string and the
      // button rendered with no variant class at all - transparent and
      // indistinguishable from plain text.
      following: Boolean((this.state.currentStore && this.state.currentStore.isFollowing) ?? this.state.following),
      followLabel: Boolean((this.state.currentStore && this.state.currentStore.isFollowing) ?? this.state.following) ? 'FOLLOWING' : 'FOLLOW',
      toggleSave: () => { const next = !this.state.saved; this.setState({ saved: next }); this.toast(next ? 'Saved to your list' : 'Removed from saved'); },
      // ── Real seller messaging via WhatsApp deep-link ──
      // Opens WhatsApp to the store's line with a pre-filled enquiry that names
      // the product and price. Callable bare (uses the current product's store)
      // or with an explicit { sellerName, productTitle, price } for storefronts
      // and classifieds where there is no active product in state.
      contactSellerWhatsApp: (opts) => this.contactSellerWhatsApp(opts),
      // ── Boarding pass actions ──
      downloadBoardingPass: () => {
        this.toast('Preparing your boarding pass — use “Save as PDF” in the print dialog.');
        try { setTimeout(() => { try { window.print(); } catch (_) {} }, 250); } catch (_) {}
      },
      shareBoardingPass: () => {
        const msg = 'My LOUMOO e-ticket — Camair-Co QC 302 · Douala (DLA) → Yaoundé (NSI) · 13 Oct 08:40 · Seat 12A · Booking ref LMR-CMR-4821.';
        const url = 'https://wa.me/?text=' + encodeURIComponent(msg);
        try { window.open(url, '_blank', 'noopener,noreferrer'); }
        catch (_) { try { window.location.href = url; } catch (e) {} }
        this.toast('Sharing your e-ticket via WhatsApp…');
      },
      payNow: () => { this.go('paying'); setTimeout(() => this.go('success'), 1800); },
      publish: () => this.publishNow(),

      // ── Wishlist State & Infinite Discovery Commerce Feed ──
      // Real, persistent save/favourite. Entries are rich objects (name, image,
      // price, store) enriched from the product catalogue by id, stored in
      // localStorage so they survive reloads, and best-effort synced to the
      // backend saved-items API when the user is signed in.
      isWishlisted: (id) => Boolean(this.state.productWishlist && this.state.productWishlist[id]),
      wishlistCount: Object.keys(this.state.productWishlist || {}).length,
      wishlistHasItems: Object.keys(this.state.productWishlist || {}).length > 0,
      wishlistCountLabel: (() => {
        const n = Object.keys(this.state.productWishlist || {}).length;
        return n === 1 ? '1 item saved' : (n + ' items saved');
      })(),
      wishlistItems: Object.keys(this.state.productWishlist || {})
        .map((k) => this.state.productWishlist[k])
        .filter((it) => it && typeof it === 'object')
        .sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)),
      toggleProductWishlist: (id, name) => {
        const current = this.state.productWishlist || {};
        const isCurrentlySaved = Boolean(current[id]);
        const next = { ...current };
        let entry = null;
        if (isCurrentlySaved) {
          delete next[id];
        } else {
          entry = this._wishlistEntry(id, name);
          next[id] = entry;
        }
        this.setState({ productWishlist: next });
        this._persistWishlist(next);
        this._syncWishlistToBackend(id, !isCurrentlySaved, entry);
        this.toast(!isCurrentlySaved ? `Saved ${name || 'item'} to your wishlist` : `Removed ${name || 'item'} from wishlist`);
      },
      infiniteFeedBatch: this.state.infiniteFeedBatch || 1,
      isInfiniteBatch2OrMore: (this.state.infiniteFeedBatch || 1) >= 2,
      isInfiniteBatch3: (this.state.infiniteFeedBatch || 1) >= 3,
      loadMoreDiscoveries: () => {
        const nextLimit = (this.state.homeFeedLimit || 24) + 24;
        this.setState({
          infiniteFeedBatch: 3,
          homeFeedLimit: nextLimit
        });
        const pool = this._categoryProductPool('all');
        if (nextLimit >= pool.length && this.state.catalogHasMore && !this.state.catalogLoading) {
          const nextPage = (this.state.catalogPage || 1) + 1;
          this.setState({ catalogPage: nextPage });
          this.loadCatalogProducts({ page: nextPage, limit: 16 }, true);
        }
      },

      // ── Travel & Mobility Ecosystem Getters & Actions ──
      isTravelTabBus: this.state.travelServiceTab === 'bus',
      isTravelTabFlight: this.state.travelServiceTab === 'flight',
      isTravelTabTrain: this.state.travelServiceTab === 'train',
      isTravelTabTaxi: this.state.travelServiceTab === 'taxi',
      setTravelTabBus: () => { this.setState({ travelServiceTab: 'bus' }); this.toast('Switched to Intercity Bus'); },
      setTravelTabFlight: () => { this.setState({ travelServiceTab: 'flight' }); this.toast('Switched to Flights (Camair-Co & International)'); },
      setTravelTabTrain: () => { this.setState({ travelServiceTab: 'train' }); this.toast('Switched to Camrail InterCity Passenger Trains'); },
      setTravelTabTaxi: () => { this.setState({ travelServiceTab: 'taxi' }); this.toast('Switched to Taxi & Airport Transfers'); },

      // Dynamic Bus Schedules & Operators
      busSchedules: this.state.busSchedules || [],
      busSchedulesLoading: Boolean(this.state.busSchedulesLoading),
      busSchedulesError: this.state.busSchedulesError || '',
      selectedBusSchedule: this.state.selectedBusSchedule || null,
      activeSeatMap: this.state.activeSeatMap || null,
      activeSeatsList: (this.state.activeSeatsList || []).map(s => Object.assign({}, s, {
        isSelected: this.state.selectedBusSeat === s.seatNumber,
        isAvailable: !s.isOccupied
      })),
      seatMapLoading: Boolean(this.state.seatMapLoading),
      busOperators: this.state.busOperators || [],
      busCountTotal: (this.state.busSchedules && this.state.busSchedules.length) || 4,
      selectedBusOperatorId: this.state.busOperatorFilter || 'all',
      selectBusOperatorFilter: (op) => this.setState({ busOperatorFilter: (op && op.id) || 'all' }, () => this.loadBusSchedules()),
      filteredBusSchedules: (() => {
        let list = this.state.busSchedules || [];
        const filter = this.state.busOperatorFilter;
        let matched = list;
        if (filter && filter !== 'all') {
          if (filter === 'general') matched = list.filter(b => (b.operatorId || b.providerId) === 'op-general-express' || (b.providerName || b.operatorName || '').toLowerCase().includes('general'));
          else if (filter === 'finexs') matched = list.filter(b => (b.operatorId || b.providerId) === 'op-finexs' || (b.providerName || b.operatorName || '').toLowerCase().includes('finexs'));
          else if (filter === 'touristique') matched = list.filter(b => (b.operatorId || b.providerId) === 'op-touristique' || (b.providerName || b.operatorName || '').toLowerCase().includes('touristique'));
          else matched = list.filter(b => (b.operatorId || b.providerId) === filter);
        }
        const selId = this.state.selectedBusSchedule && this.state.selectedBusSchedule.id;
        return matched.map(b => Object.assign({}, b, {
          isSelectedSchedule: selId ? b.id === selId : false
        }));
      })(),
      selectBusSchedule: (bus) => this.selectBusSchedule(bus),
      selectBusSeat: (seat) => this.selectBusSeat(seat),
      continueWithBusSeat: (bus) => this.continueWithBusSeat(bus),
      findBusSchedules: () => this.findBusSchedules(),
      selectedBusSeat: this.state.selectedBusSeat || '4A',
      selectedBusPrice: (this.state.selectedBusSchedule && this.state.selectedBusSchedule.price) || 6000,
      selectedBusCurrency: (this.state.selectedBusSchedule && this.state.selectedBusSchedule.currency) || 'XAF',

      isBusFilterAll: this.state.busOperatorFilter === 'all',
      isBusFilterGeneral: this.state.busOperatorFilter === 'general',
      isBusFilterFinexs: this.state.busOperatorFilter === 'finexs',
      isBusFilterTouristique: this.state.busOperatorFilter === 'touristique',
      setBusFilterAll: () => { this.setState({ busOperatorFilter: 'all' }, () => this.loadBusSchedules()); },
      setBusFilterGeneral: () => { this.setState({ busOperatorFilter: 'general' }, () => this.loadBusSchedules()); },
      setBusFilterFinexs: () => { this.setState({ busOperatorFilter: 'finexs' }, () => this.loadBusSchedules()); },
      setBusFilterTouristique: () => { this.setState({ busOperatorFilter: 'touristique' }, () => this.loadBusSchedules()); },

      isSeat1A: this.state.selectedBusSeat === '1A',
      isSeat1B: this.state.selectedBusSeat === '1B',
      isSeat2A: this.state.selectedBusSeat === '2A',
      isSeat2C: this.state.selectedBusSeat === '2C',
      isSeat4A: this.state.selectedBusSeat === '4A',
      isSeat4B: this.state.selectedBusSeat === '4B',
      isSeat4C: this.state.selectedBusSeat === '4C',
      setBusSeat1A: () => { this.setState({ selectedBusSeat: '1A' }); this.toast('Selected Seat 1A (Window VIP)'); },
      setBusSeat1B: () => { this.setState({ selectedBusSeat: '1B' }); this.toast('Selected Seat 1B (Aisle VIP)'); },
      setBusSeat2A: () => { this.setState({ selectedBusSeat: '2A' }); this.toast('Selected Seat 2A (Window VIP)'); },
      setBusSeat2C: () => { this.setState({ selectedBusSeat: '2C' }); this.toast('Selected Seat 2C (Solo VIP)'); },
      setBusSeat4A: () => { this.setState({ selectedBusSeat: '4A' }); this.toast('Selected Seat 4A (Window VIP)'); },
      setBusSeat4B: () => { this.setState({ selectedBusSeat: '4B' }); this.toast('Selected Seat 4B (Aisle VIP)'); },
      setBusSeat4C: () => { this.setState({ selectedBusSeat: '4C' }); this.toast('Selected Seat 4C (Solo VIP)'); },

      hasActiveTicket: Boolean(this.state.lastTrip || (this.state.travelTickets && this.state.travelTickets.length > 0)),
      activeTicketSeat: (this.state.lastTrip && this.state.lastTrip.seat) || (this.state.travelTickets && this.state.travelTickets[0] && this.state.travelTickets[0].seatNumber) || '4A',
      activeTicketClass: (this.state.lastTrip && this.state.lastTrip.className) || 'VIP',
      activeTicketRoute: (this.state.lastTrip && this.state.lastTrip.fromLabel && this.state.lastTrip.toLabel) ? (this.state.lastTrip.fromLabel + ' → ' + this.state.lastTrip.toLabel) : 'Douala → Yaoundé',
      activeTicketTime: (this.state.lastTrip && (this.state.lastTrip.depart || this.state.lastTrip.dateLabel)) || 'Tomorrow 08:00',
      toggleTravelPaxClass: () => this.toggleTravelPaxClass(),
      travelPaxClassLabel: this.state.travelPaxClassLabel || '1 Adult · VIP',

      selectCorridorDoualaYaounde: () => { this.setState({ travelFrom: 'Douala', travelTo: 'Yaoundé' }, () => this.findBusSchedules()); },
      selectCorridorDoualaKribi: () => { this.setState({ travelFrom: 'Douala', travelTo: 'Kribi' }, () => this.findBusSchedules()); },
      selectCorridorYaoundeBafoussam: () => { this.setState({ travelFrom: 'Yaoundé', travelTo: 'Bafoussam' }, () => this.findBusSchedules()); },
      selectCorridorDoualaNgaoundere: () => { this.setState({ travelFrom: 'Douala', travelTo: 'Ngaoundéré' }, () => this.findBusSchedules()); },

      travelPackages: this.state.travelPackages || [],
      travelPackagesLoading: Boolean(this.state.travelPackagesLoading),
      selectTravelPackage: (pkg) => this.selectTravelPackage(pkg),
      selectPackageKribi: () => this.selectPackageKribi(),
      selectPackageLimbe: () => this.selectPackageLimbe(),
      selectPackageRhumsiki: () => this.selectPackageRhumsiki(),

      travelVisaDestinations: this.state.travelVisaDestinations || [],
      visaCountry: this.state.visaCountry || '',
      updateVisaCountry: (e) => this.setState({ visaCountry: e && e.target ? e.target.value : e }),
      visaDate: this.state.visaDate || '',
      updateVisaDate: (e) => this.setState({ visaDate: e && e.target ? e.target.value : e }),
      visaPhone: this.state.visaPhone || '',
      updateVisaPhone: (e) => this.setState({ visaPhone: e && e.target ? e.target.value : e }),
      requestVisaConcierge: () => this.requestVisaConcierge(),
      visaApplicantName: this.state.visaApplicantName || 'ROSTAND TCHUEKAM',
      visaApplicationRef: this.state.visaApplicationRef || 'LMT-VSA-91024',
      visaApplicationStatus: this.state.visaApplicationStatus || 'IN REVIEW',
      visaCountryLabel: this.state.visaCountryLabel || 'France / Schengen Short Stay (Type C)',
      downloadBoardingPass: () => this.downloadBoardingPass(),
      shareBoardingPass: () => this.shareBoardingPass(),

      swapTravelRoute: () => {
        const from = this.state.travelFrom || 'Douala';
        const to = this.state.travelTo || 'Yaoundé';
        this.setState({ travelFrom: to, travelTo: from });
        this.toast('Swapped Origin & Destination');
      },
      // Mobile payment method selection
      travelPaymentMethod: this.state.travelPaymentMethod || 'mtn',
      setPaymentMtn: () => this.setState({ travelPaymentMethod: 'mtn' }),
      setPaymentOrange: () => this.setState({ travelPaymentMethod: 'orange' }),
      isPaymentMtn: (this.state.travelPaymentMethod || 'mtn') === 'mtn',
      isPaymentOrange: (this.state.travelPaymentMethod || 'mtn') === 'orange',
      // Passenger form bindings
      travelPaxName: this.state.travelPaxName,
      travelPaxPhone: this.state.travelPaxPhone,
      travelPaxId: this.state.travelPaxId,
      travelFrom: this.state.travelFrom,
      travelTo: this.state.travelTo,
      updateTravelPaxName: (e) => this.setState({ travelPaxName: e && e.target ? e.target.value : e }),
      updateTravelPaxPhone: (e) => this.setState({ travelPaxPhone: e && e.target ? e.target.value : e }),
      updateTravelPaxId: (e) => this.setState({ travelPaxId: e && e.target ? e.target.value : e }),
      updateTravelFrom: (e) => this.setState({ travelFrom: e && e.target ? e.target.value : e }),
      updateTravelTo: (e) => this.setState({ travelTo: e && e.target ? e.target.value : e }),
      travelDate: this.state.travelDate,
      updateTravelDate: (e) => this.setState({ travelDate: e && e.target ? e.target.value : e }),
      travelSearchResults: this.state.travelSearchResults || [],
      selectedTravelResult: this.state.selectedTravelResult || null,
      selectTravelResult: (result) => this.selectTravelResult(result),
      travelSearchLoading: Boolean(this.state.travelSearchLoading),
      travelSearchError: this.state.travelSearchError || '',
      travelSearchDone: Boolean(this.state.travelSearchDone),
      travelLandingLoaded: Boolean(this.state.travelLandingLoaded),
      travelLandingLoading: Boolean(this.state.travelLandingLoading),
      travelLandingError: this.state.travelLandingError || '',
      travelLandingItems: this.state.travelLandingItems || [],
      searchTravel: () => this.searchTravel(),
      travelRouteLabel: (this.state.travelFrom || 'Douala') + ' → ' + (this.state.travelTo || 'Yaoundé'),
      travelTripsLoading: Boolean(this.state.travelTripsLoading),
      travelTripsError: this.state.travelTripsError || '',
      travelTickets: this.state.travelTickets || [],
      travelTicketsLoading: Boolean(this.state.travelTicketsLoading),
      reloadTravelTrips: () => this.loadTravelTrips(),
      reloadTravelTickets: () => this.loadTravelTickets(),
      // Confirm a real booking → persists a trip and issues the e-ticket.
      bookTravelItem: () => this._confirmTravelBooking(),
      bookFlight: () => this._confirmTravelBooking(),
      // E-ticket (boarding pass) fields, from the last confirmed trip.
      ticketPnr: (this.state.lastTrip && this.state.lastTrip.reference) || '',
      ticketPassenger: (this.state.lastTrip && this.state.lastTrip.passenger) ? String(this.state.lastTrip.passenger).toUpperCase() : '',
      ticketFromCode: (this.state.lastTrip && this.state.lastTrip.fromCode) || '',
      ticketToCode: (this.state.lastTrip && this.state.lastTrip.toCode) || '',
      ticketFromCity: (this.state.lastTrip && this.state.lastTrip.fromCity) || '',
      ticketToCity: (this.state.lastTrip && this.state.lastTrip.toCity) || '',
      ticketDate: (this.state.lastTrip && this.state.lastTrip.dateLabel) || '',
      ticketBoard: (this.state.lastTrip && this.state.lastTrip.board) || '',
      ticketDepart: (this.state.lastTrip && this.state.lastTrip.depart) || '',
      ticketArrive: (this.state.lastTrip && this.state.lastTrip.arrive) || '',
      ticketGate: (this.state.lastTrip && this.state.lastTrip.gate) || '',
      ticketSeat: (this.state.lastTrip && this.state.lastTrip.seat) || '',
      ticketFlightNo: (this.state.lastTrip && this.state.lastTrip.flightNo) || '',
      ticketOperator: (this.state.lastTrip && this.state.lastTrip.operator) || '',
      ticketPriceLabel: (this.state.lastTrip && this.state.lastTrip.priceLabel) || '',

      // ── Homepage Master Hub (HeroBanner Cinema & Editorial Suite - 10 Flagship Slides) ──
      isHeroSlide0: (this.state.heroSlide || 0) === 0,
      isHeroSlide1: this.state.heroSlide === 1,
      isHeroSlide2: this.state.heroSlide === 2,
      isHeroSlide3: this.state.heroSlide === 3,
      isHeroSlide4: this.state.heroSlide === 4,
      isHeroSlide5: this.state.heroSlide === 5,
      isHeroSlide6: this.state.heroSlide === 6,
      isHeroSlide7: this.state.heroSlide === 7,
      isHeroSlide8: this.state.heroSlide === 8,
      isHeroSlide9: this.state.heroSlide === 9,
      setHeroSlide0: () => this.setHeroSlide(0),
      setHeroSlide1: () => this.setHeroSlide(1),
      setHeroSlide2: () => this.setHeroSlide(2),
      setHeroSlide3: () => this.setHeroSlide(3),
      setHeroSlide4: () => this.setHeroSlide(4),
      setHeroSlide5: () => this.setHeroSlide(5),
      setHeroSlide6: () => this.setHeroSlide(6),
      setHeroSlide7: () => this.setHeroSlide(7),
      setHeroSlide8: () => this.setHeroSlide(8),
      setHeroSlide9: () => this.setHeroSlide(9),
      heroNextSlide: () => this.heroNextSlide(),
      heroPrevSlide: () => this.heroPrevSlide(),

      // ── Dynamic PDP Product Details Bindings ──
      currentProduct: this.state.currentProduct,
      productLoading: this.state.productLoading,
      productNotFound: this.state.productNotFound,
      productError: this.state.productError,
      currentProductActiveImage: this.state.currentProductActiveImage,
      selectProductImage: (img) => this.selectProductImage(img),
      retryLoadProduct: () => this.loadProductDetails(this.state.currentProductId),
      openProduct: (id) => this.openProduct(id),
      loadProductDetails: (id) => this.loadProductDetails(id),
      
      currentProductTitle: (this.state.currentProduct && (this.state.currentProduct.title || this.state.currentProduct.name)) || 'Apple MacBook Air 13” M2',
      currentProductBrand: (this.state.currentProduct && this.state.currentProduct.brand) || ((this.state.currentProduct && this.state.currentProduct.title) ? String(this.state.currentProduct.title).trim().split(' ')[0] : '') || 'LOUMOO',
      currentProductCategoryLabel: (this.state.currentProduct && (this.state.currentProduct.categoryLabel || this.state.currentProduct.category)) || 'Smartphones & Electronics',
      currentProductConditionLabel: (this.state.currentProduct && this.state.currentProduct.conditionLabel) || 'Brand New · Sealed Box',
      currentProductFulfillmentLabel: (this.state.currentProduct && this.state.currentProduct.fulfillmentLabel) || 'Same-Day Express Courier',
      currentProductBadge: (this.state.currentProduct && this.state.currentProduct.badge) || 'VERIFIED BOUTIQUE',
      currentProductRating: (this.state.currentProduct && this.state.currentProduct.rating != null) ? Number(this.state.currentProduct.rating).toFixed(1) : '5.0',
      // Backend detail objects expose `reviewCount` (singular); catalog list
      // items expose `reviewsCount` (plural). Accept either, then add the
      // buyer's own locally-submitted reviews so the count stays truthful.
      currentProductReviewCount: ((this.state.currentProduct && (this.state.currentProduct.reviewCount ?? this.state.currentProduct.reviewsCount)) || 0) + (this.state.reviews || []).filter((r) => r.productId === this.state.currentProductId).length,
      currentProductHasReviews: (((this.state.currentProduct && (this.state.currentProduct.reviewCount ?? this.state.currentProduct.reviewsCount)) || 0) + (this.state.reviews || []).filter((r) => r.productId === this.state.currentProductId).length) > 0,
      currentProductSoldCount: (this.state.currentProduct && this.state.currentProduct.soldCount) || 0,
      currentProductHasSold: ((this.state.currentProduct && this.state.currentProduct.soldCount) || 0) > 0,
      currentProductPrice: (() => {
        const p = this.state.currentProduct;
        if (!p) return 'XAF 745 000';
        const rawP = p.priceFormatted || p.price || '';
        const rawSale = p.salePrice || '';
        if (rawSale && rawP && rawSale !== rawP) {
          const n1 = parseInt(String(rawP).replace(/[^0-9]/g, ''), 10) || 0;
          const n2 = parseInt(String(rawSale).replace(/[^0-9]/g, ''), 10) || 0;
          if (n1 > 0 && n2 > 0 && n1 !== n2) {
            return n1 < n2 ? rawP : rawSale;
          }
        }
        return rawP || rawSale || 'XAF 745 000';
      })(),
      currentProductSalePrice: (() => {
        const p = this.state.currentProduct;
        if (!p) return '';
        const rawP = p.priceFormatted || p.price || '';
        const rawSale = p.salePrice || '';
        if (rawSale && rawP && rawSale !== rawP) {
          const n1 = parseInt(String(rawP).replace(/[^0-9]/g, ''), 10) || 0;
          const n2 = parseInt(String(rawSale).replace(/[^0-9]/g, ''), 10) || 0;
          if (n1 > 0 && n2 > 0 && n1 !== n2) {
            return n1 < n2 ? rawSale : rawP;
          }
        }
        return '';
      })(),
      currentProductImages: (this.state.currentProduct && (this.state.currentProduct.images || (this.state.currentProduct.media && this.state.currentProduct.media.map(m => m.url)))) || [
        './Assets/telephone&PC/Macbook.jfif',
        './Assets/telephone&PC/Top%20MacBook%20&%20Laptop%20Aesthetic%20Ideas%202026%20%E2%9C%A8%20Cute%20Desk%20Setup,%20Productivity%20&%20Tech%20Inspiration.jfif',
        './Assets/telephone&PC/Microsoft%20Surface%20Laptop_%20Overview.jfif'
      ],
      currentProductAttributesList: (this.state.currentProduct && this.state.currentProduct.attributes) || [],
      currentProductDescription: (this.state.currentProduct && (this.state.currentProduct.description || this.state.currentProduct.shortDescription)) || '',
      productStoreName: (this.state.currentProduct && this.state.currentProduct.storeName) || 'Orca Electronics Douala',
      productStoreCity: (this.state.currentProduct && this.state.currentProduct.storeCity) || 'Douala, Akwa',
      productStoreRating: (this.state.currentProduct && this.state.currentProduct.storeRating) || '4.9',
      productStoreVerified: (this.state.currentProduct && this.state.currentProduct.storeVerified !== undefined) ? this.state.currentProduct.storeVerified : true,

      // ── Video Modal Player State & Actions ──
      hasActiveVideoModal: Boolean(this.state.activeVideoModal),
      videoModalTitle: this.state.activeVideoModal ? this.state.activeVideoModal.title : '',
      videoModalSubtitle: this.state.activeVideoModal ? this.state.activeVideoModal.subtitle : '',
      videoModalTag: this.state.activeVideoModal ? this.state.activeVideoModal.tag : '',
      videoModalUrl: this.state.activeVideoModal ? this.state.activeVideoModal.url || './Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2010%20Aesthetic%20holiday%20table%20setting%20ideas%20that%20bring%20together%20comfort%20beauty%20and%20useful%20ideas%20you%20will%20actually%20try%20for%20people%20w.mp4' : '',
      openVideoModal: (title, subtitle, tag, url) => {
        this.setState({ activeVideoModal: { title: title || 'Insta360 Cinematic Action', subtitle: subtitle || 'Shot on Insta360 X4 in 8K 360°', tag: tag || 'INSTA360 8K', url: url || './Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2010%20Aesthetic%20holiday%20table%20setting%20ideas%20that%20bring%20together%20comfort%20beauty%20and%20useful%20ideas%20you%20will%20actually%20try%20for%20people%20w.mp4' } });
      },
      closeVideoModal: () => this.setState({ activeVideoModal: null }),
      quickExploreInsta360: () => {
        const prodId = (this.state.activeVideoModal && this.state.activeVideoModal.tag && this.state.activeVideoModal.tag.includes('ACE')) ? 'insta360_x4' : 'insta360_x4';
        this.setState({ activeVideoModal: null });
        this.openProduct(prodId);
        this.toast('Viewing Insta360 X4 Flagship Edition');
      },
      nextInstaVideoSlide: () => {
        try {
          const sc = document.getElementById('instaVideoBentoRail') || document.getElementById('instaVideoBentoRail2');
          if (sc) sc.scrollBy({ left: 300, behavior: 'smooth' });
        } catch (_) {}
        this.toast('Viewing more Insta360 creator clips');
      },
      prevInstaVideoSlide: () => {
        try {
          const sc = document.getElementById('instaVideoBentoRail') || document.getElementById('instaVideoBentoRail2');
          if (sc) sc.scrollBy({ left: -300, behavior: 'smooth' });
        } catch (_) {}
      },
      scrollRail: (railId, offset) => {
        try {
          const sc = document.getElementById(railId);
          if (sc) sc.scrollBy({ left: offset, behavior: 'smooth' });
        } catch (_) {}
      },

      // ── SuperAdmin Dashboard View Props ──
      adminActiveTab: this.state.adminActiveTab || 'overview',
      adminTabIsOverview: (this.state.adminActiveTab || 'overview') === 'overview',
      adminTabIsStores: this.state.adminActiveTab === 'stores',
      adminTabIsListings: this.state.adminActiveTab === 'listings',
      adminTabIsUsers: this.state.adminActiveTab === 'users',
      adminTabIsOrders: this.state.adminActiveTab === 'orders',
      adminTabIsSettings: this.state.adminActiveTab === 'settings',
      adminTabIsAudit: this.state.adminActiveTab === 'audit',
      adminStats: this.state.adminStats || {
        gmvFormatted: '14 850 000 XAF',
        escrowInFlightFormatted: '2 340 000 XAF',
        totalOrders: 86,
        activeStores: 18,
        pendingKycCount: 3,
        disputeCount: 2
      },
      adminStoresList: this.state.adminStoresList || [],
      filteredAdminStoresList: (() => {
        const list = this.state.adminStoresList || [];
        const f = this.state.adminStoreFilter;
        if (!f || f === 'ALL') return list;
        return list.filter(s => s.status === f);
      })(),
      adminStoreFilter: this.state.adminStoreFilter || 'ALL',
      adminListingsList: this.state.adminListingsList || [],
      adminUsersList: this.state.adminUsersList || [],
      adminOrdersList: this.state.adminOrdersList || [],
      adminSettings: this.state.adminSettings || {
        platform_commission_rate: { rate_percent: 5.0 },
        seller_whatsapp_default: { number: '237690123456' },
        maintenance_mode: { enabled: false },
        announcement_banner: { enabled: true, text_fr: "Livraison express offerte dès 50 000 XAF d'achats sur LOUMOO !" }
      },
      adminAuditLogsList: this.state.adminAuditLogsList || [],
      adminSettingsSaveSuccess: Boolean(this.state.adminSettingsSaveSuccess)
})
