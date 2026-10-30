/**
 * Hallownest 2.5D Engine (Three.js WebGL)
 * Directly uses existing Hollow Knight assets from manifest.txt with
 * automatic transparent-bounds normalization, eye-direction alignment,
 * ground-locked baselines, and full 2.5D combat choreography.
 */

class SpriteAnimator {
  constructor(mesh, animations, defaultAnim = 'idle', baseHeight = 2.5, isFlying = false) {
    this.mesh = mesh;
    this.animations = animations; // { animName: { frames: [tex...], fps: 12, loop: true } }
    this.baseHeight = baseHeight;
    this.isFlying = isFlying;
    this.facing = 1; // +1 = right (+X), -1 = left (-X)
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
    if (tex.userData && tex.userData.aspect) {
      aspect = tex.userData.aspect;
    } else if (tex.image && tex.image.width && tex.image.height) {
      aspect = tex.image.width / tex.image.height;
    }
    const nativeDir = (tex.userData && tex.userData.nativeFacing) ? tex.userData.nativeFacing : (anim.nativeFacing || 1);
    const h = this.baseHeight * this.scaleMultiplier;
    const w = h * aspect;
    const signX = (this.facing >= 0 ? 1 : -1) * (nativeDir >= 0 ? 1 : -1);
    this.mesh.scale.set(w * signX, h, 1);
  }

  getGroundCenterY() {
    const h = this.baseHeight * this.scaleMultiplier;
    return h * 0.46;
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

    // Textures & Local File Map
    this.textureLoader = new THREE.TextureLoader();
    this.textures = {};
    this.localBlobUrls = {};

    // Physics & Controls
    this.keys = {};
    this.player = {
      pos: new THREE.Vector3(-5.0, 1.15, 0),
      vel: new THREE.Vector3(0, 0, 0),
      groundY: 1.15,
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
    this.dashMesh = null;
    this.dashAnimator = null;
    this.focusRingMesh = null;
    this.spellProjectile = null;
    this.spellAnimator = null;

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
    this.hornetIdleTimer = 0;

    this.init();
  }

  async init() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. Scene & Fog
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x060810, 0.02);

    // 2. Camera: Angled 2.5D perspective
    this.camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    this.camera.position.set(0, 3.1, 15.2);
    this.camera.lookAt(0, 1.55, 0);

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
    const ambientLight = new THREE.AmbientLight(0x64748b, 1.55);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xe0f2fe, 1.35);
    dirLight.position.set(2, 14, 8);
    this.scene.add(dirLight);

    this.knightLight = new THREE.PointLight(0x00d4ff, 2.4, 11);
    this.scene.add(this.knightLight);

    this.enemyLight = new THREE.PointLight(0xff4444, 2.2, 11);
    this.scene.add(this.enemyLight);

    // 5. Build Stages & Preload Animations using exact manifest.txt paths
    this.buildStage();
    await this.setupCharacterAnimations();
    this.buildVFX();
    this.buildParticleDust();

    // 6. Bind Keyboard, Touch & Folder Upload Controls
    this.bindControls();
    window.addEventListener('resize', () => this.onResize());

    // 7. Start Render Loop
    this.animate();
  }

  encodeAssetUrl(path) {
    if (!path || path.startsWith('data:') || path.startsWith('blob:') || path.startsWith('http')) {
      return path;
    }
    return path.split('/').map(seg => encodeURIComponent(seg)).join('/');
  }

  resolveAssetUrl(path) {
    if (this.localBlobUrls[path]) return this.localBlobUrls[path];
    const bn = path.split('/').pop();
    if (this.localBlobUrls[bn]) return this.localBlobUrls[bn];
    if (window.ASSET_DATA_URIS && window.ASSET_DATA_URIS[path]) {
      return window.ASSET_DATA_URIS[path];
    }
    return this.encodeAssetUrl(path);
  }

  /**
   * Normalizes a character/boss frame onto a uniform canvas so transparent padding
   * differences between manifest.txt sprites never cause scale jumps or floating feet.
   */
  normalizeSpriteCanvas(img, opts = {}) {
    const cw = opts.canvasWidth || 320;
    const ch = opts.canvasHeight || 320;
    const bottomPad = opts.bottomPad !== undefined ? opts.bottomPad : 12;

    const tmp = document.createElement('canvas');
    tmp.width = img.width || 256;
    tmp.height = img.height || 256;
    const tctx = tmp.getContext('2d');
    tctx.drawImage(img, 0, 0);

    let minX = 0, minY = 0, maxX = tmp.width - 1, maxY = tmp.height - 1;
    let detectedFacing = opts.defaultNativeFacing || 1;

    try {
      const data = tctx.getImageData(0, 0, tmp.width, tmp.height).data;
      let x0 = tmp.width, y0 = tmp.height, x1 = 0, y1 = 0;
      let found = false;

      // Also track bright mask pixels and dark eye pixels inside the upper mask for Knight auto-facing
      let whiteSumX = 0, whiteCount = 0;
      let wMinX = tmp.width, wMaxX = 0, wMinY = tmp.height, wMaxY = 0;

      for (let y = 0; y < tmp.height; y++) {
        for (let x = 0; x < tmp.width; x++) {
          const idx = (y * tmp.width + x) * 4;
          const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
          if (a > 18) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
            found = true;

            if (opts.isKnight && r > 205 && g > 205 && b > 205 && a > 180) {
              whiteSumX += x;
              whiteCount++;
              if (x < wMinX) wMinX = x;
              if (x > wMaxX) wMaxX = x;
              if (y < wMinY) wMinY = y;
              if (y > wMaxY) wMaxY = y;
            }
          }
        }
      }

      if (found && x1 >= x0 && y1 >= y0) {
        minX = x0; minY = y0; maxX = x1; maxY = y1;
      }

      if (opts.isKnight && whiteCount > 30 && wMaxX > wMinX + 8) {
        const maskCx = whiteSumX / whiteCount;
        let eyeSumX = 0, eyeCount = 0;
        const yMid = wMinY + (wMaxY - wMinY) * 0.78;
        for (let y = wMinY + 2; y <= yMid; y++) {
          for (let x = wMinX + 2; x <= wMaxX - 2; x++) {
            const idx = (y * tmp.width + x) * 4;
            const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
            if (a > 180 && r < 55 && g < 55 && b < 55) {
              eyeSumX += x;
              eyeCount++;
            }
          }
        }
        if (eyeCount > 8) {
          const eyeCx = eyeSumX / eyeCount;
          if (eyeCx > maskCx + 1.1) detectedFacing = 1;
          else if (eyeCx < maskCx - 1.1) detectedFacing = -1;
        }
      }
    } catch (err) {
      // Cross-origin fallback
    }

    const cropW = Math.max(1, maxX - minX + 1);
    const cropH = Math.max(1, maxY - minY + 1);

    const out = document.createElement('canvas');
    out.width = cw;
    out.height = ch;
    const octx = out.getContext('2d');

    const targetMaxH = ch * 0.84;
    const targetMaxW = cw * 0.86;
    const scale = Math.min(targetMaxW / cropW, targetMaxH / cropH);
    const drawW = Math.max(1, Math.round(cropW * scale));
    const drawH = Math.max(1, Math.round(cropH * scale));

    const dx = Math.round((cw - drawW) / 2);
    const dy = Math.max(4, ch - drawH - bottomPad);

    octx.drawImage(tmp, minX, minY, cropW, cropH, dx, dy, drawW, drawH);
    return { canvas: out, nativeFacing: detectedFacing, aspect: cw / ch };
  }

  applyColorSpace(tex) {
    if ('colorSpace' in tex && THREE.SRGBColorSpace) {
      tex.colorSpace = THREE.SRGBColorSpace;
    } else if (THREE.sRGBEncoding) {
      tex.encoding = THREE.sRGBEncoding;
    }
  }

  loadTexture(path, opts = {}) {
    const cacheKey = `${path}::${opts.normalize ? 'norm' : 'raw'}`;
    if (this.textures[cacheKey]) return this.textures[cacheKey];

    const url = this.resolveAssetUrl(path);
    const tex = new THREE.Texture();
    tex.userData = { path, opts, nativeFacing: opts.defaultNativeFacing || 1, aspect: 1.0 };
    this.applyColorSpace(tex);
    this.textures[cacheKey] = tex;

    const loadImg = (srcUrl, isFallback = false) => {
      const img = new Image();
      if (!srcUrl.startsWith('data:') && !srcUrl.startsWith('blob:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        if (opts.normalize) {
          const norm = this.normalizeSpriteCanvas(img, opts);
          tex.image = norm.canvas;
          tex.userData.nativeFacing = norm.nativeFacing;
          tex.userData.aspect = norm.aspect;
        } else {
          tex.image = img;
          if (img.width && img.height) {
            tex.userData.aspect = img.width / img.height;
          }
        }
        tex.needsUpdate = true;
        if (this.knightAnimator) this.knightAnimator.syncAspectScale();
        if (this.enemyAnimator) this.enemyAnimator.syncAspectScale();
      };
      img.onerror = () => {
        if (!isFallback && window.FALLBACK_DATA_URIS && window.FALLBACK_DATA_URIS[path]) {
          loadImg(window.FALLBACK_DATA_URIS[path], true);
        }
      };
      img.src = srcUrl;
    };

    loadImg(url);
    return tex;
  }

  loadTextureArray(paths, opts = {}) {
    return paths.map(p => this.loadTexture(p, opts));
  }

  reloadAllLoadedTextures() {
    Object.values(this.textures).forEach((tex) => {
      if (!tex.userData || !tex.userData.path) return;
      const p = tex.userData.path;
      const opts = tex.userData.opts || {};
      const newUrl = this.resolveAssetUrl(p);
      const img = new Image();
      img.onload = () => {
        if (opts.normalize) {
          const norm = this.normalizeSpriteCanvas(img, opts);
          tex.image = norm.canvas;
          tex.userData.nativeFacing = norm.nativeFacing;
          tex.userData.aspect = norm.aspect;
        } else {
          tex.image = img;
          if (img.width && img.height) tex.userData.aspect = img.width / img.height;
        }
        tex.needsUpdate = true;
      };
      img.src = newUrl;
    });
  }

  createGroundShadow(radiusX, radiusZ) {
    const geo = new THREE.CircleGeometry(1, 24);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x020408,
      transparent: true,
      opacity: 0.62,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.scale.set(radiusX, radiusZ, 1);
    mesh.position.y = 0.02;
    mesh.renderOrder = 2;
    this.scene.add(mesh);
    return mesh;
  }

  buildStage() {
    // A. 3D Stone Floor (Exact manifest.txt path: assets/Architecture & Environment/Nailmaster_03__0001_Floor.png)
    const floorGeo = new THREE.PlaneGeometry(36, 12);
    const floorTex = this.loadTexture('assets/Architecture & Environment/Nailmaster_03__0001_Floor.png');
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
    this.floorMesh.renderOrder = 1;
    this.scene.add(this.floorMesh);

    // B. Deep Background (Full room environment from manifest.txt)
    const bgGeo = new THREE.PlaneGeometry(38, 19);
    const bgTex = this.loadTexture('assets/Architecture & Environment/nailmaster_03_0008_BG.png');
    const bgMat = new THREE.MeshBasicMaterial({ map: bgTex, transparent: true, color: 0xdbeafe, depthWrite: false });
    this.bgMesh = new THREE.Mesh(bgGeo, bgMat);
    this.bgMesh.position.set(0, 4.8, -19);
    this.bgMesh.renderOrder = 0;
    this.scene.add(this.bgMesh);

    // C. Midground Pillars / Drapery (Exact manifest.txt path)
    const midGeo = new THREE.PlaneGeometry(28, 8.5);
    const midTex = this.loadTexture('assets/Architecture & Environment/nailmaster_03_0006_curtain_MID.png');
    const midMat = new THREE.MeshBasicMaterial({ map: midTex, transparent: true, opacity: 0.72, depthWrite: false });
    this.midMesh = new THREE.Mesh(midGeo, midMat);
    this.midMesh.position.set(0, 4.3, -8);
    this.midMesh.renderOrder = 1;
    this.scene.add(this.midMesh);

    // D. Foreground Framing Arches (Exact manifest.txt path)
    const fgGeo = new THREE.PlaneGeometry(28, 13);
    const fgTex = this.loadTexture('assets/Architecture & Environment/nailmaster_03_0003_FG.png');
    const fgMat = new THREE.MeshBasicMaterial({ map: fgTex, transparent: true, opacity: 0.85, depthWrite: false });
    this.fgMesh = new THREE.Mesh(fgGeo, fgMat);
    this.fgMesh.position.set(0, 3.1, 6.0);
    this.fgMesh.renderOrder = 20;
    this.scene.add(this.fgMesh);

    // E. Vertical Chamber Gate Door (Exact manifest.txt path: assets/Architecture & Environment/nailmaster_03_0007_door.png)
    const gateGeo = new THREE.PlaneGeometry(3.2, 5.4);
    const gateTex = this.loadTexture('assets/Architecture & Environment/nailmaster_03_0007_door.png');
    const gateMat = new THREE.MeshBasicMaterial({ map: gateTex, transparent: true, opacity: 0.92, depthWrite: false });
    this.chamberGateMesh = new THREE.Mesh(gateGeo, gateMat);
    this.chamberGateMesh.position.set(11.8, 2.6, -0.8);
    this.chamberGateMesh.renderOrder = 3;
    this.scene.add(this.chamberGateMesh);
  }

  async setupCharacterAnimations() {
    // 1. THE KNIGHT: Authentic frames extracted directly from The Knight master sprite atlas
    const knightOpts = { normalize: true, isKnight: true, defaultNativeFacing: -1, canvasWidth: 280, canvasHeight: 280, bottomPad: 15 };

    const knightIdleFrames = this.loadTextureArray([
      'assets/The Knight/knight_idle_00.png',
      'assets/The Knight/knight_idle_01.png',
      'assets/The Knight/knight_idle_02.png',
      'assets/The Knight/knight_idle_03.png'
    ], knightOpts);

    const knightRunFrames = this.loadTextureArray([
      'assets/The Knight/knight_run_00.png',
      'assets/The Knight/knight_run_01.png',
      'assets/The Knight/knight_run_02.png',
      'assets/The Knight/knight_run_03.png',
      'assets/The Knight/knight_run_04.png',
      'assets/The Knight/knight_run_05.png',
      'assets/The Knight/knight_run_06.png',
      'assets/The Knight/knight_run_07.png',
      'assets/The Knight/knight_run_08.png',
      'assets/The Knight/knight_run_09.png'
    ], knightOpts);

    const knightJumpFrames = this.loadTextureArray([
      'assets/The Knight/knight_jump_00.png',
      'assets/The Knight/knight_jump_01.png',
      'assets/The Knight/knight_jump_02.png',
      'assets/The Knight/knight_jump_03.png'
    ], knightOpts);

    const knightAttackFrames = this.loadTextureArray([
      'assets/The Knight/knight_attack_00.png',
      'assets/The Knight/knight_attack_01.png',
      'assets/The Knight/knight_attack_02.png',
      'assets/The Knight/knight_attack_03.png',
      'assets/The Knight/knight_attack_04.png',
      'assets/The Knight/knight_attack_05.png',
      'assets/The Knight/knight_attack_06.png',
      'assets/The Knight/knight_attack_07.png',
      'assets/The Knight/knight_attack_08.png',
      'assets/The Knight/knight_attack_09.png'
    ], knightOpts);

    const knightCastFrames = this.loadTextureArray([
      'assets/The Knight/knight_cast_00.png',
      'assets/The Knight/knight_cast_01.png',
      'assets/The Knight/knight_cast_02.png',
      'assets/The Knight/knight_cast_03.png',
      'assets/The Knight/knight_cast_04.png'
    ], knightOpts);

    const knightFocusFrames = this.loadTextureArray([
      'assets/The Knight/knight_focus_00.png',
      'assets/The Knight/knight_focus_01.png',
      'assets/The Knight/knight_focus_02.png',
      'assets/The Knight/knight_focus_03.png'
    ], knightOpts);

    const knightHurtFrames = this.loadTextureArray([
      'assets/The Knight/knight_hurt_00.png',
      'assets/The Knight/knight_hurt_01.png',
      'assets/The Knight/knight_hurt_02.png',
      'assets/The Knight/knight_hurt_03.png'
    ], knightOpts);

    const knightGeo = new THREE.PlaneGeometry(1, 1);
    const knightMat = new THREE.MeshBasicMaterial({
      map: knightIdleFrames[0],
      transparent: true,
      alphaTest: 0.03,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.knightMesh = new THREE.Mesh(knightGeo, knightMat);
    this.knightMesh.renderOrder = 10;
    this.scene.add(this.knightMesh);
    this.knightShadow = this.createGroundShadow(0.9, 0.42);

    this.knightAnimator = new SpriteAnimator(this.knightMesh, {
      idle: { frames: knightIdleFrames, fps: 8, loop: true, nativeFacing: -1 },
      run: { frames: knightRunFrames, fps: 16, loop: true, nativeFacing: -1 },
      jump: { frames: knightJumpFrames, fps: 10, loop: false, nativeFacing: -1 },
      attack: { frames: knightAttackFrames, fps: 22, loop: false, nativeFacing: -1 },
      cast: { frames: knightCastFrames, fps: 16, loop: false, nativeFacing: -1 },
      focus: { frames: knightFocusFrames, fps: 12, loop: true, nativeFacing: -1 },
      hurt: { frames: knightHurtFrames, fps: 10, loop: false, nativeFacing: -1 }
    }, 'idle', 2.45, false);

    this.player.groundY = this.knightAnimator.getGroundCenterY();
    this.player.pos.y = this.player.groundY;
    this.knightMesh.position.copy(this.player.pos);

    // 2. The Adversary Mesh & Animations
    const enemyGeo = new THREE.PlaneGeometry(1, 1);
    const enemyMat = new THREE.MeshBasicMaterial({
      map: knightIdleFrames[0],
      transparent: true,
      alphaTest: 0.03,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.enemyMesh = new THREE.Mesh(enemyGeo, enemyMat);
    this.enemyMesh.position.set(4.5, 1.5, 0);
    this.enemyMesh.renderOrder = 9;
    this.scene.add(this.enemyMesh);
    this.enemyShadow = this.createGroundShadow(1.3, 0.58);

    this.setupEnemyAnimator('hiveling');
  }

  setupEnemyAnimator(enemyType) {
    let animConfig = {};
    let baseH = 2.8;
    let isFlying = false;
    const enemyOpts = { normalize: true, defaultNativeFacing: -1, canvasWidth: 360, canvasHeight: 340, bottomPad: 12 };

    if (enemyType === 'hornet') {
      baseH = 2.75;
      const idleFrames = this.loadTextureArray([
        'assets/Bosses/Hornet/Hornet - idle0000.png',
        'assets/Bosses/Hornet/Hornet - idle0001.png'
      ], enemyOpts);
      const jumpFrames = [];
      for (let i = 0; i <= 9; i++) {
        jumpFrames.push(this.loadTexture(`assets/Bosses/Hornet/Hornet - jump000${i}.png`, enemyOpts));
      }
      const attackFrames = [];
      for (let i = 0; i <= 7; i++) {
        attackFrames.push(this.loadTexture(`assets/Bosses/Hornet/Hornet - throw_side000${i}.png`, enemyOpts));
      }
      attackFrames.push(this.loadTexture('assets/Bosses/Hornet/Hornet - harpoon_side0000.png', enemyOpts));
      attackFrames.push(this.loadTexture('assets/Bosses/Hornet/Hornet - harpoon_side0001.png', enemyOpts));
      const landFrames = [];
      for (let i = 0; i <= 5; i++) {
        landFrames.push(this.loadTexture(`assets/Bosses/Hornet/Hornet - hard_land000${i}.png`, enemyOpts));
      }
      animConfig = {
        idle: { frames: idleFrames, fps: 5, loop: true, nativeFacing: -1 },
        jump: { frames: jumpFrames, fps: 14, loop: false, nativeFacing: -1 },
        attack: { frames: attackFrames, fps: 16, loop: false, nativeFacing: -1 },
        land: { frames: landFrames, fps: 14, loop: false, nativeFacing: -1 }
      };

    } else if (enemyType === 'grimm') {
      baseH = 3.35;
      const bowFrames = [];
      for (let i = 0; i <= 6; i++) {
        bowFrames.push(this.loadTexture(`assets/Bosses/Grimm/GG_grimm_bow000${i}.png`, enemyOpts));
      }
      const idleFrames = [
        bowFrames[0],
        bowFrames[1],
        this.loadTexture('assets/Hunter_s Journal/Troupe Master Grimm - Bestiary_Grimm_boss.png', enemyOpts)
      ];
      const attackFrames = [
        ...bowFrames.slice(2),
        this.loadTexture('assets/Hunter_s Journal/Nightmare King Grimm - Bestiary_Grimm_Nightmare_boss.png', enemyOpts)
      ];
      animConfig = {
        idle: { frames: idleFrames, fps: 4, loop: true, nativeFacing: -1 },
        bow: { frames: bowFrames, fps: 10, loop: false, nativeFacing: -1 },
        attack: { frames: attackFrames, fps: 13, loop: false, nativeFacing: -1 }
      };

    } else if (enemyType === 'dung_defender') {
      baseH = 3.05;
      const idleFrames = this.loadTextureArray([
        'assets/Hunter_s Journal/Dung Defender - bestiary__0005_dung-defender.png',
        'assets/Bosses/Dung Defender & White Defender/dung_statues_0006_1.png'
      ], enemyOpts);
      const attackFrames = this.loadTextureArray([
        'assets/Hunter_s Journal/Dung Defender - bestiary__0005_dung-defender.png',
        'assets/Hunter_s Journal/White Defender - bestiary_White_Defender_full.png',
        'assets/Bosses/Dung Defender & White Defender/dung_statues_0006_1.png'
      ], enemyOpts);
      animConfig = {
        idle: { frames: idleFrames, fps: 3, loop: true, nativeFacing: -1 },
        attack: { frames: attackFrames, fps: 10, loop: false, nativeFacing: -1 }
      };

    } else if (enemyType === 'mantis') {
      baseH = 2.85;
      const idleFrames = this.loadTextureArray([
        'assets/Hunter_s Journal/Mantis Warrior - bestiary_mantis_f.png',
        'assets/Hunter_s Journal/Mantis Youth - bestiary_mantis_flyer_f.png',
        'assets/NPCs/Weavers/Weaver - idle0002.png',
        'assets/NPCs/Weavers/Weaver - idle0003.png',
        'assets/NPCs/Weavers/Weaver - idle0004.png',
        'assets/NPCs/Weavers/Weaver - idle0005.png'
      ], enemyOpts);
      const attackFrames = this.loadTextureArray([
        'assets/Hunter_s Journal/Mantis Warrior - bestiary_mantis_f.png',
        'assets/Hunter_s Journal/Mantis Lords - bestiary_mantis_lords_f.png',
        'assets/Hunter_s Journal/Mantis Traitor - bestiary_heavy_mantis_f.png',
        'assets/NPCs/Weavers/Weaver - crawl0000.png',
        'assets/NPCs/Weavers/Weaver - crawl0001.png',
        'assets/NPCs/Weavers/Weaver - crawl0002.png',
        'assets/NPCs/Weavers/Weaver - crawl0003.png'
      ], enemyOpts);
      animConfig = {
        idle: { frames: idleFrames, fps: 7, loop: true, nativeFacing: -1 },
        attack: { frames: attackFrames, fps: 14, loop: false, nativeFacing: -1 }
      };

    } else {
      // Hiveling Swarm (flying enemy)
      baseH = 2.15;
      isFlying = true;
      const flyFrames = [];
      for (let i = 0; i <= 4; i++) {
        flyFrames.push(this.loadTexture(`assets/Enemies & Corpses/Hiveling - fly000${i}.png`, enemyOpts));
      }
      const attackFrames = [
        this.loadTexture('assets/Enemies & Corpses/Hiveling - spawn_01.png', enemyOpts),
        this.loadTexture('assets/Enemies & Corpses/Hiveling - spawn_02.png', enemyOpts),
        ...flyFrames
      ];
      animConfig = {
        idle: { frames: flyFrames, fps: 15, loop: true, nativeFacing: -1 },
        fly: { frames: flyFrames, fps: 15, loop: true, nativeFacing: -1 },
        attack: { frames: attackFrames, fps: 20, loop: false, nativeFacing: -1 }
      };
    }

    this.enemyAnimator = new SpriteAnimator(this.enemyMesh, animConfig, 'idle', baseH, isFlying);
    this.enemyAnimator.facing = -1; // Face left towards the Knight by default
    this.enemyMesh.position.y = isFlying ? 2.05 : this.enemyAnimator.getGroundCenterY();

    if (enemyType === 'grimm') {
      this.enemyAnimator.play('bow', () => {
        this.enemyAnimator.play('idle');
      }, true);
    }
  }

  buildVFX() {
    // 1. Multi-Frame Radiance Slash Effect (11 animated frames from manifest.txt)
    const slashFrames = [];
    for (let i = 0; i <= 10; i++) {
      const numStr = i < 10 ? `000${i}` : `00${i}`;
      slashFrames.push(this.loadTexture(`assets/Particles & Effects/Radiance_GG_slashes${numStr}.png`));
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
    this.slashMesh.position.set(0, 1.6, 0.35);
    this.slashMesh.renderOrder = 14;
    this.scene.add(this.slashMesh);

    this.slashAnimator = new SpriteAnimator(this.slashMesh, {
      slash: { frames: slashFrames, fps: 28, loop: false }
    }, null, 3.3);

    // 2. Multi-Frame Dash Effect (5 animated frames from manifest.txt)
    const dashFrames = [];
    for (let i = 0; i <= 4; i++) {
      dashFrames.push(this.loadTexture(`assets/Particles & Effects/dash_effect_02000${i}.png`));
    }
    const dashGeo = new THREE.PlaneGeometry(1, 1);
    const dashMat = new THREE.MeshBasicMaterial({
      map: dashFrames[0],
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.dashMesh = new THREE.Mesh(dashGeo, dashMat);
    this.dashMesh.position.set(-5.0, 1.2, 0.2);
    this.dashMesh.renderOrder = 12;
    this.scene.add(this.dashMesh);

    this.dashAnimator = new SpriteAnimator(this.dashMesh, {
      dash: { frames: dashFrames, fps: 24, loop: false }
    }, null, 2.2);

    // 3. Focus Ring Aura (Pure Vessel focus ring from manifest.txt)
    const ringTex = this.loadTexture('assets/Bosses/The Hollow Knight/Pure Vessel focus ring -  focus_ring.png');
    const ringGeo = new THREE.PlaneGeometry(3.2, 3.2);
    const ringMat = new THREE.MeshBasicMaterial({
      map: ringTex,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.focusRingMesh = new THREE.Mesh(ringGeo, ringMat);
    this.focusRingMesh.renderOrder = 13;
    this.scene.add(this.focusRingMesh);

    // 4. Vengeful Spirit Spell Projectile (Soul_burst0000..0004.png + soul_orb.png)
    const spellFrames = [];
    for (let i = 0; i <= 4; i++) {
      spellFrames.push(this.loadTexture(`assets/Particles & Effects/Soul_burst000${i}.png`));
    }
    const spellTex = this.loadTexture('assets/Particles & Effects/soul_orb.png');
    const spellGeo = new THREE.PlaneGeometry(2.8, 2.1);
    const spellMat = new THREE.MeshBasicMaterial({
      map: spellTex,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.spellProjectile = new THREE.Mesh(spellGeo, spellMat);
    this.spellProjectile.position.set(-3.0, 1.5, 0.35);
    this.spellProjectile.renderOrder = 15;
    this.scene.add(this.spellProjectile);

    this.spellAnimator = new SpriteAnimator(this.spellProjectile, {
      burst: { frames: spellFrames, fps: 18, loop: true }
    }, 'burst', 2.2);
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
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particleSystem = new THREE.Points(geometry, material);
    this.particleSystem.renderOrder = 18;
    this.scene.add(this.particleSystem);
  }

  triggerJump() {
    if (this.player.isGrounded && !window.battleManager.isTrialModalOpen()) {
      this.player.vel.y = this.player.jumpForce;
      this.player.isGrounded = false;
      window.soundEngine.playJump();
      this.knightAnimator.play('jump', null, true);
    }
  }

  triggerDash() {
    if (!this.player.isDashing && !window.battleManager.isTrialModalOpen()) {
      this.player.isDashing = true;
      this.player.dashTimer = 0.24;
      this.player.vel.x = this.player.facing * 18.5;
      window.soundEngine.playDash();
      this.triggerScreenShake(0.22);

      if (this.dashMesh && this.dashAnimator) {
        this.dashMesh.position.set(this.player.pos.x - this.player.facing * 0.8, this.player.pos.y, this.player.pos.z + 0.15);
        this.dashAnimator.facing = this.player.facing;
        this.dashMesh.material.opacity = 0.92;
        this.dashAnimator.play('dash', () => {
          this.dashMesh.material.opacity = 0;
        }, true);
      }
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

    // Local assets/ folder linker for standalone browser / Canvas hot-reloading
    const linkBtn = document.getElementById('btn-link-assets');
    const folderInput = document.getElementById('assets-folder-input');
    if (linkBtn && folderInput) {
      linkBtn.addEventListener('click', () => folderInput.click());
      folderInput.addEventListener('change', (ev) => {
        const files = Array.from(ev.target.files || []);
        if (!files.length) return;
        let count = 0;
        files.forEach((file) => {
          if (!file.name.toLowerCase().endsWith('.png')) return;
          const blobUrl = URL.createObjectURL(file);
          const rel = (file.webkitRelativePath || file.name).replace(/\\/g, '/');
          const idx = rel.indexOf('assets/');
          if (idx !== -1) {
            this.localBlobUrls[rel.slice(idx)] = blobUrl;
          } else {
            const parts = rel.split('/');
            if (parts.length > 1) {
              this.localBlobUrls['assets/' + parts.slice(1).join('/')] = blobUrl;
            }
          }
          this.localBlobUrls[file.name] = blobUrl;
          count++;
        });
        this.reloadAllLoadedTextures();
        if (window.battleManager) window.battleManager.updateHUD();
        linkBtn.textContent = `✅ ${count} Sprites Linked`;
      });
    }
  }

  setChamberStage(chamberIndex, enemyType) {
    // Full-resolution room backgrounds from manifest.txt (NOT stretched 732x117 save banners!)
    const bgTextures = [
      'assets/Architecture & Environment/nailmaster_03_0008_BG.png',
      'assets/Architecture & Environment/Area specfic architecture/Greenpath/nailmaster_fung_hut_02.png',
      'assets/Architecture & Environment/Tram & Stagways/tram_BG_wrecked.png',
      'assets/Architecture & Environment/Area specfic architecture/City of Tears/Ruins_Houses_0004_1bg.png',
      'assets/Architecture & Environment/Area specfic architecture/Dirtmouth/Grimm Tents/Divine_Room_0005_1.png'
    ];

    const path = bgTextures[chamberIndex % bgTextures.length];
    if (this.bgMesh) {
      this.bgMesh.material.map = this.loadTexture(path);
      this.bgMesh.material.needsUpdate = true;
    }

    this.setupEnemyAnimator(enemyType);

    // Reset player position on stone floor
    const gy = this.knightAnimator ? this.knightAnimator.getGroundCenterY() : 1.15;
    this.player.groundY = gy;
    this.player.pos.set(-5.0, gy, 0);
    this.player.vel.set(0, 0, 0);
    this.player.facing = 1;
  }

  setEnemyData(enemyData) {
    if (!this.enemyMesh || !this.enemyAnimator) return;
    this.enemyAnimator.scaleMultiplier = enemyData.scale || 1.0;
    this.enemyAnimator.syncAspectScale();
    this.enemyMesh.position.y = this.enemyAnimator.isFlying
      ? 2.05
      : this.enemyAnimator.getGroundCenterY();

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
    const strikeX = this.enemyMesh.position.x - 1.75;
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

        this.slashMesh.position.set(this.enemyMesh.position.x - 0.25, this.enemyMesh.position.y, 0.4);
        this.slashAnimator.scaleMultiplier = isGreatSlash ? 1.65 : 1.05;
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
          const retDuration = 210;
          const returnX = -5.0;
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
        }, 230);
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

    const startX = this.player.pos.x + 1.1;
    const targetX = this.enemyMesh.position.x - 0.3;
    const startTime = performance.now();
    const duration = 450;

    this.spellProjectile.material.opacity = 1.0;
    this.triggerScreenShake(0.35);

    const animateSpell = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1.0);

      const currentX = startX + (targetX - startX) * progress;
      const currentY = this.player.pos.y + 0.25 + Math.sin(progress * Math.PI) * 0.35;

      this.spellProjectile.position.set(currentX, currentY, 0.4);

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
    this.knightAnimator.play('focus', null, true);

    const originalIntensity = this.knightLight.intensity;
    this.knightLight.intensity = 5.8;

    if (this.focusRingMesh) {
      this.focusRingMesh.position.set(this.player.pos.x, this.player.pos.y + 0.15, this.player.pos.z + 0.25);
      this.focusRingMesh.material.opacity = 0.92;
      const startT = performance.now();
      const animRing = (now) => {
        const p = Math.min((now - startT) / 650, 1.0);
        const s = 0.5 + p * 1.1;
        this.focusRingMesh.scale.set(s, s, 1);
        this.focusRingMesh.material.opacity = 0.92 * (1 - p);
        if (p < 1.0) requestAnimationFrame(animRing);
      };
      requestAnimationFrame(animRing);
    }

    setTimeout(() => {
      this.knightLight.intensity = originalIntensity;
      this.player.state = 'idle';
      this.knightAnimator.play('idle');
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
    if (this.enemyAnimator) {
      if (this.enemyAnimator.animations['attack']) {
        this.enemyAnimator.play('attack', null, true);
      }
    }

    const startX = this.enemyMesh.position.x;
    const baseGroundY = this.enemyAnimator && !this.enemyAnimator.isFlying
      ? this.enemyAnimator.getGroundCenterY()
      : 2.05;
    const lungeX = this.player.pos.x + 1.35;
    const startTime = performance.now();
    const duration = 520;
    const hasJump = Boolean(this.enemyAnimator && this.enemyAnimator.animations['jump']);

    const animateEnemyLunge = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1.0);

      if (hasJump) {
        this.enemyMesh.position.y = baseGroundY + Math.sin(progress * Math.PI) * 1.1;
      }

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
        this.enemyMesh.position.y = baseGroundY;
        if (this.enemyAnimator) {
          if (this.enemyAnimator.animations['land']) {
            this.enemyAnimator.play('land', () => this.enemyAnimator.play('idle'), true);
          } else {
            this.enemyAnimator.play('idle');
          }
        }
        if (callback) callback();
      }
    };
    requestAnimationFrame(animateEnemyLunge);
  }

  triggerKnightHurt() {
    this.player.state = 'hurt';
    this.knightAnimator.play('hurt', null, true);

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

    // 2. Vertical Gravity & Ground Floor Collision
    this.player.groundY = this.knightAnimator ? this.knightAnimator.getGroundCenterY() : 1.15;
    this.player.vel.y += this.player.gravity * delta;
    this.player.pos.y += this.player.vel.y * delta;
    this.player.pos.x += this.player.vel.x * delta;

    if (this.player.pos.y <= this.player.groundY) {
      this.player.pos.y = this.player.groundY;
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

    // 4. Update Enemy Dynamic Facing toward Knight
    if (this.enemyMesh && this.enemyAnimator && !this.player.isLunging) {
      this.enemyAnimator.facing = (this.player.pos.x <= this.enemyMesh.position.x) ? -1 : 1;
      this.enemyAnimator.syncAspectScale();
    }

    // 5. Update Knight Animation State
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
    if (this.dashAnimator) this.dashAnimator.update(delta);
    if (this.spellAnimator) this.spellAnimator.update(delta);

    // 3. Enemy Ground / Hover Positioning & Shadows
    if (this.enemyMesh && this.enemyAnimator && this.enemyAnimator.currentAnim === 'idle') {
      if (this.enemyAnimator.isFlying) {
        this.enemyMesh.position.y = 2.05 + Math.sin(time * 3.4) * 0.16;
      } else {
        this.enemyMesh.position.y = this.enemyAnimator.getGroundCenterY() + Math.sin(time * 2.2) * 0.03;
      }
    }
    if (this.knightShadow && this.knightMesh) {
      this.knightShadow.position.x = this.knightMesh.position.x;
      this.knightShadow.position.z = this.knightMesh.position.z;
      const hFactor = Math.max(0.4, 1.0 - (this.knightMesh.position.y - this.player.groundY) * 0.15);
      this.knightShadow.scale.set(0.9 * hFactor, 0.42 * hFactor, 1);
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
    this.camera.position.y = 3.1 + shakeY;

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
