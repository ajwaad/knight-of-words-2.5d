/**
 * Hallownest 2.5D Engine (Three.js WebGL)
 * Aspect-Ratio Preserving Multi-Frame Sprite Animator, 2.5D Platformer Physics,
 * Melee Lunge Choreography, and Dynamic Combat Juice.
 */

class SpriteAnimator {
  constructor(mesh, animations, defaultAnim = 'idle', baseHeight = 2.6) {
    this.mesh = mesh;
    this.animations = animations; // { animName: { frames: [tex...], fps: 12, loop: true } }
    this.baseHeight = baseHeight;
    this.facing = 1;
    this.scaleMultiplier = 1.0;
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
    } else {
      this.syncAspectScale();
    }
  }

  syncAspectScale() {
    const anim = this.animations[this.currentAnim];
    if (!anim || !anim.frames[this.frameIndex]) return;
    const tex = anim.frames[this.frameIndex];
    let aspect = 1.0;
    if (tex.image && tex.image.width && tex.image.height) {
      aspect = tex.image.width / tex.image.height;
    }
    const h = this.baseHeight * this.scaleMultiplier;
    const w = h * aspect;
    this.mesh.scale.set(w * (this.facing >= 0 ? 1 : -1), h, 1);
  }

  updateTexture() {
    const anim = this.animations[this.currentAnim];
    if (anim && anim.frames[this.frameIndex]) {
      this.mesh.material.map = anim.frames[this.frameIndex];
      this.mesh.material.needsUpdate = true;
      this.syncAspectScale();
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
      pos: new THREE.Vector3(-5.2, 1.55, 0),
      vel: new THREE.Vector3(0, 0, 0),
      isGrounded: true,
      facing: 1,
      speed: 8.8,
      jumpForce: 14.0,
      gravity: -35.0,
      isDashing: false,
      dashTimer: 0,
      isLunging: false,
      state: 'idle'
    };

    // Actors & Meshes
    this.knightMesh = null;
    this.knightShadow = null;
    this.knightAnimator = null;
    this.enemyMesh = null;
    this.enemyShadow = null;
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

    this.init();
  }

  async init() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. Scene & Fog
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x060810, 0.022);

    // 2. Camera: Angled 2.5D perspective
    this.camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    this.camera.position.set(0, 3.2, 15.5);
    this.camera.lookAt(0, 1.6, 0);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if (THREE.ACESFilmicToneMapping) {
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.15;
    }

    this.container.appendChild(this.renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0x475569, 1.45);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xa5f3fc, 1.35);
    dirLight.position.set(2, 14, 8);
    this.scene.add(dirLight);

    this.knightLight = new THREE.PointLight(0x00d4ff, 2.5, 11);
    this.scene.add(this.knightLight);

    this.enemyLight = new THREE.PointLight(0xff4444, 2.3, 11);
    this.scene.add(this.enemyLight);

    // 5. Build Stages & Preload Animations
    this.buildStage();
    await this.setupCharacterAnimations();
    this.buildVFX();
    this.buildParticleDust();

    // 6. Bind Keyboard & Touch Inputs
    this.bindControls();
    window.addEventListener('resize', () => this.onResize());

    // 7. Start Render Loop
    this.animate();
  }

  loadTexture(path) {
    const resolved = (window.ASSET_DATA_URIS && window.ASSET_DATA_URIS[path]) ? window.ASSET_DATA_URIS[path] : path;
    if (!this.textures[path]) {
      this.textures[path] = this.textureLoader.load(resolved, (tex) => {
        if ('colorSpace' in tex && THREE.SRGBColorSpace) {
          tex.colorSpace = THREE.SRGBColorSpace;
        } else if (THREE.sRGBEncoding) {
          tex.encoding = THREE.sRGBEncoding;
        }
      });
    }
    return this.textures[path];
  }

  loadTextureArray(paths) {
    return paths.map(p => this.loadTexture(p));
  }

  createGroundShadow(radiusX, radiusZ) {
    const geo = new THREE.CircleGeometry(1, 24);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x020408,
      transparent: true,
      opacity: 0.58,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.scale.set(radiusX, radiusZ, 1);
    mesh.position.y = 0.03;
    this.scene.add(mesh);
    return mesh;
  }

  buildStage() {
    // A. 3D Stone Floor
    const floorGeo = new THREE.PlaneGeometry(36, 12);
    const floorTex = this.loadTexture('assets/bg/Nailmaster_03__0001_Floor.png');
    floorTex.wrapS = THREE.RepeatWrapping;
    floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(6, 2);

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.65,
      metalness: 0.2,
      color: 0x94a3b8
    });
    this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.position.set(0, 0, 0);
    this.scene.add(this.floorMesh);

    // B. Deep Background (16:9 full environment)
    const bgGeo = new THREE.PlaneGeometry(38, 20);
    const bgTex = this.loadTexture('assets/bg/nailmaster_03_0008_BG.png');
    const bgMat = new THREE.MeshBasicMaterial({ map: bgTex, transparent: true, color: 0xcbd5e1 });
    this.bgMesh = new THREE.Mesh(bgGeo, bgMat);
    this.bgMesh.position.set(0, 4.8, -20);
    this.scene.add(this.bgMesh);

    // C. Midground Pillars / Drapery
    const midGeo = new THREE.PlaneGeometry(28, 9);
    const midTex = this.loadTexture('assets/bg/nailmaster_03_0006_curtain_MID.png');
    const midMat = new THREE.MeshBasicMaterial({ map: midTex, transparent: true, opacity: 0.78, depthWrite: false });
    this.midMesh = new THREE.Mesh(midGeo, midMat);
    this.midMesh.position.set(0, 4.2, -8);
    this.scene.add(this.midMesh);

    // D. Foreground Framing Arches
    const fgGeo = new THREE.PlaneGeometry(28, 13);
    const fgTex = this.loadTexture('assets/bg/nailmaster_03_0003_FG.png');
    const fgMat = new THREE.MeshBasicMaterial({ map: fgTex, transparent: true, opacity: 0.9, depthWrite: false });
    this.fgMesh = new THREE.Mesh(fgGeo, fgMat);
    this.fgMesh.position.set(0, 3.0, 6.2);
    this.scene.add(this.fgMesh);

    // E. Vertical Chamber Gate Archway (Far Right)
    const gateGeo = new THREE.PlaneGeometry(3.4, 5.4);
    const gateTex = this.loadTexture('assets/bg/chamber_gate_arch.png');
    const gateMat = new THREE.MeshBasicMaterial({ map: gateTex, transparent: true, opacity: 0.9, depthWrite: false });
    this.chamberGateMesh = new THREE.Mesh(gateGeo, gateMat);
    this.chamberGateMesh.position.set(12.2, 2.6, -0.6);
    this.scene.add(this.chamberGateMesh);
  }

  async setupCharacterAnimations() {
    // 1. The Knight Animations
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

    const knightGeo = new THREE.PlaneGeometry(1, 1);
    const knightMat = new THREE.MeshBasicMaterial({
      map: knightIdleFrames[0],
      transparent: true,
      alphaTest: 0.04,
      side: THREE.DoubleSide
    });
    this.knightMesh = new THREE.Mesh(knightGeo, knightMat);
    this.knightMesh.position.copy(this.player.pos);
    this.scene.add(this.knightMesh);
    this.knightShadow = this.createGroundShadow(0.95, 0.45);

    this.knightAnimator = new SpriteAnimator(this.knightMesh, {
      idle: { frames: knightIdleFrames, fps: 7, loop: true },
      run: { frames: knightRunFrames, fps: 15, loop: true },
      jump: { frames: knightJumpFrames, fps: 11, loop: false },
      attack: { frames: knightAttackFrames, fps: 18, loop: false },
      cast: { frames: knightCastFrames, fps: 15, loop: false },
      hurt: { frames: [this.loadTexture('assets/knight/hurt.png')], fps: 2, loop: false }
    }, 'idle', 2.5);

    // 2. The Adversary Mesh & Animations
    const enemyGeo = new THREE.PlaneGeometry(1, 1);
    const enemyMat = new THREE.MeshBasicMaterial({
      map: knightIdleFrames[0],
      transparent: true,
      alphaTest: 0.04,
      side: THREE.DoubleSide
    });
    this.enemyMesh = new THREE.Mesh(enemyGeo, enemyMat);
    this.enemyMesh.position.set(4.5, 1.9, 0);
    this.scene.add(this.enemyMesh);
    this.enemyShadow = this.createGroundShadow(1.35, 0.6);

    this.setupEnemyAnimator('hiveling');
  }

  setupEnemyAnimator(enemyType) {
    let animConfig = {};
    let baseH = 2.8;

    if (enemyType === 'hornet') {
      baseH = 2.75;
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
        idle: { frames: idleFrames, fps: 5, loop: true },
        jump: { frames: jumpFrames, fps: 12, loop: false },
        attack: { frames: attackFrames, fps: 16, loop: false },
        land: { frames: landFrames, fps: 12, loop: false }
      };

    } else if (enemyType === 'grimm') {
      baseH = 3.5;
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

    } else if (enemyType === 'dung_defender') {
      baseH = 3.1;
      const idleFrames = this.loadTextureArray([
        'assets/bosses/dung_defender/idle/dung_def_idle_00.png',
        'assets/bosses/dung_defender/idle/dung_def_idle_01.png',
        'assets/bosses/dung_defender/idle/dung_def_idle_02.png',
        'assets/bosses/dung_defender/idle/dung_def_idle_03.png'
      ]);
      const attackFrames = this.loadTextureArray([
        'assets/bosses/dung_defender/attack/dung_def_attack_00.png',
        'assets/bosses/dung_defender/attack/dung_def_attack_01.png',
        'assets/bosses/dung_defender/attack/dung_def_attack_02.png',
        'assets/bosses/dung_defender/attack/dung_def_attack_03.png'
      ]);
      animConfig = {
        idle: { frames: idleFrames, fps: 7, loop: true },
        attack: { frames: attackFrames, fps: 14, loop: false }
      };

    } else if (enemyType === 'mantis' || enemyType === 'grimmkin') {
      baseH = 2.85;
      const idleFrames = this.loadTextureArray([
        'assets/enemies/mantis/idle/Mantis_Scout_idle_00.png',
        'assets/enemies/mantis/idle/Mantis_Scout_idle_01.png',
        'assets/enemies/mantis/idle/Mantis_Scout_idle_02.png',
        'assets/enemies/mantis/idle/Mantis_Scout_idle_03.png',
        'assets/enemies/mantis/idle/Mantis_Scout_idle_04.png',
        'assets/enemies/mantis/idle/Mantis_Scout_idle_05.png'
      ]);
      const attackFrames = this.loadTextureArray([
        'assets/enemies/mantis/attack/Mantis_Scout_attack_00.png',
        'assets/enemies/mantis/attack/Mantis_Scout_attack_01.png',
        'assets/enemies/mantis/attack/Mantis_Scout_attack_02.png',
        'assets/enemies/mantis/attack/Mantis_Scout_attack_03.png',
        'assets/enemies/mantis/attack/Mantis_Scout_attack_04.png',
        'assets/enemies/mantis/attack/Mantis_Scout_attack_05.png'
      ]);
      animConfig = {
        idle: { frames: idleFrames, fps: 9, loop: true },
        attack: { frames: attackFrames, fps: 16, loop: false }
      };

    } else {
      // Hiveling Swarm
      baseH = 2.25;
      const flyFrames = [];
      for (let i = 0; i <= 4; i++) {
        flyFrames.push(this.loadTexture(`assets/enemies/hiveling/fly/Hiveling - fly000${i}.png`));
      }
      animConfig = {
        idle: { frames: flyFrames, fps: 15, loop: true },
        fly: { frames: flyFrames, fps: 15, loop: true },
        attack: { frames: flyFrames, fps: 22, loop: true }
      };
    }

    this.enemyAnimator = new SpriteAnimator(this.enemyMesh, animConfig, 'idle', baseH);
  }

  buildVFX() {
    // 1. Multi-Frame Radiance Slash Effect (11 animated frames)
    const slashFrames = [];
    for (let i = 0; i <= 10; i++) {
      const numStr = i < 10 ? `000${i}` : `00${i}`;
      slashFrames.push(this.loadTexture(`assets/vfx/slashes/Radiance_GG_slashes${numStr}.png`));
    }
    const slashGeo = new THREE.PlaneGeometry(1, 1);
    const slashMat = new THREE.MeshBasicMaterial({
      map: slashFrames[0],
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.slashMesh = new THREE.Mesh(slashGeo, slashMat);
    this.slashMesh.position.set(0, 1.8, 0.3);
    this.scene.add(this.slashMesh);

    this.slashAnimator = new SpriteAnimator(this.slashMesh, {
      slash: { frames: slashFrames, fps: 26, loop: false }
    }, null, 3.4);

    // 2. Vengeful Spirit Spell Projectile
    const spellTex = this.loadTexture('assets/vfx/soul_orb.png');
    const spellGeo = new THREE.PlaneGeometry(3.2, 2.4);
    const spellMat = new THREE.MeshBasicMaterial({
      map: spellTex,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.spellProjectile = new THREE.Mesh(spellGeo, spellMat);
    this.spellProjectile.position.set(-3.0, 1.8, 0.3);
    this.scene.add(this.spellProjectile);
  }

  buildParticleDust() {
    const particleCount = 140;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 32;
      positions[i * 3 + 1] = Math.random() * 9 + 0.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;

      const isCyan = Math.random() > 0.35;
      colors[i * 3] = isCyan ? 0.0 : 0.95;
      colors[i * 3 + 1] = isCyan ? 0.85 : 0.95;
      colors[i * 3 + 2] = 1.0;

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
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particleSystem = new THREE.Points(geometry, material);
    this.scene.add(this.particleSystem);
  }

  triggerJump() {
    if (this.player.isGrounded && !window.battleManager.isTrialModalOpen()) {
      this.player.vel.y = this.player.jumpForce;
      this.player.isGrounded = false;
      window.soundEngine.playJump();
      this.knightAnimator.play('jump');
    }
  }

  triggerDash() {
    if (!this.player.isDashing && !window.battleManager.isTrialModalOpen()) {
      this.player.isDashing = true;
      this.player.dashTimer = 0.22;
      this.player.vel.x = this.player.facing * 18.0;
      window.soundEngine.playDash();
      this.triggerScreenShake(0.2);
    }
  }

  bindControls() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (window.battleManager.isTrialModalOpen()) return;

      // Jump
      if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
        this.triggerJump();
      }

      // Dash
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.triggerDash();
      }

      // Combat Actions (Both [J/K/L/U] and [1/2/3/4] when modal is closed)
      if (e.code === 'KeyJ' || e.code === 'Digit1' || e.code === 'Enter') {
        window.battleManager.selectAction('slash');
      } else if (e.code === 'KeyK' || e.code === 'Digit2') {
        window.battleManager.selectAction('spell');
      } else if (e.code === 'KeyL' || e.code === 'Digit3') {
        window.battleManager.selectAction('heal');
      } else if (e.code === 'KeyU' || e.code === 'Digit4') {
        window.battleManager.selectAction('great_slash');
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // On-screen mobile / mouse controls
    const bindHoldBtn = (id, keyCode) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      const start = (ev) => { ev.preventDefault(); this.keys[keyCode] = true; };
      const end = (ev) => { ev.preventDefault(); this.keys[keyCode] = false; };
      btn.addEventListener('mousedown', start);
      btn.addEventListener('mouseup', end);
      btn.addEventListener('mouseleave', end);
      btn.addEventListener('touchstart', start, { passive: false });
      btn.addEventListener('touchend', end, { passive: false });
    };
    bindHoldBtn('btn-move-left', 'KeyA');
    bindHoldBtn('btn-move-right', 'KeyD');

    document.getElementById('btn-jump')?.addEventListener('click', () => this.triggerJump());
    document.getElementById('btn-dash')?.addEventListener('click', () => this.triggerDash());
  }

  setChamberStage(chamberIndex, enemyType) {
    const bgTextures = [
      'assets/bg/nailmaster_03_0008_BG.png',
      'assets/bg/Area_Art_Mantis_Village.png',
      'assets/bg/tram_BG_wrecked.png',
      'assets/bg/Area_Art_City_of_Tears.png',
      'assets/bg/Area_Art_Godshome.png'
    ];

    const path = bgTextures[chamberIndex % bgTextures.length];
    if (this.bgMesh) {
      this.bgMesh.material.map = this.loadTexture(path);
      this.bgMesh.material.needsUpdate = true;
    }

    this.setupEnemyAnimator(enemyType);

    // Reset player position
    this.player.pos.set(-5.2, 1.55, 0);
    this.player.vel.set(0, 0, 0);
    this.player.facing = 1;
  }

  setEnemyData(enemyData) {
    if (!this.enemyMesh || !this.enemyAnimator) return;
    this.enemyAnimator.scaleMultiplier = enemyData.scale || 1.0;
    this.enemyAnimator.syncAspectScale();

    if (this.enemyLight) {
      this.enemyLight.color.setHex(enemyData.lightColor || 0xff4444);
    }
  }

  // ========================================================================
  // Combat Action Animations (Driven by Questions)
  // ========================================================================

  triggerKnightNailSlash(callback, isGreatSlash = false) {
    this.player.state = 'attack';
    this.player.isLunging = true;
    this.player.facing = 1;

    const startX = this.player.pos.x;
    const strikeX = this.enemyMesh.position.x - 1.85;
    const lungeStart = performance.now();
    const lungeDuration = 160;

    // 1. Lunge across arena to strike range
    const animateLungeIn = (now) => {
      const p = Math.min((now - lungeStart) / lungeDuration, 1.0);
      this.player.pos.x = startX + (strikeX - startX) * p;
      this.knightMesh.position.copy(this.player.pos);

      if (p < 1.0) {
        requestAnimationFrame(animateLungeIn);
      } else {
        // 2. Execute Slash at close range
        this.knightAnimator.play('attack', () => {
          this.player.state = 'idle';
          this.knightAnimator.play('idle');
        }, true);

        this.slashMesh.position.set(this.enemyMesh.position.x - 0.3, this.enemyMesh.position.y, 0.35);
        this.slashAnimator.scaleMultiplier = isGreatSlash ? 1.65 : 1.0;
        this.slashMesh.material.color.setHex(isGreatSlash ? 0xfbbf24 : 0xffffff);
        this.slashMesh.material.opacity = 0.98;
        this.slashAnimator.play('slash', () => {
          this.slashMesh.material.opacity = 0;
        }, true);

        this.applyHitstop(isGreatSlash ? 0.09 : 0.06);
        this.triggerScreenShake(isGreatSlash ? 0.72 : 0.42);

        if (callback) callback();

        // 3. Vault back to fighting stance
        setTimeout(() => {
          const retStart = performance.now();
          const retDuration = 200;
          const returnX = -5.2;
          const animateRetreat = (tNow) => {
            const rp = Math.min((tNow - retStart) / retDuration, 1.0);
            this.player.pos.x = strikeX + (returnX - strikeX) * rp;
            this.knightMesh.position.copy(this.player.pos);
            if (rp < 1.0) {
              requestAnimationFrame(animateRetreat);
            } else {
              this.player.isLunging = false;
            }
          };
          requestAnimationFrame(animateRetreat);
        }, 220);
      }
    };
    requestAnimationFrame(animateLungeIn);
  }

  triggerKnightSpellCast(callback) {
    this.player.state = 'cast';
    this.player.facing = 1;
    this.knightAnimator.play('cast', () => {
      this.player.state = 'idle';
      this.knightAnimator.play('idle');
    }, true);

    const startX = this.player.pos.x + 1.2;
    const targetX = this.enemyMesh.position.x - 0.4;
    const startTime = performance.now();
    const duration = 460;

    this.spellProjectile.material.opacity = 1.0;
    this.triggerScreenShake(0.35);

    const animateSpell = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1.0);

      const currentX = startX + (targetX - startX) * progress;
      const currentY = 1.8 + Math.sin(progress * Math.PI) * 0.4;

      this.spellProjectile.position.set(currentX, currentY, 0.35);

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

    const originalIntensity = this.knightLight.intensity;
    this.knightLight.intensity = 5.8;

    setTimeout(() => {
      this.knightLight.intensity = originalIntensity;
      if (callback) callback();
    }, 680);
  }

  triggerEnemyHurt(callback) {
    if (this.enemyAnimator) {
      this.enemyAnimator.play('idle', null, true);
    }
    const startX = 4.5;
    const knockX = startX + 1.45;
    const startTime = performance.now();
    const duration = 280;

    // Flash enemy tint crimson-white on impact
    if (this.enemyMesh && this.enemyMesh.material) {
      this.enemyMesh.material.color.setHex(0xff9999);
      setTimeout(() => {
        if (this.enemyMesh && this.enemyMesh.material) {
          this.enemyMesh.material.color.setHex(0xffffff);
        }
      }, 150);
    }

    this.triggerScreenShake(0.32);

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
    const lungeX = this.player.pos.x + 1.35;
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
    if (window.battleManager.isTrialModalOpen() || this.player.isLunging) {
      return;
    }

    // 1. Dash Timer
    if (this.player.isDashing) {
      this.player.dashTimer -= delta;
      if (this.player.dashTimer <= 0) {
        this.player.isDashing = false;
      }
    } else {
      let moveX = 0;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

      if (moveX !== 0) {
        this.player.vel.x = moveX * this.player.speed;
        this.player.facing = moveX > 0 ? 1 : -1;
      } else {
        this.player.vel.x *= 0.75;
      }

      let moveZ = 0;
      if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ -= 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ += 1;
      this.player.pos.z = THREE.MathUtils.clamp(this.player.pos.z + moveZ * 3.5 * delta, -1.5, 1.5);
    }

    // 2. Vertical Gravity
    this.player.vel.y += this.player.gravity * delta;
    this.player.pos.y += this.player.vel.y * delta;
    this.player.pos.x += this.player.vel.x * delta;

    // Ground Floor Collision
    if (this.player.pos.y <= 1.55) {
      this.player.pos.y = 1.55;
      this.player.vel.y = 0;
      this.player.isGrounded = true;
    }

    // Stage Bounds
    this.player.pos.x = THREE.MathUtils.clamp(this.player.pos.x, -11.5, 11.5);

    // 3. Update Knight Mesh & Facing
    if (this.knightMesh && this.knightAnimator) {
      this.knightMesh.position.copy(this.player.pos);
      this.knightAnimator.facing = this.player.facing;
      this.knightAnimator.syncAspectScale();
    }

    // 4. Update Animation State
    if (this.player.state !== 'attack' && this.player.state !== 'cast' && this.player.state !== 'hurt') {
      if (!this.player.isGrounded) {
        this.player.state = 'jump';
        this.knightAnimator.play('jump');
      } else if (Math.abs(this.player.vel.x) > 0.35) {
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

    // 3. Ambient Enemy Hovering & Ground Shadows
    if (this.enemyMesh && this.enemyAnimator && this.enemyAnimator.currentAnim === 'idle') {
      this.enemyMesh.position.y = 1.85 + Math.sin(time * 2.8) * 0.1;
    }
    if (this.knightShadow && this.knightMesh) {
      this.knightShadow.position.x = this.knightMesh.position.x;
      this.knightShadow.position.z = this.knightMesh.position.z;
      const hFactor = Math.max(0.4, 1.0 - (this.knightMesh.position.y - 1.55) * 0.15);
      this.knightShadow.scale.set(0.95 * hFactor, 0.45 * hFactor, 1);
    }
    if (this.enemyShadow && this.enemyMesh) {
      this.enemyShadow.position.x = this.enemyMesh.position.x;
      this.enemyShadow.position.z = this.enemyMesh.position.z;
    }

    // 4. Lights Tracking
    if (this.knightLight && this.knightMesh) {
      this.knightLight.position.set(this.knightMesh.position.x, this.knightMesh.position.y + 0.4, this.knightMesh.position.z + 1.2);
    }
    if (this.enemyLight && this.enemyMesh) {
      this.enemyLight.position.set(this.enemyMesh.position.x, this.enemyMesh.position.y + 0.4, this.enemyMesh.position.z + 1.2);
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

    // 6. Camera Smooth Follow with Screen Shake
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeIntensity > 0.01) {
      shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      shakeY = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= 0.86;
    } else {
      this.shakeIntensity = 0;
    }

    const targetCamX = THREE.MathUtils.clamp(this.player.pos.x * 0.35, -3.8, 3.8);
    this.camera.position.x += (targetCamX - this.camera.position.x) * 0.08 + shakeX;
    this.camera.position.y = 3.2 + shakeY;

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
