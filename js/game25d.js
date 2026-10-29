/**
 * Hallownest 2.5D Engine (Three.js WebGL)
 * Real Multi-Frame Sprite Animator, 2.5D Platformer Physics, Dynamic Combat Juice.
 */

class SpriteAnimator {
  constructor(mesh, animations, defaultAnim = 'idle') {
    this.mesh = mesh;
    this.animations = animations; // { animName: { frames: [tex...], fps: 12, loop: true } }
    this.currentAnim = null;
    this.frameIndex = 0;
    this.timer = 0;
    this.isPlaying = true;
    this.onComplete = null;
    if (defaultAnim && this.animations[defaultAnim]) {
      this.play(defaultAnim);
    }
  }

  play(animName, onComplete = null, forceRestart = false) {
    if (this.currentAnim === animName && !forceRestart) return;
    if (!this.animations[animName]) return;

    this.currentAnim = animName;
    this.frameIndex = 0;
    this.timer = 0;
    this.onComplete = onComplete;
    this.updateTexture();
  }

  update(delta) {
    if (!this.isPlaying || !this.currentAnim) return;
    const anim = this.animations[this.currentAnim];
    if (!anim || !anim.frames || anim.frames.length === 0) return;

    this.timer += delta;
    const interval = 1 / (anim.fps || 12);

    if (this.timer >= interval) {
      this.timer -= interval;
      this.frameIndex++;

      if (this.frameIndex >= anim.frames.length) {
        if (anim.loop) {
          this.frameIndex = 0;
        } else {
          this.frameIndex = anim.frames.length - 1;
          const cb = this.onComplete;
          this.onComplete = null;
          if (cb) cb();
          return;
        }
      }
      this.updateTexture();
    }
  }

  updateTexture() {
    const anim = this.animations[this.currentAnim];
    if (anim && anim.frames[this.frameIndex]) {
      this.mesh.material.map = anim.frames[this.frameIndex];
      this.mesh.material.needsUpdate = true;
    }
  }
}

class Game25D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // Textures & Manifest
    this.textureLoader = new THREE.TextureLoader();
    this.textures = {};

    // Physics & Controls
    this.keys = {};
    this.player = {
      pos: new THREE.Vector3(-6.0, 1.6, 0),
      vel: new THREE.Vector3(0, 0, 0),
      isGrounded: true,
      facing: 1, // 1 for right, -1 for left
      speed: 8.5,
      jumpForce: 13.5,
      gravity: -34.0,
      isDashing: false,
      dashTimer: 0,
      state: 'idle' // 'idle', 'run', 'jump', 'attack', 'cast', 'hurt'
    };

    // Actors & Meshes
    this.knightMesh = null;
    this.knightAnimator = null;
    this.enemyMesh = null;
    this.enemyAnimator = null;
    this.slashMesh = null;
    this.slashAnimator = null;
    this.spellProjectile = null;

    // Environment Meshes
    this.bgMesh = null;
    this.midMesh = null;
    this.floorMesh = null;
    this.fgMesh = null;
    this.chamberGateMesh = null;

    // Lights
    this.knightLight = null;
    this.enemyLight = null;

    // Particles & Polish
    this.particleSystem = null;
    this.particlesData = [];
    this.shakeIntensity = 0;
    this.hitstopTimer = 0;

    // Preload & Init
    this.init();
  }

  async init() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. Scene & Fog
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x060810, 0.026);

    // 2. Camera: Angled 2.5D perspective
    this.camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    this.camera.position.set(0, 3.2, 15.5);
    this.camera.lookAt(0, 1.6, 0);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0x2d3748, 1.25);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xa5f3fc, 1.5);
    dirLight.position.set(2, 14, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    this.scene.add(dirLight);

    this.knightLight = new THREE.PointLight(0x00d4ff, 2.4, 10);
    this.scene.add(this.knightLight);

    this.enemyLight = new THREE.PointLight(0xff4444, 2.2, 10);
    this.scene.add(this.enemyLight);

    // 5. Build Stages & Preload Animations
    this.buildStage();
    await this.setupCharacterAnimations();
    this.buildVFX();
    this.buildParticleDust();

    // 6. Bind Keyboard Inputs
    this.bindControls();
    window.addEventListener('resize', () => this.onResize());

    // 7. Start Render Loop
    this.animate();
  }

  loadTexture(path) {
    if (!this.textures[path]) {
      this.textures[path] = this.textureLoader.load(path, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
      });
    }
    return this.textures[path];
  }

  loadTextureArray(paths) {
    return paths.map(p => this.loadTexture(p));
  }

  buildStage() {
    // A. 3D Floor
    const floorGeo = new THREE.PlaneGeometry(36, 12);
    const floorTex = this.loadTexture('assets/bg/Nailmaster_03__0001_Floor.png');
    floorTex.wrapS = THREE.RepeatWrapping;
    floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(5, 2);

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.65,
      metalness: 0.2,
      color: 0x8892b0
    });
    this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.position.set(0, 0, 0);
    this.floorMesh.receiveShadow = true;
    this.scene.add(this.floorMesh);

    // B. Deep Background
    const bgGeo = new THREE.PlaneGeometry(38, 18);
    const bgTex = this.loadTexture('assets/bg/nailmaster_03_0008_BG.png');
    const bgMat = new THREE.MeshBasicMaterial({ map: bgTex, transparent: true, color: 0x94a3b8 });
    this.bgMesh = new THREE.Mesh(bgGeo, bgMat);
    this.bgMesh.position.set(0, 4.2, -22);
    this.scene.add(this.bgMesh);

    // C. Midground Curtains
    const midGeo = new THREE.PlaneGeometry(28, 9);
    const midTex = this.loadTexture('assets/bg/nailmaster_03_0006_curtain_MID.png');
    const midMat = new THREE.MeshBasicMaterial({ map: midTex, transparent: true, opacity: 0.85, color: 0xa0aec0 });
    this.midMesh = new THREE.Mesh(midGeo, midMat);
    this.midMesh.position.set(0, 3.0, -8);
    this.scene.add(this.midMesh);

    // D. Foreground Frame
    const fgGeo = new THREE.PlaneGeometry(28, 13);
    const fgTex = this.loadTexture('assets/bg/nailmaster_03_0003_FG.png');
    const fgMat = new THREE.MeshBasicMaterial({ map: fgTex, transparent: true, opacity: 0.95 });
    this.fgMesh = new THREE.Mesh(fgGeo, fgMat);
    this.fgMesh.position.set(0, 2.5, 6.5);
    this.scene.add(this.fgMesh);

    // E. Chamber Gate (Far Right)
    const gateGeo = new THREE.PlaneGeometry(3.5, 5.5);
    const gateTex = this.loadTexture('assets/bg/Area_Art_Godshome.png');
    const gateMat = new THREE.MeshBasicMaterial({ map: gateTex, transparent: true, opacity: 0.85 });
    this.chamberGateMesh = new THREE.Mesh(gateGeo, gateMat);
    this.chamberGateMesh.position.set(13.0, 2.7, -0.5);
    this.scene.add(this.chamberGateMesh);
  }

  async setupCharacterAnimations() {
    // 1. The Knight Animations (Loaded from extracted multi-frame directories!)
    const knightIdleFrames = this.loadTextureArray([
      'assets/knight/idle/knight_idle_00.png',
      'assets/knight/idle/knight_idle_01.png',
      'assets/knight/idle/knight_idle_02.png',
      'assets/knight/idle/knight_idle_03.png'
    ]);

    const knightRunFrames = this.loadTextureArray([
      'assets/knight/run/knight_run_00.png',
      'assets/knight/run/knight_run_01.png',
      'assets/knight/run/knight_run_02.png',
      'assets/knight/run/knight_run_03.png',
      'assets/knight/run/knight_run_04.png',
      'assets/knight/run/knight_run_05.png',
      'assets/knight/run/knight_run_06.png'
    ]);

    const knightAttackFrames = this.loadTextureArray([
      'assets/knight/attack/knight_attack_00.png',
      'assets/knight/attack/knight_attack_01.png',
      'assets/knight/attack/knight_attack_02.png',
      'assets/knight/attack/knight_attack_03.png',
      'assets/knight/attack/knight_attack_04.png'
    ]);

    const knightJumpFrames = this.loadTextureArray([
      'assets/knight/jump/knight_jump_00.png',
      'assets/knight/jump/knight_jump_01.png',
      'assets/knight/jump/knight_jump_02.png',
      'assets/knight/jump/knight_jump_03.png',
      'assets/knight/jump/knight_jump_04.png'
    ]);

    const knightCastFrames = this.loadTextureArray([
      'assets/knight/cast/knight_cast_00.png',
      'assets/knight/cast/knight_cast_01.png',
      'assets/knight/cast/knight_cast_02.png',
      'assets/knight/cast/knight_cast_03.png',
      'assets/knight/cast/knight_cast_04.png'
    ]);

    const knightGeo = new THREE.PlaneGeometry(2.5, 2.5);
    const knightMat = new THREE.MeshStandardMaterial({
      map: knightIdleFrames[0],
      transparent: true,
      roughness: 0.5,
      metalness: 0.1,
      alphaTest: 0.05
    });
    this.knightMesh = new THREE.Mesh(knightGeo, knightMat);
    this.knightMesh.position.copy(this.player.pos);
    this.knightMesh.castShadow = true;
    this.scene.add(this.knightMesh);

    this.knightAnimator = new SpriteAnimator(this.knightMesh, {
      idle: { frames: knightIdleFrames, fps: 6, loop: true },
      run: { frames: knightRunFrames, fps: 14, loop: true },
      jump: { frames: knightJumpFrames, fps: 10, loop: false },
      attack: { frames: knightAttackFrames, fps: 18, loop: false },
      cast: { frames: knightCastFrames, fps: 16, loop: false },
      hurt: { frames: [this.loadTexture('assets/knight/hurt.png')], fps: 1, loop: false }
    }, 'idle');

    // 2. The Adversary Mesh & Animations
    const enemyGeo = new THREE.PlaneGeometry(3.5, 3.5);
    const enemyMat = new THREE.MeshStandardMaterial({
      map: knightIdleFrames[0],
      transparent: true,
      roughness: 0.5,
      metalness: 0.1,
      alphaTest: 0.05
    });
    this.enemyMesh = new THREE.Mesh(enemyGeo, enemyMat);
    this.enemyMesh.position.set(4.5, 1.8, 0);
    this.enemyMesh.castShadow = true;
    this.scene.add(this.enemyMesh);

    // Setup Enemy Animator placeholder (configured per chamber)
    this.setupEnemyAnimator('hornet');
  }

  setupEnemyAnimator(enemyType) {
    let animConfig = {};

    if (enemyType === 'hornet') {
      const idleFrames = this.loadTextureArray([
        'assets/bosses/hornet/idle/Hornet - idle0000.png',
        'assets/bosses/hornet/idle/Hornet - idle0001.png'
      ]);
      const jumpFrames = [];
      for (let i = 0; i <= 9; i++) {
        jumpFrames.push(this.loadTexture(`assets/bosses/hornet/jump/Hornet - jump000${i}.png`));
      }
      const attackFrames = [];
      for (let i = 0; i <= 7; i++) {
        attackFrames.push(this.loadTexture(`assets/bosses/hornet/attack/Hornet - throw_side000${i}.png`));
      }
      const landFrames = [];
      for (let i = 0; i <= 5; i++) {
        landFrames.push(this.loadTexture(`assets/bosses/hornet/land/Hornet - hard_land000${i}.png`));
      }

      animConfig = {
        idle: { frames: idleFrames, fps: 4, loop: true },
        jump: { frames: jumpFrames, fps: 12, loop: false },
        attack: { frames: attackFrames, fps: 16, loop: false },
        land: { frames: landFrames, fps: 12, loop: false }
      };

    } else if (enemyType === 'grimm') {
      const bowFrames = [];
      for (let i = 0; i <= 6; i++) {
        bowFrames.push(this.loadTexture(`assets/bosses/grimm/bow/GG_grimm_bow000${i}.png`));
      }
      const idleFrames = [];
      for (let i = 0; i <= 3; i++) {
        idleFrames.push(this.loadTexture(`assets/bosses/grimm/idle/Grimm_sleep_heartbeat000${i}.png`));
      }
      animConfig = {
        idle: { frames: idleFrames, fps: 6, loop: true },
        bow: { frames: bowFrames, fps: 10, loop: false },
        attack: { frames: bowFrames, fps: 14, loop: false }
      };

    } else if (enemyType === 'hiveling') {
      const flyFrames = [];
      for (let i = 0; i <= 4; i++) {
        flyFrames.push(this.loadTexture(`assets/enemies/hiveling/fly/Hiveling - fly000${i}.png`));
      }
      animConfig = {
        idle: { frames: flyFrames, fps: 15, loop: true },
        fly: { frames: flyFrames, fps: 15, loop: true },
        attack: { frames: flyFrames, fps: 20, loop: true }
      };

    } else {
      // Grimmkin / Ghost
      const floatFrames = [];
      for (let i = 0; i <= 7; i++) {
        floatFrames.push(this.loadTexture(`assets/enemies/grimmkin/float/Grimmkin Novice, Grimmkin Master, Grimmkin Nightmare, Troupe Master Grimm audience - Grimm_crowd000${i}.png`));
      }
      animConfig = {
        idle: { frames: floatFrames, fps: 12, loop: true },
        attack: { frames: floatFrames, fps: 16, loop: false }
      };
    }

    this.enemyAnimator = new SpriteAnimator(this.enemyMesh, animConfig, 'idle');
  }

  buildVFX() {
    // 1. Multi-Frame Radiance Slash Effect (11 animated frames!)
    const slashFrames = [];
    for (let i = 0; i <= 10; i++) {
      const numStr = i < 10 ? `000${i}` : `00${i}`;
      slashFrames.push(this.loadTexture(`assets/vfx/slashes/Radiance_GG_slashes${numStr}.png`));
    }
    const slashGeo = new THREE.PlaneGeometry(4.5, 3.2);
    const slashMat = new THREE.MeshBasicMaterial({
      map: slashFrames[0],
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });
    this.slashMesh = new THREE.Mesh(slashGeo, slashMat);
    this.slashMesh.position.set(0, 1.8, 0.2);
    this.scene.add(this.slashMesh);

    this.slashAnimator = new SpriteAnimator(this.slashMesh, {
      slash: { frames: slashFrames, fps: 24, loop: false }
    }, null);

    // 2. Vengeful Spirit Spell Projectile
    const spellTex = this.loadTexture('assets/vfx/soul_orb.png');
    const spellGeo = new THREE.PlaneGeometry(3.0, 2.2);
    const spellMat = new THREE.MeshBasicMaterial({
      map: spellTex,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });
    this.spellProjectile = new THREE.Mesh(spellGeo, spellMat);
    this.spellProjectile.position.set(-3.0, 1.8, 0.2);
    this.scene.add(this.spellProjectile);
  }

  buildParticleDust() {
    const particleCount = 140;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 32;
      const y = Math.random() * 9 + 0.2;
      const z = (Math.random() - 0.5) * 20;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const isCyan = Math.random() > 0.35;
      colors[i * 3] = isCyan ? 0.0 : 0.95;
      colors[i * 3 + 1] = isCyan ? 0.85 : 0.95;
      colors[i * 3 + 2] = isCyan ? 1.0 : 1.0;

      this.particlesData.push({
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.015,
          Math.random() * 0.012 + 0.005,
          (Math.random() - 0.5) * 0.015
        )
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    this.particleSystem = new THREE.Points(geometry, material);
    this.scene.add(this.particleSystem);
  }

  bindControls() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Real-time jump
      if ((e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') && this.player.isGrounded) {
        if (!window.battleManager.isTrialModalOpen()) {
          this.player.vel.y = this.player.jumpForce;
          this.player.isGrounded = false;
          window.soundEngine.playJump();
          this.knightAnimator.play('jump');
        }
      }

      // Dash (Shift)
      if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && !this.player.isDashing) {
        if (!window.battleManager.isTrialModalOpen()) {
          this.player.isDashing = true;
          this.player.dashTimer = 0.22;
          this.player.vel.x = this.player.facing * 18.0;
          window.soundEngine.playDash();
          this.triggerScreenShake(0.2);
        }
      }

      // Attack / Question trigger
      if (e.code === 'KeyJ' || e.code === 'Enter') {
        if (!window.battleManager.isTrialModalOpen()) {
          window.battleManager.selectAction('slash');
        }
      }
      if (e.code === 'KeyK') {
        if (!window.battleManager.isTrialModalOpen()) {
          window.battleManager.selectAction('spell');
        }
      }
      if (e.code === 'KeyL') {
        if (!window.battleManager.isTrialModalOpen()) {
          window.battleManager.selectAction('heal');
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  setChamberStage(chamberIndex, enemyType) {
    const bgTextures = [
      'assets/bg/nailmaster_03_0008_BG.png',
      'assets/bg/Area_Art_City_of_Tears.png',
      'assets/bg/tram_BG_wrecked.png',
      'assets/bg/Lighthouse_Room_Interior_0015_1.png',
      'assets/bg/Area_Art_Godshome.png'
    ];

    const path = bgTextures[chamberIndex % bgTextures.length];
    if (this.bgMesh) {
      this.bgMesh.material.map = this.loadTexture(path);
      this.bgMesh.material.needsUpdate = true;
    }

    this.setupEnemyAnimator(enemyType);

    // Reset player position
    this.player.pos.set(-6.0, 1.6, 0);
    this.player.vel.set(0, 0, 0);
  }

  setEnemyData(enemyData) {
    if (!this.enemyMesh) return;
    const scale = enemyData.scale || 1.0;
    this.enemyMesh.scale.set(scale, scale, scale);

    if (this.enemyLight) {
      this.enemyLight.color.setHex(enemyData.lightColor || 0xff4444);
    }
  }

  // ========================================================================
  // Combat Action Animations (Driven by Questions)
  // ========================================================================

  triggerKnightNailSlash(callback) {
    this.player.state = 'attack';
    this.knightAnimator.play('attack', () => {
      this.player.state = 'idle';
      this.knightAnimator.play('idle');
    }, true);

    // Play 11-frame Radiance slash VFX directly over target
    this.slashMesh.position.set(this.enemyMesh.position.x - 0.5, this.enemyMesh.position.y, 0.2);
    this.slashMesh.material.opacity = 0.95;
    this.slashAnimator.play('slash', () => {
      this.slashMesh.material.opacity = 0;
    }, true);

    // Hitstop & screen shake
    this.applyHitstop(0.06);
    this.triggerScreenShake(0.4);

    if (callback) {
      setTimeout(callback, 220);
    }
  }

  triggerKnightSpellCast(callback) {
    this.player.state = 'cast';
    this.knightAnimator.play('cast', () => {
      this.player.state = 'idle';
      this.knightAnimator.play('idle');
    }, true);

    // Launch Vengeful Spirit projectile
    const startX = this.player.pos.x + 1.2;
    const targetX = this.enemyMesh.position.x - 0.5;
    const startTime = performance.now();
    const duration = 500;

    this.spellProjectile.material.opacity = 1.0;
    this.triggerScreenShake(0.35);

    const animateSpell = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1.0);

      const currentX = startX + (targetX - startX) * progress;
      const currentY = 1.8 + Math.sin(progress * Math.PI) * 0.5;

      this.spellProjectile.position.set(currentX, currentY, 0.2);

      if (progress < 1.0) {
        requestAnimationFrame(animateSpell);
      } else {
        this.spellProjectile.material.opacity = 0;
        this.applyHitstop(0.08);
        this.triggerScreenShake(0.65);
        if (callback) callback();
      }
    };
    requestAnimationFrame(animateSpell);
  }

  triggerKnightFocusHeal(callback) {
    this.player.state = 'cast';
    this.knightAnimator.play('cast', () => {
      this.player.state = 'idle';
      this.knightAnimator.play('idle');
    }, true);

    // Pulse light
    const originalIntensity = this.knightLight.intensity;
    this.knightLight.intensity = 5.5;

    setTimeout(() => {
      this.knightLight.intensity = originalIntensity;
      if (callback) callback();
    }, 700);
  }

  triggerEnemyHurt(callback) {
    if (this.enemyAnimator) {
      this.enemyAnimator.play('idle', null, true);
    }
    const startX = this.enemyMesh.position.x;
    const knockX = startX + 1.4;
    const startTime = performance.now();
    const duration = 280;

    this.triggerScreenShake(0.3);

    const animateHurt = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1.0);

      if (progress < 0.4) {
        this.enemyMesh.position.x = startX + (knockX - startX) * (progress / 0.4);
      } else {
        const retProgress = (progress - 0.4) / 0.6;
        this.enemyMesh.position.x = knockX - (knockX - startX) * retProgress;
      }

      if (progress < 1.0) {
        requestAnimationFrame(animateHurt);
      } else {
        this.enemyMesh.position.x = startX;
        if (callback) callback();
      }
    };
    requestAnimationFrame(animateHurt);
  }

  triggerEnemyCounterAttack(callback) {
    if (this.enemyAnimator && this.enemyAnimator.animations['attack']) {
      this.enemyAnimator.play('attack');
    }

    const startX = this.enemyMesh.position.x;
    const lungeX = this.player.pos.x + 1.4;
    const startTime = performance.now();
    const duration = 500;

    const animateEnemyLunge = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1.0);

      if (progress < 0.45) {
        this.enemyMesh.position.x = startX + (lungeX - startX) * (progress / 0.45);
      } else {
        if (progress >= 0.45 && this.player.state !== 'hurt') {
          this.triggerKnightHurt();
        }
        const retProgress = (progress - 0.45) / 0.55;
        this.enemyMesh.position.x = lungeX - (lungeX - startX) * retProgress;
      }

      if (progress < 1.0) {
        requestAnimationFrame(animateEnemyLunge);
      } else {
        this.enemyMesh.position.x = startX;
        if (this.enemyAnimator) this.enemyAnimator.play('idle');
        if (callback) callback();
      }
    };
    requestAnimationFrame(animateEnemyLunge);
  }

  triggerKnightHurt() {
    this.player.state = 'hurt';
    this.knightAnimator.play('hurt');

    const flash = document.getElementById('damage-flash');
    if (flash) {
      flash.classList.add('active');
      setTimeout(() => flash.classList.remove('active'), 180);
    }

    this.applyHitstop(0.06);
    this.triggerScreenShake(0.55);

    setTimeout(() => {
      this.player.state = 'idle';
      this.knightAnimator.play('idle');
    }, 450);
  }

  applyHitstop(durationSec) {
    this.hitstopTimer = durationSec;
  }

  triggerScreenShake(intensity) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  // ========================================================================
  // Physics & Animation Tick
  // ========================================================================

  updatePhysics(delta) {
    // If trial modal is active, pause direct movement
    if (window.battleManager.isTrialModalOpen()) {
      return;
    }

    // 1. Dash Timer
    if (this.player.isDashing) {
      this.player.dashTimer -= delta;
      if (this.player.dashTimer <= 0) {
        this.player.isDashing = false;
      }
    } else {
      // Normal Horizontal Movement
      let moveX = 0;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

      if (moveX !== 0) {
        this.player.vel.x = moveX * this.player.speed;
        this.player.facing = moveX > 0 ? 1 : -1;
      } else {
        this.player.vel.x *= 0.75; // friction
      }

      // Subtle 2.5D Depth Movement (Z axis)
      let moveZ = 0;
      if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ -= 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ += 1;
      this.player.pos.z = THREE.MathUtils.clamp(this.player.pos.z + moveZ * 3.5 * delta, -1.5, 1.5);
    }

    // 2. Vertical Gravity
    this.player.vel.y += this.player.gravity * delta;
    this.player.pos.y += this.player.vel.y * delta;
    this.player.pos.x += this.player.vel.x * delta;

    // Ground Floor Collision (Floor is at Y = 1.6)
    if (this.player.pos.y <= 1.6) {
      this.player.pos.y = 1.6;
      this.player.vel.y = 0;
      this.player.isGrounded = true;
    }

    // Stage Bounds (-13 to +13)
    this.player.pos.x = THREE.MathUtils.clamp(this.player.pos.x, -13.0, 13.0);

    // 3. Update Knight Mesh
    if (this.knightMesh) {
      this.knightMesh.position.copy(this.player.pos);
      // Flip sprite based on movement direction
      this.knightMesh.scale.x = Math.abs(this.knightMesh.scale.x) * this.player.facing;
    }

    // 4. Update Animation State based on physics
    if (this.player.state !== 'attack' && this.player.state !== 'cast' && this.player.state !== 'hurt') {
      if (!this.player.isGrounded) {
        this.player.state = 'jump';
        this.knightAnimator.play('jump');
      } else if (Math.abs(this.player.vel.x) > 0.3) {
        this.player.state = 'run';
        this.knightAnimator.play('run');
      } else {
        this.player.state = 'idle';
        this.knightAnimator.play('idle');
      }
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();

    // Hitstop check (pauses physics and animation for visceral impact)
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= delta;
      return;
    }

    // 1. Update Physics
    this.updatePhysics(delta);

    // 2. Update Animators
    if (this.knightAnimator) this.knightAnimator.update(delta);
    if (this.enemyAnimator) this.enemyAnimator.update(delta);
    if (this.slashAnimator) this.slashAnimator.update(delta);

    // 3. Ambient Enemy Hovering
    if (this.enemyMesh && this.enemyAnimator && this.enemyAnimator.currentAnim === 'idle') {
      this.enemyMesh.position.y = 1.8 + Math.sin(time * 3.0) * 0.1;
    }

    // 4. Lights Tracking
    if (this.knightLight && this.knightMesh) {
      this.knightLight.position.set(this.knightMesh.position.x, this.knightMesh.position.y + 0.4, this.knightMesh.position.z + 1.0);
    }
    if (this.enemyLight && this.enemyMesh) {
      this.enemyLight.position.set(this.enemyMesh.position.x, this.enemyMesh.position.y + 0.4, this.enemyMesh.position.z + 1.0);
    }

    // 5. Parallax Dust Motes
    if (this.particleSystem) {
      const positions = this.particleSystem.geometry.attributes.position.array;
      for (let i = 0; i < this.particlesData.length; i++) {
        const vel = this.particlesData[i].velocity;
        positions[i * 3] += vel.x;
        positions[i * 3 + 1] += vel.y;
        positions[i * 3 + 2] += vel.z;

        if (positions[i * 3 + 1] > 9.0) positions[i * 3 + 1] = 0.2;
        if (positions[i * 3] > 16.0) positions[i * 3] = -16.0;
        if (positions[i * 3] < -16.0) positions[i * 3] = 16.0;
      }
      this.particleSystem.geometry.attributes.position.needsUpdate = true;
    }

    // 6. Camera Smooth Follow (Lerp) with Screen Shake
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeIntensity > 0.01) {
      shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      shakeY = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= 0.88;
    } else {
      this.shakeIntensity = 0;
    }

    const targetCamX = THREE.MathUtils.clamp(this.player.pos.x * 0.4, -4.5, 4.5);
    this.camera.position.x += (targetCamX - this.camera.position.x) * 0.08 + shakeX;
    this.camera.position.y = 3.2 + shakeY;

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

window.Game25D = Game25D;
