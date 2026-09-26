(function () {
    // Звуковые эффекты (Web Audio API)
    const AudioFX = {
        ctx: null,
        enabled: localStorage.getItem('sfx_enabled') === 'true',

        init() {
            const soundBtn = document.getElementById('soundToggle');
            const soundIcon = document.getElementById('soundIcon');

            this.updateUI();

            if (soundBtn) {
                soundBtn.addEventListener('click', () => {
                    this.enabled = !this.enabled;
                    localStorage.setItem('sfx_enabled', this.enabled);
                    this.updateUI();
                    if (this.enabled) {
                        this.ensureContext();
                        this.playClick();
                    }
                });
            }
        },

        updateUI() {
            const soundBtn = document.getElementById('soundToggle');
            const soundIcon = document.getElementById('soundIcon');
            if (soundBtn && soundIcon) {
                if (this.enabled) {
                    soundBtn.classList.add('active-sound');
                    soundIcon.className = 'fas fa-volume-up';
                } else {
                    soundBtn.classList.remove('active-sound');
                    soundIcon.className = 'fas fa-volume-mute';
                }
            }
        },

        ensureContext() {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    this.ctx = new AudioCtx();
                }
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        },

        playHover() {
            if (!this.enabled) return;
            this.ensureContext();
            if (!this.ctx) return;

            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(260, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(420, this.ctx.currentTime + 0.06);

                gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start();
                osc.stop(this.ctx.currentTime + 0.06);
            } catch (e) { }
        },

        playClick() {
            if (!this.enabled) return;
            this.ensureContext();
            if (!this.ctx) return;

            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(580, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(160, this.ctx.currentTime + 0.1);

                gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start();
                osc.stop(this.ctx.currentTime + 0.1);
            } catch (e) { }
        },

        playSearch() {
            if (!this.enabled) return;
            this.ensureContext();
            if (!this.ctx) return;

            try {
                const now = this.ctx.currentTime;
                const osc1 = this.ctx.createOscillator();
                const osc2 = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc1.type = 'sine';
                osc2.type = 'sine';

                osc1.frequency.setValueAtTime(440, now);
                osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15);

                osc2.frequency.setValueAtTime(660, now + 0.05);
                osc2.frequency.exponentialRampToValueAtTime(1320, now + 0.2);

                gain.gain.setValueAtTime(0.06, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

                osc1.connect(gain);
                osc2.connect(gain);
                gain.connect(this.ctx.destination);

                osc1.start(now);
                osc1.stop(now + 0.25);
                osc2.start(now + 0.05);
                osc2.stop(now + 0.25);
            } catch (e) { }
        }
    };

    // Глобальная функция взаимного закрытия выпадающих меню
    window.closeAllDropdowns = function () {
        const dropdowns = [
            { wrapper: 'themeDropdownWrapper', menu: 'themeMenu' },
            { wrapper: 'langDropdownWrapper', menu: 'langMenu' },
            { wrapper: 'bgModeDropdownWrapper', menu: 'bgModeMenu' }
        ];
        dropdowns.forEach(d => {
            const w = document.getElementById(d.wrapper);
            const m = document.getElementById(d.menu);
            if (w) w.classList.remove('active');
            if (m) m.classList.remove('active');
        });
        if (typeof TooltipEngine !== 'undefined' && TooltipEngine.hide) {
            TooltipEngine.hide();
        }
    };

    // Фоновые анимации canvas (Матрица и Неоновые частицы)
    const CanvasFX = {
        canvas: null,
        ctx: null,
        mode: localStorage.getItem('bg_mode') || 'grid',
        animationFrame: null,

        // Matrix state
        matrixDrops: [],
        lastMatrixTime: 0,
        chars: '天地玄黃宇宙洪荒日月盈昃辰宿列張寒來暑往秋收冬藏雲騰致雨露結為霜金生麗水玉出崑岡劍號巨闕珠稱夜光果珍李重芥姜海鹹河淡鱗潛羽翔龍師火帝鳥官人皇始制文字乃服衣裳推位讓國有虞陶唐弔民伐罪周發殷湯坐朝問道垂拱平章愛育黎首臣伏戎羌暇邇壹體率賓歸王電光影龍鳳天雲風火水木金土星月日山川海神心魂夢無極微網碼字虛實陰陽玄靈道法自然太極乾坤震巽坎離艮兌',

        // Particles state
        particles: [],
        mouse: { x: null, y: null },

        init() {
            this.canvas = document.getElementById('fxCanvas');
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');

            this.resize();
            window.addEventListener('resize', () => this.resize());

            window.addEventListener('mousemove', (e) => {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
            });

            const wrapper = document.getElementById('bgModeDropdownWrapper');
            const toggleBtn = document.getElementById('bgModeToggleBtn');
            const menu = document.getElementById('bgModeMenu');

            if (wrapper && toggleBtn && menu) {
                const options = menu.querySelectorAll('.mode-option');

                const updateActiveUI = (modeVal) => {
                    options.forEach(opt => {
                        if (opt.dataset.modeVal === modeVal) {
                            opt.classList.add('active');
                            const iconClass = opt.querySelector('i')?.className;
                            const mainIcon = document.getElementById('bgModeIcon');
                            if (mainIcon && iconClass) {
                                mainIcon.className = iconClass;
                            }
                        } else {
                            opt.classList.remove('active');
                        }
                    });
                };

                updateActiveUI(this.mode);

                toggleBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isOpen = menu.classList.contains('active');
                    window.closeAllDropdowns();
                    if (!isOpen) {
                        menu.classList.add('active');
                        wrapper.classList.add('active');
                    }
                    AudioFX.playClick();
                });

                document.addEventListener('click', (e) => {
                    if (!wrapper.contains(e.target)) {
                        menu.classList.remove('active');
                        wrapper.classList.remove('active');
                    }
                });

                options.forEach(opt => {
                    opt.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const newMode = opt.dataset.modeVal;
                        if (newMode) {
                            this.setMode(newMode);
                            updateActiveUI(newMode);
                            AudioFX.playClick();
                        }
                        menu.classList.remove('active');
                        wrapper.classList.remove('active');
                    });
                });
            }

            this.setMode(this.mode);
        },

        resize() {
            if (!this.canvas) return;
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.initMatrix();
            this.initParticles();
        },

        setMode(newMode) {
            this.mode = newMode;
            localStorage.setItem('bg_mode', newMode);

            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
            }

            if (newMode === 'grid') {
                this.canvas.classList.remove('active');
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            } else {
                this.canvas.classList.add('active');
                if (newMode === 'matrix') {
                    this.initMatrix();
                    this.renderMatrix(performance.now());
                } else if (newMode === 'particles') {
                    this.initParticles();
                    this.renderParticles();
                } else if (newMode === 'fireflies') {
                    this.initFireflies();
                    this.renderFireflies();
                }
            }
        },

        getThemeColors() {
            const theme = document.documentElement.dataset.theme || 'dark';
            switch (theme) {
                case 'light':
                    return {
                        fadeBg: 'rgba(248, 250, 252, 0.08)',
                        lead: '#0284c7',
                        trail: '#7c3aed',
                        particles: ['#0284c7', '#7c3aed'],
                        fireflies: ['rgba(2, 132, 199, ', 'rgba(124, 58, 237, ', 'rgba(14, 165, 233, '],
                        mouseStroke: (alpha) => `rgba(2, 132, 199, ${alpha})`,
                        linkStroke: (alpha) => `rgba(124, 58, 237, ${alpha})`
                    };
                case 'emerald':
                    return {
                        fadeBg: 'rgba(3, 20, 14, 0.08)',
                        lead: '#6ee7b7',
                        trail: '#10b981',
                        particles: ['#34d399', '#10b981', '#f59e0b'],
                        fireflies: ['rgba(52, 211, 153, ', 'rgba(16, 185, 129, ', 'rgba(245, 158, 11, '],
                        mouseStroke: (alpha) => `rgba(52, 211, 153, ${alpha})`,
                        linkStroke: (alpha) => `rgba(245, 158, 11, ${alpha})`
                    };
                case 'velvet':
                    return {
                        fadeBg: 'rgba(24, 3, 9, 0.08)',
                        lead: '#fecdd3',
                        trail: '#f43f5e',
                        particles: ['#f43f5e', '#e11d48', '#fbbf24'],
                        fireflies: ['rgba(244, 63, 94, ', 'rgba(225, 29, 72, ', 'rgba(251, 191, 36, '],
                        mouseStroke: (alpha) => `rgba(244, 63, 94, ${alpha})`,
                        linkStroke: (alpha) => `rgba(251, 191, 36, ${alpha})`
                    };
                case 'dark':
                default:
                    return {
                        fadeBg: 'rgba(2, 5, 14, 0.08)',
                        lead: '#ffffff',
                        trail: '#38bdf8',
                        particles: ['#38bdf8', '#a855f7'],
                        fireflies: ['rgba(56, 189, 248, ', 'rgba(168, 85, 247, ', 'rgba(99, 102, 241, '],
                        mouseStroke: (alpha) => `rgba(56, 189, 248, ${alpha})`,
                        linkStroke: (alpha) => `rgba(168, 85, 247, ${alpha})`
                    };
            }
        },

        initMatrix() {
            const fontSize = 16;
            const columns = Math.floor(this.canvas.width / fontSize);
            const trailLength = 12;
            this.matrixDrops = [];
            for (let i = 0; i < columns; i++) {
                const chars = [];
                for (let c = 0; c < trailLength; c++) {
                    chars.push(this.chars[Math.floor(Math.random() * this.chars.length)]);
                }
                this.matrixDrops[i] = {
                    y: Math.floor(Math.random() * -40),
                    speed: Math.floor(Math.random() * 2) + 1,
                    chars: chars
                };
            }
        },

        renderMatrix(timestamp = 0) {
            if (this.mode !== 'matrix') return;

            // Throttle to ~30 FPS to eliminate hyper-speed strobe flickering
            if (timestamp - this.lastMatrixTime < 33) {
                this.animationFrame = requestAnimationFrame((t) => this.renderMatrix(t));
                return;
            }
            this.lastMatrixTime = timestamp;

            const fontSize = 16;
            const trailLength = 12;
            const colors = this.getThemeColors();

            // Clear canvas completely so underlying wallpaper image remains 100% visible
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.font = `${fontSize}px "JetBrains Mono", "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", "SimSun", sans-serif`;

            for (let i = 0; i < this.matrixDrops.length; i++) {
                const drop = this.matrixDrops[i];
                const x = i * fontSize;

                if (!drop.chars || drop.chars.length < trailLength) {
                    drop.chars = [];
                    for (let c = 0; c < trailLength; c++) {
                        drop.chars.push(this.chars[Math.floor(Math.random() * this.chars.length)]);
                    }
                }

                // Randomly mutate trailing characters for dynamic Matrix flicker
                if (Math.random() < 0.12) {
                    const mutateIdx = Math.floor(Math.random() * trailLength);
                    drop.chars[mutateIdx] = this.chars[Math.floor(Math.random() * this.chars.length)];
                }

                for (let t = 0; t < trailLength; t++) {
                    const charRow = drop.y - t;
                    const y = charRow * fontSize;

                    if (charRow > 0 && y < this.canvas.height + fontSize) {
                        const char = drop.chars[t] || this.chars[0];
                        const alpha = (1 - t / trailLength) * 0.95;

                        if (t === 0) {
                            // Bright lead character with glow
                            this.ctx.fillStyle = colors.lead;
                            this.ctx.shadowColor = colors.lead;
                            this.ctx.shadowBlur = 8;
                            this.ctx.globalAlpha = 1;
                            this.ctx.fillText(char, x, y);
                            this.ctx.shadowBlur = 0;
                        } else {
                            // Trailing characters fading out smoothly
                            this.ctx.fillStyle = colors.trail;
                            this.ctx.globalAlpha = alpha;
                            this.ctx.fillText(char, x, y);
                        }
                    }
                }

                this.ctx.globalAlpha = 1;
                drop.y += drop.speed;

                if ((drop.y - trailLength) * fontSize > this.canvas.height && Math.random() > 0.975) {
                    drop.y = Math.floor(Math.random() * -15);
                    drop.speed = Math.floor(Math.random() * 2) + 1;
                }
            }

            if (this.mode === 'matrix') {
                this.animationFrame = requestAnimationFrame((t) => this.renderMatrix(t));
            }
        },

        initParticles() {
            const isMobile = window.innerWidth < 600;
            const divisor = isMobile ? 22000 : 12000;
            const maxCount = isMobile ? 32 : 70;
            const count = Math.min(Math.floor((this.canvas.width * this.canvas.height) / divisor), maxCount);
            const colors = this.getThemeColors();
            this.particles = [];
            for (let i = 0; i < count; i++) {
                const pColor = colors.particles[Math.floor(Math.random() * colors.particles.length)];
                this.particles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    vx: (Math.random() - 0.5) * (isMobile ? 0.8 : 1.2),
                    vy: (Math.random() - 0.5) * (isMobile ? 0.8 : 1.2),
                    radius: Math.random() * 2 + 1,
                    color: pColor
                });
            }
        },

        renderParticles() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            const colors = this.getThemeColors();

            for (let i = 0; i < this.particles.length; i++) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = p.color;
                this.ctx.shadowColor = p.color;
                this.ctx.shadowBlur = 10;
                this.ctx.fill();

                // Connect to mouse
                if (this.mouse.x !== null) {
                    const dx = this.mouse.x - p.x;
                    const dy = this.mouse.y - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 140) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(p.x, p.y);
                        this.ctx.lineTo(this.mouse.x, this.mouse.y);
                        this.ctx.strokeStyle = colors.mouseStroke(0.4 * (1 - dist / 140));
                        this.ctx.lineWidth = 1;
                        this.ctx.stroke();
                    }
                }

                // Connect to adjacent particles
                for (let j = i + 1; j < this.particles.length; j++) {
                    const p2 = this.particles[j];
                    const dx = p2.x - p.x;
                    const dy = p2.y - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 100) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(p.x, p.y);
                        this.ctx.lineTo(p2.x, p2.y);
                        this.ctx.strokeStyle = colors.linkStroke(0.25 * (1 - dist / 100));
                        this.ctx.lineWidth = 0.8;
                        this.ctx.stroke();
                    }
                }
            }

            if (this.mode === 'particles') {
                this.animationFrame = requestAnimationFrame(() => this.renderParticles());
            }
        },

        initFireflies() {
            const isMobile = window.innerWidth < 600;
            const count = isMobile ? 35 : 75;
            this.fireflies = [];
            this.sparks = [];

            for (let i = 0; i < count; i++) {
                this.fireflies.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    baseRadius: Math.random() * 2.5 + 1.2,
                    vx: (Math.random() - 0.5) * 0.45,
                    vy: (Math.random() - 0.5) * 0.45,
                    pulse: Math.random() * Math.PI * 2,
                    pulseSpeed: Math.random() * 0.03 + 0.01,
                    colorIdx: Math.floor(Math.random() * 3)
                });
            }

            this.lastMouse = { x: null, y: null };
        },

        renderFireflies() {
            if (this.mode !== 'fireflies') return;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            const colors = this.getThemeColors();
            const w = this.canvas.width;
            const h = this.canvas.height;

            // 1. Spawn micro spark trail when mouse moves
            if (this.mouse.x !== null && this.mouse.y !== null) {
                if (this.lastMouse.x !== null) {
                    const distMoved = Math.hypot(this.mouse.x - this.lastMouse.x, this.mouse.y - this.lastMouse.y);
                    if (distMoved > 4 && this.sparks.length < 80) {
                        this.sparks.push({
                            x: this.mouse.x + (Math.random() - 0.5) * 12,
                            y: this.mouse.y + (Math.random() - 0.5) * 12,
                            vx: (Math.random() - 0.5) * 0.8,
                            vy: (Math.random() - 0.5) * 0.8 - 0.3,
                            life: 1.0,
                            decay: Math.random() * 0.025 + 0.015,
                            radius: Math.random() * 1.8 + 0.6,
                            colorIdx: Math.floor(Math.random() * 3)
                        });
                    }
                }
                this.lastMouse.x = this.mouse.x;
                this.lastMouse.y = this.mouse.y;
            }

            // 2. Render Micro Sparks
            for (let i = this.sparks.length - 1; i >= 0; i--) {
                const s = this.sparks[i];
                s.x += s.vx;
                s.y += s.vy;
                s.life -= s.decay;

                if (s.life <= 0) {
                    this.sparks.splice(i, 1);
                    continue;
                }

                const colorBase = colors.fireflies[s.colorIdx];
                this.ctx.beginPath();
                this.ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = colorBase + (s.life * 0.8) + ')';
                this.ctx.fill();
            }

            // 3. Render Floating Firefly Orbs with Soft Radial Glow
            for (let i = 0; i < this.fireflies.length; i++) {
                const f = this.fireflies[i];

                // Smooth organic wandering physics
                f.vx += (Math.random() - 0.5) * 0.06;
                f.vy += (Math.random() - 0.5) * 0.06;

                // Speed limit
                const speed = Math.hypot(f.vx, f.vy);
                if (speed > 0.8) {
                    f.vx = (f.vx / speed) * 0.8;
                    f.vy = (f.vy / speed) * 0.8;
                }

                // Interactive Mouse repulsion / attraction
                let mouseGlowBoost = 0;
                if (this.mouse.x !== null && this.mouse.y !== null) {
                    const dx = f.x - this.mouse.x;
                    const dy = f.y - this.mouse.y;
                    const dist = Math.hypot(dx, dy);
                    const maxDist = 160;

                    if (dist < maxDist) {
                        const factor = (1 - dist / maxDist);
                        f.vx += (dx / dist) * factor * 0.15;
                        f.vy += (dy / dist) * factor * 0.15;
                        mouseGlowBoost = factor * 0.45;
                    }
                }

                f.x += f.vx;
                f.y += f.vy;

                // Screen Wrap / Bouncing
                if (f.x < -20) f.x = w + 20;
                if (f.x > w + 20) f.x = -20;
                if (f.y < -20) f.y = h + 20;
                if (f.y > h + 20) f.y = -20;

                // Pulsing brightness
                f.pulse += f.pulseSpeed;
                const alpha = Math.min(1.0, (Math.sin(f.pulse) + 1) / 2 * 0.6 + 0.25 + mouseGlowBoost);
                const currentRadius = f.baseRadius * (1 + mouseGlowBoost * 0.5);

                const colorBase = colors.fireflies[f.colorIdx];

                // Soft blurred radial halo
                const glowRadius = currentRadius * (4 + mouseGlowBoost * 3);
                const grad = this.ctx.createRadialGradient(
                    f.x, f.y, currentRadius * 0.2,
                    f.x, f.y, glowRadius
                );
                grad.addColorStop(0, colorBase + alpha + ')');
                grad.addColorStop(0.3, colorBase + (alpha * 0.4) + ')');
                grad.addColorStop(1, 'transparent');

                this.ctx.beginPath();
                this.ctx.arc(f.x, f.y, glowRadius, 0, Math.PI * 2);
                this.ctx.fillStyle = grad;
                this.ctx.fill();

                // Core intense center dot
                this.ctx.beginPath();
                this.ctx.arc(f.x, f.y, currentRadius * 0.8, 0, Math.PI * 2);
                this.ctx.fillStyle = colors.lead;
                this.ctx.globalAlpha = alpha;
                this.ctx.fill();
                this.ctx.globalAlpha = 1.0;
            }

            if (this.mode === 'fireflies') {
                this.animationFrame = requestAnimationFrame(() => this.renderFireflies());
            }
        }
    };

    // Загрузка репозиториев и статистик с GitHub API
    const GitHubWidget = {
        username: 'DarkimuSSS',

        async init() {
            const statusText = document.getElementById('statusText');
            const reposGrid = document.getElementById('reposGrid');
            const statRepos = document.getElementById('statRepos');
            const statFollowers = document.getElementById('statFollowers');
            const statStars = document.getElementById('statStars');

            try {
                // Fetch User info
                const userRes = await fetch(`https://api.github.com/users/${this.username}`);
                if (!userRes.ok) throw new Error('GitHub API Limit or Offline');
                const userData = await userRes.json();

                // Fetch Repos
                const reposRes = await fetch(`https://api.github.com/users/${this.username}/repos?sort=updated&per_page=6`);
                if (!reposRes.ok) throw new Error('GitHub Repos API Limit');
                const reposData = await reposRes.json();

                const totalStars = reposData.reduce((acc, r) => acc + r.stargazers_count, 0);

                if (statRepos) statRepos.textContent = userData.public_repos || reposData.length;
                if (statFollowers) statFollowers.textContent = userData.followers || 0;
                if (statStars) statStars.textContent = totalStars;

                if (statusText) statusText.textContent = 'Онлайн';

                this.renderRepos(reposData);

            } catch (err) {
                console.log('GitHub widget fallback mode:', err);
                if (statusText) statusText.textContent = 'Активен';

                // Curated fallback data
                const fallbackRepos = [
                    {
                        name: 'darkimusss.github.io',
                        html_url: 'https://github.com/DarkimuSSS/darkimusss.github.io',
                        description: 'Личный портал и веб-интерфейс в формате Cyberpunk / Glassmorphism.',
                        language: 'JavaScript',
                        stargazers_count: 1
                    },
                    {
                        name: 'dark-core-projects',
                        html_url: 'https://github.com/DarkimuSSS',
                        description: 'Набор основных проектов, скриптов и систем управления.',
                        language: 'Python',
                        stargazers_count: 3
                    }
                ];

                if (statRepos) statRepos.textContent = '2+';
                if (statFollowers) statFollowers.textContent = '1+';
                if (statStars) statStars.textContent = '4';

                this.renderRepos(fallbackRepos);
            }
        },

        renderRepos(repos) {
            const grid = document.getElementById('reposGrid');
            if (!grid) return;
            grid.innerHTML = '';

            repos.slice(0, 4).forEach(repo => {
                const card = document.createElement('a');
                card.className = 'repo-card';
                card.href = repo.html_url;
                card.target = '_blank';
                card.rel = 'noopener noreferrer';

                const langColors = {
                    JavaScript: '#f1e05a',
                    TypeScript: '#3178c6',
                    Python: '#3572A5',
                    HTML: '#e34c26',
                    CSS: '#563d7c'
                };

                const langColor = langColors[repo.language] || 'var(--accent-cyan)';

                card.innerHTML = `
                    <div class="repo-top">
                        <div class="repo-name">
                            <i class="far fa-bookmark"></i>
                            ${repo.name}
                        </div>
                    </div>
                    <div class="repo-desc">${repo.description || 'Описание пока отсутствует...'}</div>
                    <div class="repo-meta">
                        ${repo.language ? `
                            <div class="repo-lang">
                                <span class="lang-dot" style="background:${langColor}"></span>
                                ${repo.language}
                            </div>
                        ` : ''}
                        <div class="repo-stars">
                            <i class="fas fa-star"></i>
                            ${repo.stargazers_count}
                        </div>
                    </div>
                `;

                card.addEventListener('mouseenter', () => AudioFX.playHover());
                card.addEventListener('click', () => AudioFX.playClick());

                grid.appendChild(card);
            });
        }
    };

    // ==========================================================================
    // 4. Page Animations & Interactions
    // ==========================================================================
    // Анимации текста и реакция элементов
    const TypewriterEngine = {
        timerId: null,
        type(text) {
            const el = document.getElementById('typewriter');
            if (!el) return;

            if (this.timerId) {
                clearTimeout(this.timerId);
                this.timerId = null;
            }

            el.textContent = '';
            el.classList.remove('typing-done');

            let index = 0;
            const step = () => {
                if (index < text.length) {
                    el.textContent += text.charAt(index);
                    index++;
                    this.timerId = setTimeout(step, 45);
                } else {
                    el.classList.add('typing-done');
                    this.timerId = null;
                }
            };
            this.timerId = setTimeout(step, 200);
        }
    };

    // Быстрый поиск через Enter
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
                AudioFX.playSearch();
                const query = encodeURIComponent(e.target.value.trim());
                setTimeout(() => {
                    window.location.href = `https://www.google.com/search?q=${query}`;
                }, 180);
            }
        });
    }

    // Параллакс эффект для фигур
    const shapes = document.querySelectorAll('.shape');
    if (shapes.length) {
        document.addEventListener('mousemove', (e) => {
            const mouseX = e.clientX / window.innerWidth;
            const mouseY = e.clientY / window.innerHeight;
            shapes.forEach((shape, idx) => {
                const speedX = 0.03 + (idx * 0.015);
                const speedY = 0.03 + (idx * 0.01);
                const moveX = (mouseX - 0.5) * speedX * 80;
                const moveY = (mouseY - 0.5) * speedY * 70;
                shape.style.transform = `translate(${moveX}px, ${moveY}px)`;
            });
        });
    }

    // Клик по аватарке
    const avatarImg = document.querySelector('.avatar');
    if (avatarImg) {
        avatarImg.addEventListener('click', () => {
            AudioFX.playClick();
            avatarImg.style.transform = 'scale(0.96)';
            setTimeout(() => {
                avatarImg.style.transform = '';
            }, 150);
            const ring = document.querySelector('.avatar-ring');
            if (ring) {
                ring.style.animation = 'none';
                ring.offsetHeight;
                ring.style.animation = 'spinRing 6s linear infinite';
            }
        });
    }

    // Виджет часов и даты
    const TimeEngine = {
        months: {
            ru: ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЙ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК'],
            en: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
        },
        intervalId: null,

        init() {
            this.update();
            this.intervalId = setInterval(() => this.update(), 1000);
        },

        update() {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');

            const hEl = document.getElementById('timeHours');
            const mEl = document.getElementById('timeMinutes');
            const sEl = document.getElementById('timeSeconds');

            if (hEl) hEl.textContent = hours;
            if (mEl) mEl.textContent = minutes;
            if (sEl) sEl.textContent = seconds;

            // Date
            const lang = (window.I18nEngine && window.I18nEngine.lang) ? window.I18nEngine.lang : (localStorage.getItem('user_lang') || 'ru');
            const day = String(now.getDate()).padStart(2, '0');
            const monthList = this.months[lang] || this.months.ru;
            const monthStr = monthList[now.getMonth()];
            const year = now.getFullYear();

            const dateEl = document.getElementById('timeDate');
            if (dateEl) {
                dateEl.textContent = `${day} ${monthStr} ${year}`;
            }

            // Timezone
            const tzEl = document.getElementById('timeZone');
            if (tzEl) {
                try {
                    const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    if (tzName.includes('Moscow') || tzName.includes('Simferopol') || tzName.includes('Kirov')) {
                        tzEl.textContent = 'MSK';
                    } else {
                        const offsetMin = -now.getTimezoneOffset();
                        const offsetHours = Math.floor(Math.abs(offsetMin) / 60);
                        const sign = offsetMin >= 0 ? '+' : '-';
                        tzEl.textContent = `UTC${sign}${offsetHours}`;
                    }
                } catch (e) {
                    tzEl.textContent = 'MSK';
                }
            }
        }
    };

    // Кастомный курсор с неоновыми искрами
    const CyberCursor = {
        dot: null,
        ring: null,
        mouseX: -100,
        mouseY: -100,
        ringX: -100,
        ringY: -100,
        lastParticleTime: 0,
        isTouch: false,

        init() {
            if (window.matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window)) {
                this.isTouch = true;
                return;
            }

            this.dot = document.createElement('div');
            this.dot.className = 'cursor-dot';

            this.ring = document.createElement('div');
            this.ring.className = 'cursor-ring';

            document.body.appendChild(this.dot);
            document.body.appendChild(this.ring);

            document.addEventListener('mousemove', (e) => {
                this.mouseX = e.clientX;
                this.mouseY = e.clientY;

                if (this.dot) {
                    this.dot.style.left = `${this.mouseX}px`;
                    this.dot.style.top = `${this.mouseY}px`;
                }

                // Interactive delegation
                const target = e.target.closest('a, button, input, .avatar, .service-card, .mode-btn, .control-btn, .link, .quick-card, .modal-box, .stat-box, .repo-card, .system-time-widget');
                if (target) {
                    if (this.ring) this.ring.classList.add('hovered');
                    if (this.dot) this.dot.classList.add('hovered');
                } else {
                    if (this.ring) this.ring.classList.remove('hovered');
                    if (this.dot) this.dot.classList.remove('hovered');
                }

                // Spawn neon particle trail every ~22ms
                const now = performance.now();
                if (now - this.lastParticleTime > 22) {
                    this.spawnParticle(this.mouseX, this.mouseY);
                    this.lastParticleTime = now;
                }
            });

            document.addEventListener('mouseleave', () => {
                if (this.dot) this.dot.style.opacity = '0';
                if (this.ring) this.ring.style.opacity = '0';
            });

            document.addEventListener('mouseenter', () => {
                if (this.dot) this.dot.style.opacity = '1';
                if (this.ring) this.ring.style.opacity = '1';
            });

            document.addEventListener('mousedown', () => {
                if (this.ring) this.ring.classList.add('clicking');
                this.spawnBurst(this.mouseX, this.mouseY);
            });

            document.addEventListener('mouseup', () => {
                if (this.ring) this.ring.classList.remove('clicking');
            });

            this.animate();
        },

        spawnParticle(x, y) {
            const particle = document.createElement('div');
            particle.className = 'cursor-particle';
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;

            const size = Math.random() * 4 + 3;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;

            const isLight = document.body.classList.contains('light-theme');
            const colors = isLight
                ? ['#0284c7', '#7c3aed', '#2563eb', '#db2777']
                : ['var(--accent-cyan)', 'var(--accent-purple)', 'rgba(255, 255, 255, 0.95)', '#38bdf8'];
            
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];

            document.body.appendChild(particle);

            setTimeout(() => {
                particle.remove();
            }, 450);
        },

        spawnBurst(x, y) {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    this.spawnParticle(x + (Math.random() - 0.5) * 18, y + (Math.random() - 0.5) * 18);
                }, i * 15);
            }
        },

        animate() {
            if (this.isTouch) return;
            this.ringX += (this.mouseX - this.ringX) * 0.2;
            this.ringY += (this.mouseY - this.ringY) * 0.2;

            if (this.ring) {
                this.ring.style.left = `${this.ringX}px`;
                this.ring.style.top = `${this.ringY}px`;
            }

            requestAnimationFrame(() => this.animate());
        }
    };

    // Звуки и подсветка для ссылок
    const links = document.querySelectorAll('.link, .service-card, .quick-card');
    links.forEach(link => {
        link.addEventListener('mouseenter', () => {
            AudioFX.playHover();
            if (link.classList.contains('link')) {
                document.querySelector('.main-title')?.style.setProperty('text-shadow', '0 0 12px var(--accent-purple)');
            }
        });
        link.addEventListener('mouseleave', () => {
            if (link.classList.contains('link')) {
                document.querySelector('.main-title')?.style.setProperty('text-shadow', '0 0 8px rgba(56, 189, 248, 0.5)');
            }
        });
        link.addEventListener('click', () => {
            AudioFX.playClick();
        });
    });

    // Фавиконка
    const favicon = document.querySelector("link[rel='icon']");
    if (!favicon) {
        const newFavicon = document.createElement('link');
        newFavicon.rel = 'icon';
        newFavicon.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%2338bdf8' stroke='%23a855f7' stroke-width='4' /%3E%3Ctext x='50' y='68' font-size='50' text-anchor='middle' fill='black' font-weight='bold'%3ED%3C/text%3E%3C/svg%3E";
        document.head.appendChild(newFavicon);
    }

    // Анимация появления ссылок
    const allLinks = document.querySelectorAll('.link');
    allLinks.forEach((el, idx) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(12px)';
        setTimeout(() => {
            el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, 100 + idx * 80);
    });

    // Анимация появления сервисов
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach((el, idx) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(16px)';
        setTimeout(() => {
            el.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
            el.style.opacity = el.classList.contains('offline') ? '0.65' : '1';
            el.style.transform = 'translateY(0)';
        }, 320 + idx * 70);
    });

    const searchWrap = document.querySelector('.search-wrapper');
    if (searchWrap) {
        searchWrap.style.opacity = '0';
        setTimeout(() => {
            searchWrap.style.transition = 'opacity 0.5s ease';
            searchWrap.style.opacity = '1';
        }, 280);
    }

    // Менеджер модалок
    const ModalManager = {
        updateBodyState() {
            const hasActiveModal = document.querySelector('.modal-overlay.active') !== null;
            document.body.classList.toggle('modal-open', hasActiveModal);
        },

        closeAllModals() {
            document.querySelectorAll('.modal-overlay').forEach(overlay => {
                overlay.classList.remove('active');
            });
            if (typeof HackerGameEngine !== 'undefined' && HackerGameEngine.gameActive) {
                HackerGameEngine.stopTimer();
                HackerGameEngine.gameActive = false;
            }
            this.updateBodyState();
        },

        openModal(overlay) {
            if (!overlay) return;
            this.closeAllModals();
            overlay.classList.add('active');
            this.updateBodyState();
            AudioFX.playClick();
        },

        init() {
            this.setupModal('mainSocialsBtn', 'socialsModalOverlay', 'closeSocialsModal');
            this.setupModal('socialsWidgetBtn', 'socialsModalOverlay', 'closeSocialsModal');
            this.setupModal('servicesBtn', 'servicesModalOverlay', 'closeServicesModal');
            this.setupModal('ghWidgetBtn', 'ghModalOverlay', 'closeGhModal');
        },

        setupModal(btnId, overlayId, closeBtnId) {
            const btn = document.getElementById(btnId);
            const overlay = document.getElementById(overlayId);
            const closeBtn = document.getElementById(closeBtnId);

            if (btn && overlay) {
                btn.addEventListener('mouseenter', () => AudioFX.playHover());
                btn.addEventListener('click', () => {
                    this.openModal(overlay);
                });
            }

            if (closeBtn && overlay) {
                closeBtn.addEventListener('click', () => {
                    overlay.classList.remove('active');
                    this.updateBodyState();
                    AudioFX.playClick();
                });
            }

            if (overlay) {
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        overlay.classList.remove('active');
                        this.updateBodyState();
                        AudioFX.playClick();
                    }
                });

                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && overlay.classList.contains('active')) {
                        overlay.classList.remove('active');
                        this.updateBodyState();
                        AudioFX.playClick();
                    }
                });
            }
        }
    };

    // Смена темы (Селектор: Dark / Light / Emerald / Velvet)
    const ThemeEngine = {
        theme: 'dark',
        themes: ['dark', 'light', 'emerald', 'velvet'],

        init() {
            const savedTheme = localStorage.getItem('user_theme');
            if (this.themes.includes(savedTheme)) {
                this.theme = savedTheme;
            } else {
                const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
                this.theme = prefersLight ? 'light' : 'dark';
            }

            const wrapper = document.getElementById('themeDropdownWrapper');
            const themeBtn = document.getElementById('themeToggle');
            const menu = document.getElementById('themeMenu');
            const options = menu ? menu.querySelectorAll('.theme-option') : [];

            if (themeBtn && menu) {
                themeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isOpen = menu.classList.contains('active');
                    if (isOpen) {
                        this.closeMenu();
                    } else {
                        this.openMenu();
                    }
                    AudioFX.playClick();
                });

                options.forEach(opt => {
                    opt.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const selectedTheme = opt.dataset.themeVal;
                        if (selectedTheme && this.themes.includes(selectedTheme)) {
                            this.setTheme(selectedTheme);
                            AudioFX.playClick();
                        }
                        this.closeMenu();
                    });
                });

                document.addEventListener('click', (e) => {
                    if (wrapper && !wrapper.contains(e.target)) {
                        this.closeMenu();
                    }
                });

                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        this.closeMenu();
                    }
                });
            }

            this.applyTheme();
        },

        openMenu() {
            if (typeof window.closeAllDropdowns === 'function') {
                window.closeAllDropdowns();
            }
            const wrapper = document.getElementById('themeDropdownWrapper');
            const menu = document.getElementById('themeMenu');
            if (wrapper) wrapper.classList.add('active');
            if (menu) menu.classList.add('active');
        },

        closeMenu() {
            const wrapper = document.getElementById('themeDropdownWrapper');
            const menu = document.getElementById('themeMenu');
            if (wrapper) wrapper.classList.remove('active');
            if (menu) menu.classList.remove('active');
        },

        setTheme(newTheme) {
            if (!this.themes.includes(newTheme)) return;
            this.theme = newTheme;
            localStorage.setItem('user_theme', this.theme);
            this.applyTheme();
        },

        applyTheme() {
            document.documentElement.dataset.theme = this.theme;

            const icon = document.getElementById('themeIcon');
            const label = document.getElementById('themeLabel');
            const menu = document.getElementById('themeMenu');

            if (this.theme === 'light') {
                if (icon) icon.className = 'fas fa-sun';
                if (label) label.textContent = 'LIGHT';
            } else if (this.theme === 'emerald') {
                if (icon) icon.className = 'fas fa-gem';
                if (label) label.textContent = 'EMERALD';
            } else if (this.theme === 'velvet') {
                if (icon) icon.className = 'fas fa-fire';
                if (label) label.textContent = 'VELVET';
            } else {
                if (icon) icon.className = 'fas fa-moon';
                if (label) label.textContent = 'DARK';
            }

            // Update active item in dropdown
            if (menu) {
                const options = menu.querySelectorAll('.theme-option');
                options.forEach(opt => {
                    if (opt.dataset.themeVal === this.theme) {
                        opt.classList.add('active');
                    } else {
                        opt.classList.remove('active');
                    }
                });
            }

            if (typeof CanvasFX !== 'undefined' && CanvasFX.canvas) {
                CanvasFX.initParticles();
            }
        }
    };

    // Мультиязычность (динамическая загрузка /locales/list.json и JSON языков)
    const I18nEngine = {
        lang: 'ru',
        availableLangs: [],
        dictionary: {},

        t(key) {
            const dict = this.dictionary[this.lang] || this.dictionary.ru || {};
            return dict[key] || key;
        },

        async loadLocaleList() {
            try {
                const res = await fetch('locales/list.json');
                if (res.ok) {
                    this.availableLangs = await res.json();
                }
            } catch (err) {
                console.warn('[I18nEngine] Failed to load locales/list.json:', err);
                this.availableLangs = [
                    { code: 'ru', name: 'Русский', icon: 'fa-globe' },
                    { code: 'en', name: 'English', icon: 'fa-globe' }
                ];
            }
        },

        async loadLocale(lang) {
            if (this.dictionary[lang]) return this.dictionary[lang];
            try {
                const response = await fetch(`locales/${lang}.json`);
                if (response.ok) {
                    const data = await response.json();
                    this.dictionary[lang] = data;
                    return data;
                }
            } catch (err) {
                console.warn(`[I18nEngine] Failed to load locale file locales/${lang}.json:`, err);
            }
            return null;
        },

        async init() {
            await this.loadLocaleList();

            const savedLang = localStorage.getItem('user_lang');
            const validCodes = this.availableLangs.map(l => l.code);

            if (savedLang && validCodes.includes(savedLang)) {
                this.lang = savedLang;
            } else {
                const userNavLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
                this.lang = userNavLang.startsWith('ru') ? 'ru' : 'en';
                if (!validCodes.includes(this.lang)) {
                    this.lang = validCodes[0] || 'ru';
                }
            }

            await this.loadLocale(this.lang);
            this.setupDropdown();
            this.applyLanguage();
        },

        setupDropdown() {
            const wrapper = document.getElementById('langDropdownWrapper');
            const langBtn = document.getElementById('langToggle');
            const langMenu = document.getElementById('langMenu');

            if (!wrapper || !langBtn || !langMenu) return;

            // Render options from availableLangs list.json
            langMenu.innerHTML = this.availableLangs.map(l => `
                <button class="theme-option lang-option ${l.code === this.lang ? 'active' : ''}" data-lang-val="${l.code}">
                    <i class="fas ${l.icon || 'fa-globe'}"></i>
                    <span class="theme-name">${l.name}</span>
                </button>
            `).join('');

            langBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = langMenu.classList.contains('active');
                if (typeof window.closeAllDropdowns === 'function') {
                    window.closeAllDropdowns();
                }
                if (!isOpen) {
                    langMenu.classList.add('active');
                    wrapper.classList.add('active');
                }
                AudioFX.playClick();
            });

            document.addEventListener('click', (e) => {
                if (!wrapper.contains(e.target)) {
                    langMenu.classList.remove('active');
                    wrapper.classList.remove('active');
                }
            });

            langMenu.querySelectorAll('.lang-option').forEach(optBtn => {
                optBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const newLang = optBtn.dataset.langVal;
                    if (newLang && newLang !== this.lang) {
                        this.lang = newLang;
                        localStorage.setItem('user_lang', this.lang);
                        await this.loadLocale(this.lang);
                        this.applyLanguage();
                        AudioFX.playClick();
                    }
                    langMenu.classList.remove('active');
                    wrapper.classList.remove('active');
                });
            });
        },

        applyLanguage() {
            const dict = this.dictionary[this.lang] || this.dictionary.ru || {};
            document.documentElement.lang = this.lang;

            const langLabel = document.getElementById('langLabel');
            if (langLabel) {
                langLabel.textContent = this.lang.toUpperCase();
            }

            const langMenu = document.getElementById('langMenu');
            if (langMenu) {
                langMenu.querySelectorAll('.lang-option').forEach(opt => {
                    if (opt.dataset.langVal === this.lang) {
                        opt.classList.add('active');
                    } else {
                        opt.classList.remove('active');
                    }
                });
            }

            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (dict[key]) {
                    el.textContent = dict[key];
                }
            });

            document.querySelectorAll('[data-i18n-ph]').forEach(el => {
                const key = el.getAttribute('data-i18n-ph');
                if (dict[key]) {
                    el.placeholder = dict[key];
                }
            });

            if (dict.typewriter) {
                TypewriterEngine.type(dict.typewriter);
            }

            if (typeof TimeEngine !== 'undefined' && TimeEngine.update) {
                TimeEngine.update();
            }
        },

        t(key) {
            const dict = this.dictionary[this.lang] || this.dictionary.ru;
            return dict[key] || key;
        }
    };

    // Всплывающие тултипы
    const TooltipEngine = {
        element: null,

        init() {
            this.element = document.createElement('div');
            this.element.id = 'cyberTooltip';
            this.element.className = 'cyber-tooltip';
            document.body.appendChild(this.element);

            document.addEventListener('mouseover', (e) => {
                const target = e.target.closest('[data-tooltip-key], [data-tooltip]');
                if (target) {
                    // Don't show tooltip if target belongs to an active open dropdown wrapper or menu
                    const activeWrapper = target.closest('.theme-dropdown-wrapper.active, .lang-dropdown-wrapper.active, .bgmode-dropdown-wrapper.active');
                    if (activeWrapper || target.closest('.theme-dropdown-menu, .lang-dropdown-menu, .bgmode-dropdown-menu')) {
                        this.hide();
                        return;
                    }
                    this.show(target);
                }
            });

            document.addEventListener('mouseout', (e) => {
                const target = e.target.closest('[data-tooltip-key], [data-tooltip]');
                if (target) {
                    this.hide();
                }
            });
        },

        show(target) {
            if (!this.element) return;
            const key = target.getAttribute('data-tooltip-key');
            let text = target.getAttribute('data-tooltip');

            if (key) {
                text = I18nEngine.t(key);
            }

            if (!text) return;

            this.element.textContent = text;
            this.element.classList.add('active');
            this.position(target);
        },

        hide() {
            if (this.element) {
                this.element.classList.remove('active');
            }
        },

        position(target) {
            if (!target || !this.element) return;

            const targetRect = target.getBoundingClientRect();
            const tooltipRect = this.element.getBoundingClientRect();

            // Centered horizontally relative to the target element
            let posX = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
            // Positioned directly below the element with 10px margin
            let posY = targetRect.bottom + 10;

            const padding = 12;
            // Screen boundaries check
            if (posX < padding) {
                posX = padding;
            } else if (posX + tooltipRect.width > window.innerWidth - padding) {
                posX = window.innerWidth - padding - tooltipRect.width;
            }

            if (posY + tooltipRect.height > window.innerHeight - padding) {
                // If overflows bottom screen edge, place above target
                posY = targetRect.top - tooltipRect.height - 10;
            }

            this.element.style.left = `${Math.round(posX)}px`;
            this.element.style.top = `${Math.round(posY)}px`;
        }
    };

    // Пасхалка: Мини-игра взлома терминала (Netrunner Breach Protocol)
    const HackerGameEngine = {
        level: 1,
        score: 0,
        timeLeft: 20,
        timerInterval: null,
        targetSeq: [],
        buffer: [],
        gridData: [],
        gameActive: false,
        clickCount: 0,
        clickTimer: null,

        hexPool: ['7A', '1C', 'E2', '55', 'BD', 'E9', 'FF', '3B', '7C', '99'],

        init() {
            const overlay = document.getElementById('hackerModalOverlay');
            const closeBtn = document.getElementById('closeHackerModal');
            const restartBtn = document.getElementById('hackerRestartBtn');
            const terminalTag = document.querySelector('.terminal-tag');
            const titleEl = document.querySelector('.main-title');

            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.close();
                });
            }

            if (restartBtn) {
                restartBtn.addEventListener('click', () => {
                    AudioFX.playClick();
                    this.restart();
                });
            }

            if (overlay) {
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        this.close();
                    }
                });
            }

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && overlay && overlay.classList.contains('active')) {
                    this.close();
                }

                // Easter egg shortcut: Ctrl + Shift + H (layout-independent via e.code === 'KeyH')
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.code === 'KeyH' || (e.key && (e.key.toLowerCase() === 'h' || e.key.toLowerCase() === 'р')))) {
                    e.preventDefault();
                    this.toggle();
                }
            });

            // Easter egg triple click on terminal tag or title
            const registerTripleClick = (el) => {
                if (!el) return;
                el.addEventListener('click', () => {
                    this.clickCount++;
                    clearTimeout(this.clickTimer);
                    if (this.clickCount >= 3) {
                        this.clickCount = 0;
                        this.open();
                    } else {
                        this.clickTimer = setTimeout(() => {
                            this.clickCount = 0;
                        }, 1000);
                    }
                });
            };

            registerTripleClick(terminalTag);
            registerTripleClick(titleEl);

            if (terminalTag) {
                terminalTag.addEventListener('click', () => {
                    this.open();
                });
                terminalTag.setAttribute('data-tooltip', 'tooltip_hacker');
                terminalTag.style.cursor = 'pointer';
            }
        },

        open() {
            const overlay = document.getElementById('hackerModalOverlay');
            if (overlay) {
                if (typeof ModalManager !== 'undefined') {
                    ModalManager.closeAllModals();
                }
                overlay.classList.add('active');
                AudioFX.playClick();
                this.restart();
            }
        },

        close() {
            const overlay = document.getElementById('hackerModalOverlay');
            if (overlay) {
                overlay.classList.remove('active');
                AudioFX.playClick();
            }
            this.stopTimer();
            this.gameActive = false;
        },

        toggle() {
            const overlay = document.getElementById('hackerModalOverlay');
            if (overlay && overlay.classList.contains('active')) {
                this.close();
            } else {
                this.open();
            }
        },

        restart() {
            this.level = 1;
            this.score = 0;
            this.startLevel();
        },

        startLevel() {
            this.stopTimer();
            this.gameActive = true;
            this.buffer = [];

            const seqLen = Math.min(2 + Math.floor((this.level - 1) / 2), 5);
            this.timeLeft = Math.max(22 - this.level * 2, 10);

            this.targetSeq = [];
            for (let i = 0; i < seqLen; i++) {
                const randomHex = this.hexPool[Math.floor(Math.random() * this.hexPool.length)];
                this.targetSeq.push(randomHex);
            }

            const gridSize = 16;
            this.gridData = [];

            this.targetSeq.forEach(val => this.gridData.push({ val, selected: false }));

            while (this.gridData.length < gridSize) {
                const randomHex = this.hexPool[Math.floor(Math.random() * this.hexPool.length)];
                this.gridData.push({ val: randomHex, selected: false });
            }

            this.gridData.sort(() => Math.random() - 0.5);

            this.updateUI();
            this.startTimer();
        },

        startTimer() {
            const timerEl = document.getElementById('hackerTimer');
            const startTime = Date.now();
            const totalDuration = this.timeLeft * 1000;

            this.timerInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, (totalDuration - elapsed) / 1000);

                if (timerEl) {
                    timerEl.textContent = `${remaining.toFixed(1)}s`;
                }

                if (remaining <= 0) {
                    this.onTimeOut();
                }
            }, 100);
        },

        stopTimer() {
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }
        },

        onCellClick(index) {
            if (!this.gameActive) return;
            const cell = this.gridData[index];
            if (!cell || cell.selected) return;

            cell.selected = true;
            this.buffer.push(cell.val);
            AudioFX.playClick();

            this.checkBuffer();
            this.updateUI();
        },

        checkBuffer() {
            const statusEl = document.getElementById('hackerStatusMsg');

            let match = true;
            for (let i = 0; i < this.buffer.length; i++) {
                if (this.buffer[i] !== this.targetSeq[i]) {
                    match = false;
                    break;
                }
            }

            if (!match) {
                if (statusEl) {
                    statusEl.className = 'hacker-status-bar danger';
                    statusEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> SEQUENCE MISMATCH // BUFFER CLEARED`;
                }

                setTimeout(() => {
                    this.buffer = [];
                    this.gridData.forEach(c => c.selected = false);
                    if (statusEl) {
                        statusEl.className = 'hacker-status-bar';
                        statusEl.innerHTML = `<i class="fa-solid fa-terminal"></i> RE-ENTER SEQUENCE NODES`;
                    }
                    this.updateUI();
                }, 600);
                return;
            }

            if (this.buffer.length === this.targetSeq.length) {
                this.stopTimer();
                this.gameActive = false;
                const gainedScore = this.level * 150 + Math.floor(parseFloat(document.getElementById('hackerTimer')?.textContent || '0') * 20);
                this.score += gainedScore;

                if (statusEl) {
                    statusEl.className = 'hacker-status-bar success';
                    statusEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> ACCESS GRANTED // LEVEL ${this.level} BREACHED (+${gainedScore} PTS)`;
                }

                setTimeout(() => {
                    this.level++;
                    this.startLevel();
                }, 1200);
            }
        },

        onTimeOut() {
            this.stopTimer();
            this.gameActive = false;
            const statusEl = document.getElementById('hackerStatusMsg');
            if (statusEl) {
                statusEl.className = 'hacker-status-bar danger';
                statusEl.innerHTML = `<i class="fa-solid fa-skull"></i> TIME EXPIRED // BREACH FAILED (FINAL SCORE: ${this.score})`;
            }
        },

        updateUI() {
            const levelEl = document.getElementById('hackerLevel');
            const scoreEl = document.getElementById('hackerScore');
            const targetEl = document.getElementById('hackerTargetSeq');
            const bufferEl = document.getElementById('hackerBuffer');
            const gridEl = document.getElementById('hackerGrid');

            if (levelEl) levelEl.textContent = `LEVEL ${this.level}`;
            if (scoreEl) scoreEl.textContent = this.score;

            if (targetEl) {
                targetEl.innerHTML = this.targetSeq.map((val, idx) => {
                    const isMatched = idx < this.buffer.length && this.buffer[idx] === val;
                    const isActive = idx === this.buffer.length;
                    const statusClass = isMatched ? 'matched' : (isActive ? 'active' : '');
                    return `<div class="hex-pill ${statusClass}">${val}</div>`;
                }).join('');
            }

            if (bufferEl) {
                bufferEl.innerHTML = Array.from({ length: this.targetSeq.length }).map((_, idx) => {
                    const val = this.buffer[idx] || '_ _';
                    const isFilled = idx < this.buffer.length;
                    return `<div class="hex-pill ${isFilled ? 'active' : ''}">${val}</div>`;
                }).join('');
            }

            if (gridEl) {
                gridEl.innerHTML = this.gridData.map((cell, idx) => {
                    const selectedClass = cell.selected ? 'selected' : '';
                    return `<div class="grid-cell ${selectedClass}" data-idx="${idx}">${cell.val}</div>`;
                }).join('');

                gridEl.querySelectorAll('.grid-cell').forEach(cellEl => {
                    cellEl.addEventListener('click', (e) => {
                        const idx = parseInt(e.currentTarget.getAttribute('data-idx'));
                        this.onCellClick(idx);
                    });
                });
            }
        }
    };

    // Блокировка контекстного меню (ПКМ) и клавиш отладки (F12, Ctrl+Shift+I, Ctrl+U)
    const SecurityLock = {
        init() {
            document.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                AudioFX.playClick();
            });

            document.addEventListener('keydown', (e) => {
                const isCtrlKey = e.ctrlKey || e.metaKey;

                if (e.key === 'F12' || e.code === 'F12') {
                    e.preventDefault();
                    AudioFX.playClick();
                    return;
                }

                if (isCtrlKey && e.shiftKey) {
                    const key = e.key ? e.key.toLowerCase() : '';
                    const code = e.code;
                    if (code === 'KeyI' || code === 'KeyJ' || code === 'KeyC' || ['i', 'j', 'c', 'ш', 'о', 'с'].includes(key)) {
                        e.preventDefault();
                        AudioFX.playClick();
                        return;
                    }
                }

                if (isCtrlKey && !e.shiftKey) {
                    const key = e.key ? e.key.toLowerCase() : '';
                    const code = e.code;
                    if (code === 'KeyU' || code === 'KeyS' || ['u', 's', 'г', 'ы'].includes(key)) {
                        e.preventDefault();
                        AudioFX.playClick();
                        return;
                    }
                }
            }, true);
        }
    };

    // Фоновый музыкальный плеер (HTML5 Audio с автопоиском треков)
    const BGMusic = {
        playlist: [
            { src: 'music/na-obratnojj-storone-zemli.mp3', title: 'На обратной стороне земли', artist: 'darkimusss' },
            { src: 'music/sotni-gortenzij.mp3', title: 'Сотни гортензий', artist: 'darkimusss' },
            { src: 'music/za-kraj.mp3', title: 'За край', artist: 'darkimusss' },
            { src: 'music/dojd.mp3', title: 'Дождь', artist: 'darkimusss' }
        ],
        currentIndex: 0,
        audio: new Audio(),
        isPlaying: false,
        isShuffle: localStorage.getItem('bgm_shuffle') === 'true',
        isRepeat: localStorage.getItem('bgm_repeat') === 'true',
        enabled: localStorage.getItem('bgm_enabled') !== 'false',
        volume: parseInt(localStorage.getItem('bgm_volume') || '45'),
        hasInteracted: false,

        init() {
            const musicBtn = document.getElementById('musicToggle');
            const dock = document.getElementById('musicPlayerDock');
            const btnClose = document.getElementById('btnCloseDock');
            const btnPlayPause = document.getElementById('btnPlayPause');
            const btnNext = document.getElementById('btnNext');
            const btnPrev = document.getElementById('btnPrev');
            const btnShuffle = document.getElementById('btnShuffle');
            const btnRepeat = document.getElementById('btnRepeat');
            const volSlider = document.getElementById('volSlider');
            const progressBarWrapper = document.getElementById('progressBarWrapper');

            // Установка состояния кнопок Shuffle / Repeat
            if (btnShuffle) {
                btnShuffle.classList.toggle('active', this.isShuffle);
            }
            if (btnRepeat) {
                btnRepeat.classList.toggle('active', this.isRepeat);
            }

            // Настройка звука
            this.audio.volume = this.volume / 100;
            this.audio.preload = 'metadata';

            // Настройка событий HTML5 Audio
            this.audio.addEventListener('timeupdate', () => {
                this.updateProgress();
            });

            this.audio.addEventListener('ended', () => {
                if (this.isRepeat) {
                    this.play();
                } else {
                    this.nextTrack();
                }
            });

            this.audio.addEventListener('play', () => {
                this.isPlaying = true;
                this.enabled = true;
                localStorage.setItem('bgm_enabled', 'true');
                this.updateUI();
            });

            this.audio.addEventListener('pause', () => {
                this.isPlaying = false;
                this.updateUI();
            });

            // Динамический автопоиск треков из папки music/
            this.loadPlaylist();

            if (volSlider) {
                volSlider.value = this.volume;
                volSlider.addEventListener('input', (e) => {
                    this.setVolume(parseInt(e.target.value));
                });
            }

            if (musicBtn) {
                musicBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.hasInteracted = true;
                    if (dock && dock.classList.contains('hidden')) {
                        this.showDock();
                        if (!this.isPlaying) this.play();
                    } else if (dock) {
                        this.togglePlay();
                    }
                });
            }

            if (btnClose) {
                btnClose.addEventListener('click', () => {
                    this.hideDock();
                });
            }

            if (btnPlayPause) {
                btnPlayPause.addEventListener('click', () => {
                    this.hasInteracted = true;
                    this.togglePlay();
                });
            }

            if (btnNext) {
                btnNext.addEventListener('click', () => {
                    this.hasInteracted = true;
                    this.nextTrack();
                });
            }

            if (btnPrev) {
                btnPrev.addEventListener('click', () => {
                    this.hasInteracted = true;
                    this.prevTrack();
                });
            }

            if (btnShuffle) {
                btnShuffle.addEventListener('click', () => {
                    this.isShuffle = !this.isShuffle;
                    localStorage.setItem('bgm_shuffle', this.isShuffle);
                    btnShuffle.classList.toggle('active', this.isShuffle);
                });
            }

            if (btnRepeat) {
                btnRepeat.addEventListener('click', () => {
                    this.isRepeat = !this.isRepeat;
                    localStorage.setItem('bgm_repeat', this.isRepeat);
                    btnRepeat.classList.toggle('active', this.isRepeat);
                });
            }

            if (progressBarWrapper) {
                progressBarWrapper.addEventListener('click', (e) => {
                    if (!this.audio.duration) return;
                    const rect = progressBarWrapper.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const pct = Math.max(0, Math.min(1, clickX / rect.width));
                    this.audio.currentTime = pct * this.audio.duration;
                });
            }

            if (localStorage.getItem('bgm_dock_open') === 'true') {
                this.showDock();
            }

            const onFirstInteraction = () => {
                if (!this.hasInteracted) {
                    this.hasInteracted = true;
                    if (this.enabled && !this.isPlaying) {
                        this.play();
                    }
                }
                window.removeEventListener('pointerdown', onFirstInteraction);
                window.removeEventListener('keydown', onFirstInteraction);
            };

            window.addEventListener('pointerdown', onFirstInteraction, { once: true });
            window.addEventListener('keydown', onFirstInteraction, { once: true });
        },

        async loadPlaylist() {
            // Способ 1: Чтение манифеста playlist.json в папке music/
            try {
                const res = await fetch('music/playlist.json');
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        this.playlist = data.map(item => {
                            if (typeof item === 'string') {
                                return this.parseTrackFromFilename(item);
                            }
                            return item;
                        });
                    }
                }
            } catch (e) {}

            // Способ 2: Сканирование индекса директории music/ (для локальных/серверных списков)
            try {
                const res = await fetch('music/');
                if (res.ok) {
                    const html = await res.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const mp3Links = Array.from(doc.querySelectorAll('a[href$=".mp3"]'));
                    if (mp3Links.length > 0) {
                        const scanned = mp3Links.map(a => {
                            const href = a.getAttribute('href');
                            return this.parseTrackFromFilename(href);
                        });
                        const existingPaths = new Set(this.playlist.map(t => t.src));
                        scanned.forEach(track => {
                            if (!existingPaths.has(track.src)) {
                                this.playlist.push(track);
                            }
                        });
                    }
                }
            } catch (e) {}

            // Восстановление сохраненного индекса и времени трека
            const savedIndex = parseInt(localStorage.getItem('bgm_track_index') || '0');
            if (savedIndex >= 0 && savedIndex < this.playlist.length) {
                this.currentIndex = savedIndex;
            }

            const savedTime = parseFloat(localStorage.getItem('bgm_track_time') || '0');
            this.loadCurrentTrack(false, savedTime);
        },

        parseTrackFromFilename(pathOrName) {
            const fileName = pathOrName.split('/').pop().split('?')[0];
            const nameWithoutExt = decodeURIComponent(fileName.replace(/\.[^/.]+$/, ''));
            const cleanName = nameWithoutExt.replace(/[-_]+/g, ' ').trim();

            const translitMap = {
                'dojd': 'Дождь',
                'na obratnojj storone zemli': 'На обратной стороне земли',
                'sotni gortenzij': 'Сотни гортензий',
                'za kraj': 'За край'
            };

            const lower = cleanName.toLowerCase();
            const prettyTitle = translitMap[lower] || (cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
            const fullSrc = pathOrName.startsWith('music/') ? pathOrName : `music/${fileName}`;

            return {
                src: fullSrc,
                title: prettyTitle,
                artist: 'darkimusss'
            };
        },

        loadCurrentTrack(autoPlay = true, resumeTime = 0) {
            if (!this.playlist || this.playlist.length === 0) return;
            const track = this.playlist[this.currentIndex];
            localStorage.setItem('bgm_track_index', this.currentIndex);

            const decodedSrc = decodeURI(track.src);
            if (!this.audio.src.endsWith(track.src) && !this.audio.src.endsWith(decodedSrc)) {
                this.audio.src = track.src;
                if (resumeTime > 0) {
                    const onMetadata = () => {
                        if (resumeTime < this.audio.duration) {
                            this.audio.currentTime = resumeTime;
                        }
                        this.audio.removeEventListener('loadedmetadata', onMetadata);
                    };
                    this.audio.addEventListener('loadedmetadata', onMetadata);
                }
            } else if (resumeTime > 0) {
                this.audio.currentTime = resumeTime;
            }

            this.updateTrackInfo();
            if (autoPlay) {
                this.play();
            }
        },

        updateTrackInfo() {
            if (!this.playlist || this.playlist.length === 0) return;
            const track = this.playlist[this.currentIndex];
            const titleEl = document.getElementById('trackTitle');
            const artistEl = document.getElementById('trackArtist');
            if (titleEl) titleEl.textContent = track.title;
            if (artistEl) artistEl.textContent = track.artist;
        },

        play() {
            const playPromise = this.audio.play();
            if (playPromise !== undefined) {
                playPromise.catch((err) => {
                    console.log('Autoplay deferred until user action');
                });
            }
        },

        pause() {
            this.audio.pause();
        },

        togglePlay() {
            if (this.isPlaying) {
                this.pause();
                this.enabled = false;
                localStorage.setItem('bgm_enabled', 'false');
            } else {
                this.play();
                this.enabled = true;
                localStorage.setItem('bgm_enabled', 'true');
            }
        },

        nextTrack() {
            localStorage.setItem('bgm_track_time', '0');
            if (this.isShuffle) {
                let nextIdx = Math.floor(Math.random() * this.playlist.length);
                if (nextIdx === this.currentIndex && this.playlist.length > 1) {
                    nextIdx = (this.currentIndex + 1) % this.playlist.length;
                }
                this.currentIndex = nextIdx;
            } else {
                this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
            }
            this.loadCurrentTrack(true, 0);
        },

        prevTrack() {
            localStorage.setItem('bgm_track_time', '0');
            this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
            this.loadCurrentTrack(true, 0);
        },

        setVolume(val) {
            this.volume = val;
            localStorage.setItem('bgm_volume', val);
            this.audio.volume = val / 100;
            const volIcon = document.getElementById('volIcon');
            if (volIcon) {
                if (val === 0) volIcon.className = 'fas fa-volume-xmark';
                else if (val < 50) volIcon.className = 'fas fa-volume-low';
                else volIcon.className = 'fas fa-volume-high';
            }
        },

        updateProgress() {
            const curr = this.audio.currentTime || 0;
            const dur = this.audio.duration || 0;
            const currTimeEl = document.getElementById('currTime');
            const durTimeEl = document.getElementById('durTime');
            const progressFill = document.getElementById('progressFill');

            // Сохранение текущей секунды воспроизведения в памяти
            if (curr > 0) {
                localStorage.setItem('bgm_track_time', curr.toFixed(1));
            }

            if (currTimeEl) currTimeEl.textContent = this.formatTime(curr);
            if (durTimeEl) durTimeEl.textContent = this.formatTime(dur);
            if (progressFill && dur > 0) {
                const pct = (curr / dur) * 100;
                progressFill.style.width = `${pct}%`;
            }
        },

        showDock() {
            const dock = document.getElementById('musicPlayerDock');
            if (dock) dock.classList.remove('hidden');
            localStorage.setItem('bgm_dock_open', 'true');
        },

        hideDock() {
            const dock = document.getElementById('musicPlayerDock');
            if (dock) dock.classList.add('hidden');
            localStorage.setItem('bgm_dock_open', 'false');
        },

        formatTime(sec) {
            const s = Math.floor(sec);
            const m = Math.floor(s / 60);
            const r = s % 60;
            return `${m}:${r < 10 ? '0' : ''}${r}`;
        },

        updateUI() {
            const musicBtn = document.getElementById('musicToggle');
            const musicIcon = document.getElementById('musicIcon');
            const visualizer = document.getElementById('musicVisualizer');
            const playerEq = document.getElementById('playerEq');
            const vinylDisc = document.getElementById('vinylDisc');
            const mainPlayIcon = document.getElementById('mainPlayIcon');

            if (this.isPlaying) {
                if (musicBtn) musicBtn.classList.add('active-music');
                if (musicIcon) musicIcon.className = 'fas fa-compact-disc fa-spin';
                if (visualizer) visualizer.classList.add('playing');
                if (playerEq) playerEq.classList.add('playing');
                if (vinylDisc) vinylDisc.classList.add('spinning');
                if (mainPlayIcon) mainPlayIcon.className = 'fas fa-pause';
            } else {
                if (musicBtn) musicBtn.classList.remove('active-music');
                if (musicIcon) musicIcon.className = 'fas fa-music';
                if (visualizer) visualizer.classList.remove('playing');
                if (playerEq) playerEq.classList.remove('playing');
                if (vinylDisc) vinylDisc.classList.remove('spinning');
                if (mainPlayIcon) mainPlayIcon.className = 'fas fa-play';
            }
        }
    };

    // Initialize modules when DOM is ready
    function initAllModules() {
        ThemeEngine.init();
        I18nEngine.init();
        AudioFX.init();
        BGMusic.init();
        CanvasFX.init();
        GitHubWidget.init();
        ModalManager.init();
        TimeEngine.init();
        CyberCursor.init();
        TooltipEngine.init();
        HackerGameEngine.init();
        SecurityLock.init();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllModules);
    } else {
        initAllModules();
    }
})();