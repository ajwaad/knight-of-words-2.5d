/**
 * Hallownest Battle & Year 3 KSSR Question Flow Controller
 * Real-time combat triggers, interactive arena clashes, and formative assessment.
 */

class BattleManager {
  constructor() {
    this.game25d = null;
    this.questions = [];
    this.currentQuestion = null;
    this.selectedAction = 'slash';

    // Player State
    this.playerMaxMasks = 5;
    this.playerMasks = 5;
    this.playerSoul = 33;
    this.playerGeo = 0;
    this.streak = 0;

    // Assessment Tracking (Formative PBS Data)
    this.assessment = {
      totalAnswered: 0,
      totalCorrect: 0,
      unitsAttempted: {},
      standardMastery: {}
    };

    // Stage & Chamber Data
    this.currentChamberIndex = 0;
    this.chambers = [
      {
        index: 0,
        title: 'Chamber 1: Forgotten Hive',
        enemyName: 'Hiveling Swarm',
        enemyType: 'hiveling',
        maxHp: 60,
        hp: 60,
        scale: 1.05,
        lightColor: 0xf59e0b,
        units: [1, 2],
        rewardGeo: 40
      },
      {
        index: 1,
        title: 'Chamber 2: Greenpath Outpost',
        enemyName: 'Mantis Scout',
        enemyType: 'mantis',
        maxHp: 90,
        hp: 90,
        scale: 1.1,
        lightColor: 0x10b981,
        units: [3, 4],
        rewardGeo: 55
      },
      {
        index: 2,
        title: 'Chamber 3: Royal Dung Caverns',
        enemyName: 'Dung Defender',
        enemyType: 'dung_defender',
        maxHp: 120,
        hp: 120,
        scale: 1.15,
        lightColor: 0xb45309,
        units: [5, 6],
        rewardGeo: 80
      },
      {
        index: 3,
        title: 'Chamber 4: City of Tears',
        enemyName: 'Hornet (Protector)',
        enemyType: 'hornet',
        maxHp: 160,
        hp: 160,
        scale: 1.12,
        lightColor: 0x00d4ff,
        units: [7, 8],
        rewardGeo: 110
      },
      {
        index: 4,
        title: 'Chamber 5: Troupe Master\'s Tent',
        enemyName: 'Troupe Master Grimm',
        enemyType: 'grimm',
        maxHp: 200,
        hp: 200,
        scale: 1.15,
        lightColor: 0xef4444,
        units: [9, 10],
        rewardGeo: 160
      }
    ];

    this.activeEnemy = null;
    this.isInputLocked = false;
    this.chamberCleared = false;
  }

  async init(game25dInstance) {
    this.game25d = game25dInstance;

    if (window.INLINE_QUESTIONS && Array.isArray(window.INLINE_QUESTIONS)) {
      this.questions = window.INLINE_QUESTIONS;
    } else {
      try {
        const resp = await fetch('data/questions.json');
        this.questions = await resp.json();
      } catch (err) {
        console.warn('Using fallback questions', err);
        this.questions = this.getFallbackQuestions();
      }
    }

    this.bindEvents();
    this.startChamber(0);
    this.updateHUD();
  }

  isTrialModalOpen() {
    const modal = document.getElementById('question-modal');
    return modal && modal.classList.contains('visible');
  }

  bindEvents() {
    // Action Bar Buttons
    document.getElementById('action-slash')?.addEventListener('click', () => this.selectAction('slash'));
    document.getElementById('action-spell')?.addEventListener('click', () => this.selectAction('spell'));
    document.getElementById('action-heal')?.addEventListener('click', () => this.selectAction('heal'));
    document.getElementById('action-great-slash')?.addEventListener('click', () => this.selectAction('great_slash'));

    // Chamber Quick-Select Buttons
    document.querySelectorAll('.chamber-jump-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-chamber') || '0', 10);
        document.getElementById('question-modal')?.classList.remove('visible');
        document.getElementById('chamber-clear-modal')?.classList.remove('visible');
        document.getElementById('game-over-modal')?.classList.remove('visible');
        document.getElementById('game-complete-modal')?.classList.remove('visible');
        this.isInputLocked = false;
        this.startChamber(idx);
      });
    });

    // Audio Mute Toggle
    const muteBtn = document.getElementById('btn-mute-audio');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        window.soundEngine.isMuted = !window.soundEngine.isMuted;
        if (window.soundEngine.isMuted) {
          window.soundEngine.stopAmbient();
          muteBtn.textContent = '🔇 Muted';
        } else {
          window.soundEngine.startAmbient();
          muteBtn.textContent = '🔊 Audio';
        }
      });
    }

    // Question Modal hotkeys & Escape to close
    window.addEventListener('keydown', (e) => {
      if (this.isInputLocked) return;

      if (this.isTrialModalOpen()) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const idx = parseInt(e.key, 10) - 1;
          const btns = document.querySelectorAll('.option-btn');
          if (btns[idx] && !btns[idx].disabled) {
            this.handleAnswer(idx);
          }
        } else if (e.key === 'Escape') {
          document.getElementById('question-modal')?.classList.remove('visible');
        }
      }
    });

    // Cancel Question Modal Button
    document.getElementById('btn-cancel-trial')?.addEventListener('click', () => {
      if (!this.isInputLocked) {
        document.getElementById('question-modal')?.classList.remove('visible');
      }
    });

    // Clue Drawer Toggle
    document.getElementById('clue-toggle-btn')?.addEventListener('click', () => {
      document.getElementById('clue-drawer')?.classList.toggle('open');
    });

    // Next Chamber Button
    document.getElementById('btn-next-chamber')?.addEventListener('click', () => {
      document.getElementById('chamber-clear-modal')?.classList.remove('visible');
      this.startChamber(this.currentChamberIndex + 1);
    });

    // Retry Chamber Button
    document.getElementById('btn-retry-chamber')?.addEventListener('click', () => {
      document.getElementById('game-over-modal')?.classList.remove('visible');
      this.playerMasks = this.playerMaxMasks;
      this.playerSoul = 33;
      this.startChamber(this.currentChamberIndex);
    });

    // Game Complete Modal Buttons
    document.getElementById('btn-restart-game')?.addEventListener('click', () => {
      document.getElementById('game-complete-modal')?.classList.remove('visible');
      this.playerMasks = this.playerMaxMasks;
      this.playerSoul = 33;
      this.streak = 0;
      this.startChamber(0);
    });
    document.getElementById('btn-complete-pbs')?.addEventListener('click', () => {
      document.getElementById('game-complete-modal')?.classList.remove('visible');
      this.showAssessmentReport();
    });

    // Assessment Report Modal
    document.getElementById('btn-view-assessment')?.addEventListener('click', () => {
      this.showAssessmentReport();
    });
    document.getElementById('btn-close-assessment')?.addEventListener('click', () => {
      document.getElementById('assessment-modal')?.classList.remove('visible');
    });
  }

  startChamber(index) {
    if (index >= this.chambers.length) {
      this.showGameComplete();
      return;
    }

    this.currentChamberIndex = index;
    const chamber = this.chambers[index];
    this.activeEnemy = { ...chamber, hp: chamber.maxHp };
    this.chamberCleared = false;

    this.game25d.setChamberStage(index, chamber.enemyType);
    this.game25d.setEnemyData(this.activeEnemy);

    document.getElementById('chamber-badge').textContent = `CHAMBER ${index + 1} OF 5 • GEO: ${this.playerGeo}`;
    document.getElementById('chamber-title').textContent = chamber.title.toUpperCase();
    document.getElementById('enemy-name').textContent = chamber.enemyName;

    document.querySelectorAll('.chamber-jump-btn').forEach((btn) => {
      const bIdx = parseInt(btn.getAttribute('data-chamber') || '0', 10);
      btn.classList.toggle('active', bIdx === index);
    });

    this.updateHUD();
  }

  selectAction(actionType) {
    if (this.isInputLocked || this.chamberCleared) return;

    if (actionType === 'spell' && this.playerSoul < 33) {
      window.soundEngine.playWrong();
      this.showFloatingText('NEED 33 SOUL!', this.game25d.player.pos, 'dmg');
      return;
    }
    if (actionType === 'heal' && this.playerSoul < 33) {
      window.soundEngine.playWrong();
      this.showFloatingText('NEED 33 SOUL!', this.game25d.player.pos, 'dmg');
      return;
    }
    if (actionType === 'heal' && this.playerMasks >= this.playerMaxMasks) {
      window.soundEngine.playWrong();
      this.showFloatingText('MASKS FULL!', this.game25d.player.pos, 'heal');
      return;
    }
    if (actionType === 'great_slash' && this.streak < 2) {
      window.soundEngine.playWrong();
      this.showFloatingText('REQUIRES 2-STREAK!', this.game25d.player.pos, 'dmg');
      return;
    }

    this.selectedAction = actionType;
    this.presentQuestion();
  }

  presentQuestion() {
    const chamber = this.chambers[this.currentChamberIndex];
    const unitList = chamber.units;

    const eligible = this.questions.filter(q => unitList.includes(q.unit));
    const pool = eligible.length > 0 ? eligible : this.questions;

    const qIndex = Math.floor(Math.random() * pool.length);
    this.currentQuestion = pool[qIndex];

    const modal = document.getElementById('question-modal');
    const badge = document.getElementById('modal-standard-pill');
    const actionTag = document.getElementById('modal-action-tag');
    const promptText = document.getElementById('question-text');
    const optionsGrid = document.getElementById('options-grid');
    const clueText = document.getElementById('clue-text');
    const clueDrawer = document.getElementById('clue-drawer');
    const feedbackBanner = document.getElementById('modal-feedback-banner');

    if (!modal) return;

    if (clueDrawer) clueDrawer.classList.remove('open');
    if (feedbackBanner) {
      feedbackBanner.className = 'modal-feedback-banner';
      feedbackBanner.style.display = 'none';
      feedbackBanner.textContent = '';
    }

    const actionLabels = {
      'slash': '⚔️ NAIL SLASH (25 DMG)',
      'spell': '✨ VENGEFUL SPIRIT (50 DMG)',
      'heal': '🤍 FOCUS HEAL (+1 MASK)',
      'great_slash': '⚡ GREAT SLASH (70 DMG)',
      'altar': '📜 LORE ALTAR (+50 SOUL & +1 MASK)'
    };
    if (actionTag) actionTag.textContent = actionLabels[this.selectedAction] || 'TRIAL';
    if (badge) badge.textContent = `DSKP ${this.currentQuestion.dskp || '2.1.5'} • UNIT ${this.currentQuestion.unit || 1}`;

    const formattedPrompt = this.currentQuestion.question.replace('___', '<span class="question-blank-highlight">_____</span>');
    if (promptText) promptText.innerHTML = formattedPrompt;

    if (clueText) clueText.textContent = this.currentQuestion.clue || 'Analyze the sentence context!';

    if (optionsGrid) {
      optionsGrid.innerHTML = '';
      this.currentQuestion.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `
          <span class="option-key">${idx + 1}</span>
          <span class="option-label">${opt}</span>
        `;
        btn.addEventListener('click', () => this.handleAnswer(idx));
        optionsGrid.appendChild(btn);
      });
    }

    modal.classList.add('visible');
  }

  handleAnswer(selectedIdx) {
    if (this.isInputLocked) return;
    this.isInputLocked = true;

    const modal = document.getElementById('question-modal');
    const btns = document.querySelectorAll('.option-btn');
    const feedbackBanner = document.getElementById('modal-feedback-banner');
    const isCorrect = selectedIdx === this.currentQuestion.answer;

    btns.forEach(b => b.disabled = true);

    this.assessment.totalAnswered++;
    const unitKey = `Unit ${this.currentQuestion.unit}`;
    this.assessment.unitsAttempted[unitKey] = (this.assessment.unitsAttempted[unitKey] || 0) + 1;

    if (isCorrect) {
      this.assessment.totalCorrect++;
      this.streak++;
      this.assessment.standardMastery[this.currentQuestion.dskp] = true;

      window.soundEngine.playCorrect();
      if (btns[selectedIdx]) btns[selectedIdx].classList.add('correct');

      if (feedbackBanner) {
        feedbackBanner.className = 'modal-feedback-banner correct';
        feedbackBanner.style.display = 'block';
        feedbackBanner.innerHTML = `<strong>EXCELLENT!</strong> ${this.currentQuestion.explanation}`;
      }

      setTimeout(() => {
        modal.classList.remove('visible');
        this.executePlayerSuccessAction();
      }, 950);

    } else {
      this.streak = 0;
      window.soundEngine.playWrong();

      if (btns[selectedIdx]) btns[selectedIdx].classList.add('wrong');
      if (btns[this.currentQuestion.answer]) btns[this.currentQuestion.answer].classList.add('correct');

      if (feedbackBanner) {
        feedbackBanner.className = 'modal-feedback-banner wrong';
        feedbackBanner.style.display = 'block';
        feedbackBanner.innerHTML = `<strong>LEARNING MOMENT:</strong> The correct answer is <em>"${this.currentQuestion.options[this.currentQuestion.answer]}"</em>. ${this.currentQuestion.explanation}`;
      }

      setTimeout(() => {
        modal.classList.remove('visible');
        this.executePlayerFailureAction();
      }, 1600);
    }
  }

  executePlayerSuccessAction() {
    if (this.selectedAction === 'slash') {
      window.soundEngine.playSlash();
      this.game25d.triggerKnightNailSlash(() => {
        window.soundEngine.playHit();
        const baseDmg = 25;
        const streakBonus = Math.min(this.streak * 5, 20);
        const totalDmg = baseDmg + streakBonus;

        this.playerSoul = Math.min(100, this.playerSoul + 25);
        this.applyDamageToEnemy(totalDmg);
      }, false);

    } else if (this.selectedAction === 'spell') {
      this.playerSoul = Math.max(0, this.playerSoul - 33);
      window.soundEngine.playSpellCast();
      this.game25d.triggerKnightSpellCast(() => {
        window.soundEngine.playHit();
        this.applyDamageToEnemy(50);
      });

    } else if (this.selectedAction === 'heal') {
      this.playerSoul = Math.max(0, this.playerSoul - 33);
      this.playerMasks = Math.min(this.playerMaxMasks, this.playerMasks + 1);
      window.soundEngine.playFocusHeal();
      this.showFloatingText('+1 MASK!', this.game25d.player.pos, 'heal');
      this.updateHUD();

      this.game25d.triggerKnightFocusHeal(() => {
        this.isInputLocked = false;
      });

    } else if (this.selectedAction === 'altar') {
      this.playerSoul = Math.min(100, this.playerSoul + 50);
      this.playerMasks = Math.min(this.playerMaxMasks, this.playerMasks + 1);
      window.soundEngine.playFocusHeal();
      this.showFloatingText('RADIANT TRUTH! +50 SOUL & +1 MASK', this.game25d.player.pos, 'heal');
      this.updateHUD();
      this.game25d.triggerKnightFocusHeal(() => {
        this.isInputLocked = false;
      });
    } else if (this.selectedAction === 'great_slash') {
      window.soundEngine.playSlash();
      this.game25d.triggerKnightNailSlash(() => {
        window.soundEngine.playHit();
        this.playerSoul = Math.min(100, this.playerSoul + 15);
        this.applyDamageToEnemy(70);
      }, true);
    }

    this.updateHUD();
  }

  executePlayerFailureAction() {
    window.soundEngine.playParry();
    this.game25d.triggerEnemyCounterAttack(() => {
      window.soundEngine.playMaskLost();
      this.playerMasks = Math.max(0, this.playerMasks - 1);
      this.showFloatingText('-1 MASK', this.game25d.player.pos, 'dmg');
      this.updateHUD();

      if (this.playerMasks <= 0) {
        this.showGameOver();
      } else {
        this.isInputLocked = false;
      }
    });
  }


  onQuickHitEnemy(dmg = 8) {
    if (!this.activeEnemy || this.chamberCleared || this.isInputLocked) return;
    this.playerSoul = Math.min(100, this.playerSoul + 12);
    this.activeEnemy.hp = Math.max(0, this.activeEnemy.hp - dmg);
    this.showFloatingText(`-${dmg} DMG (+12 SOUL)`, this.game25d.enemyMesh.position, 'dmg');
    this.updateHUD();

    this.game25d.bossAI.staggerHits = (this.game25d.bossAI.staggerHits || 0) + 1;
    if (this.activeEnemy.hp <= 0) {
      this.handleChamberVictory();
      return;
    }
    if (this.game25d.bossAI.staggerHits >= this.game25d.bossAI.hitsToStagger) {
      this.game25d.bossAI.staggerHits = 0;
      this.showFloatingText('BOSS STAGGERED! WORD TRIAL!', this.game25d.enemyMesh.position, 'crit');
      setTimeout(() => {
        if (!this.chamberCleared && !this.isTrialModalOpen()) {
          this.selectedAction = 'slash';
          this.presentQuestion();
        }
      }, 320);
    }
  }

  triggerAltarTrial() {
    if (this.isInputLocked || this.chamberCleared || this.isTrialModalOpen()) return;
    this.selectedAction = 'altar';
    this.presentQuestion();
  }

  onPlayerHitByBoss() {
    if (this.chamberCleared || this.isTrialModalOpen()) return;
    window.soundEngine.playMaskLost();
    this.playerMasks = Math.max(0, this.playerMasks - 1);
    this.showFloatingText('-1 MASK!', this.game25d.player.pos, 'dmg');
    this.updateHUD();
    if (this.playerMasks <= 0) {
      this.showGameOver();
    }
  }

  applyDamageToEnemy(dmg) {
    this.activeEnemy.hp = Math.max(0, this.activeEnemy.hp - dmg);
    this.showFloatingText(`-${dmg} DMG`, this.game25d.enemyMesh.position, dmg >= 50 ? 'crit' : 'dmg');
    this.updateHUD();

    this.game25d.triggerEnemyHurt(() => {
      if (this.activeEnemy.hp <= 0) {
        this.handleChamberVictory();
      } else {
        this.isInputLocked = false;
      }
    });
  }

  handleChamberVictory() {
    this.chamberCleared = true;
    window.soundEngine.playVictory();
    this.playerGeo += this.activeEnemy.rewardGeo || 50;
    this.updateHUD();

    if (this.currentChamberIndex >= this.chambers.length - 1) {
      this.showGameComplete();
      this.isInputLocked = false;
      return;
    }

    const modal = document.getElementById('chamber-clear-modal');
    const title = document.getElementById('clear-modal-title');
    const desc = document.getElementById('clear-modal-desc');
    const geoText = document.getElementById('clear-geo-reward');

    if (title) title.textContent = `${this.activeEnemy.enemyName.toUpperCase()} DEFEATED!`;
    if (desc) desc.textContent = `Outstanding performance! Your command of Year 3 English opened the chamber passage.`;
    if (geoText) geoText.textContent = `+${this.activeEnemy.rewardGeo} GEO`;

    if (modal) modal.classList.add('visible');
    this.isInputLocked = false;
  }

  showGameOver() {
    window.soundEngine.playMaskLost();
    const modal = document.getElementById('game-over-modal');
    if (modal) modal.classList.add('visible');
    this.isInputLocked = false;
  }

  showGameComplete() {
    window.soundEngine.playVictory();
    const modal = document.getElementById('game-complete-modal');
    const geoEl = document.getElementById('complete-total-geo');
    const accEl = document.getElementById('complete-accuracy');
    const total = this.assessment.totalAnswered;
    const correct = this.assessment.totalCorrect;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 100;

    if (geoEl) geoEl.textContent = `${this.playerGeo} GEO`;
    if (accEl) accEl.textContent = `${pct}%`;
    if (modal) {
      modal.classList.add('visible');
    } else {
      this.showAssessmentReport();
    }
  }

  showAssessmentReport() {
    const modal = document.getElementById('assessment-modal');
    const totalAns = document.getElementById('stat-total-ans');
    const accPct = document.getElementById('stat-accuracy-pct');
    const dskpCount = document.getElementById('stat-dskp-mastered');
    const unitList = document.getElementById('assessment-units-list');

    if (!modal) return;

    const total = this.assessment.totalAnswered;
    const correct = this.assessment.totalCorrect;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const masteredCount = Object.keys(this.assessment.standardMastery).length;

    if (totalAns) totalAns.textContent = total;
    if (accPct) accPct.textContent = `${pct}%`;
    if (dskpCount) dskpCount.textContent = masteredCount;

    if (unitList) {
      unitList.innerHTML = '';
      for (let u = 1; u <= 10; u++) {
        const key = `Unit ${u}`;
        const attempts = this.assessment.unitsAttempted[key] || 0;
        const item = document.createElement('div');
        item.style.padding = '8px 12px';
        item.style.borderBottom = '1px solid rgba(255,255,255,0.08)';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.innerHTML = `
          <span>Unit ${u}: ${this.getUnitTitle(u)}</span>
          <span style="color: ${attempts > 0 ? '#34d399' : '#94a3b8'}">${attempts} Practiced</span>
        `;
        unitList.appendChild(item);
      }
    }

    modal.classList.add('visible');
  }

  getUnitTitle(u) {
    const titles = {
      1: 'Welcome!', 2: 'Everyday Routines', 3: 'Right Now', 4: 'Year In, Year Out',
      5: 'My New House', 6: 'Food, Please!', 7: 'Out and About',
      8: 'Where Were You Yesterday?', 9: 'On Holiday', 10: 'The World Around Us'
    };
    return titles[u] || '';
  }

  updateHUD() {
    // Health Masks
    const maskRow = document.getElementById('masks-row');
    if (maskRow) {
      maskRow.innerHTML = '';
      const fullPath = 'assets/Inventory & UI/select_game_HUD_0001_health.png';
      const emptyPath = 'assets/Inventory & UI/select_game_HUD_0001_health_steel.png';
      const fullSrc = (this.game25d && this.game25d.resolveAssetUrl) ? this.game25d.resolveAssetUrl(fullPath) : fullPath;
      const emptySrc = (this.game25d && this.game25d.resolveAssetUrl) ? this.game25d.resolveAssetUrl(emptyPath) : emptyPath;
      for (let i = 0; i < this.playerMaxMasks; i++) {
        const img = document.createElement('img');
        img.className = 'mask-icon';
        img.alt = i < this.playerMasks ? 'Full Mask' : 'Empty Mask';
        const targetPath = i < this.playerMasks ? fullPath : emptyPath;
        img.onerror = () => {
          if (window.FALLBACK_DATA_URIS && window.FALLBACK_DATA_URIS[targetPath] && img.src !== window.FALLBACK_DATA_URIS[targetPath]) {
            img.src = window.FALLBACK_DATA_URIS[targetPath];
          }
        };
        if (i < this.playerMasks) {
          img.src = fullSrc;
        } else {
          img.src = emptySrc;
          img.classList.add('lost');
        }
        maskRow.appendChild(img);
      }
    }

    // Streak & Geo Badge
    const chamberBadge = document.getElementById('chamber-badge');
    if (chamberBadge) {
      chamberBadge.textContent = `CHAMBER ${this.currentChamberIndex + 1} OF 5 • STREAK: ${this.streak}🔥 • ${this.playerGeo} GEO`;
    }

    // Soul Meter
    const soulFill = document.getElementById('soul-fill-liquid');
    const soulVal = document.getElementById('soul-val-text');
    if (soulFill) soulFill.style.height = `${this.playerSoul}%`;
    if (soulVal) soulVal.textContent = `${this.playerSoul}`;

    // Enemy HP
    if (this.activeEnemy) {
      const hpFill = document.getElementById('enemy-hp-fill');
      const hpText = document.getElementById('enemy-hp-text');
      const pct = Math.max(0, Math.min(100, (this.activeEnemy.hp / this.activeEnemy.maxHp) * 100));

      if (hpFill) hpFill.style.width = `${pct}%`;
      if (hpText) hpText.textContent = `${this.activeEnemy.hp} / ${this.activeEnemy.maxHp}`;
    }

    // Buttons
    const btnSpell = document.getElementById('action-spell');
    const btnHeal = document.getElementById('action-heal');
    const btnGreatSlash = document.getElementById('action-great-slash');

    if (btnSpell) btnSpell.disabled = (this.playerSoul < 33);
    if (btnHeal) btnHeal.disabled = (this.playerSoul < 33 || this.playerMasks >= this.playerMaxMasks);
    if (btnGreatSlash) btnGreatSlash.disabled = (this.streak < 2);
  }

  showFloatingText(text, pos3d, type = 'dmg') {
    const el = document.createElement('div');
    el.className = `combat-floating-number ${type}`;
    el.textContent = text;

    if (this.game25d && this.game25d.camera) {
      const v = pos3d.clone();
      v.y += 1.4;
      v.project(this.game25d.camera);

      const x = (v.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-(v.y * 0.5) + 0.5) * window.innerHeight;

      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    } else {
      el.style.left = '50vw';
      el.style.top = '45vh';
    }

    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }

  getFallbackQuestions() {
    return [
      {
        id: 'fallback_1', unit: 1, unit_title: 'Welcome!', tier: 1, dskp: '2.1.5',
        question: 'Look at Amin. He ___ short curly hair.',
        options: ['has got', 'have got', 'is got', 'are having'],
        answer: 0,
        clue: 'Use has got with he/she.',
        explanation: 'We use has got with singular subjects.'
      }
    ];
  }
}

window.battleManager = new BattleManager();
