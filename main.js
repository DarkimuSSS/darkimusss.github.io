(function () {
    // ==========================================================================
    // 1. AudioFX Engine (Web Audio API Synthesizer)
    // ==========================================================================
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

    // ==========================================================================
    // 2. CanvasFX Engine (Matrix Rain & Particle Constellation)
    // ==========================================================================
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

            const modeToggle = document.getElementById('bgModeToggle');
            if (modeToggle) {
                const btns = modeToggle.querySelectorAll('.mode-btn');
                btns.forEach(btn => {
                    if (btn.dataset.mode === this.mode) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }

                    btn.addEventListener('click', () => {
                        btns.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        this.setMode(btn.dataset.mode);
                        AudioFX.playClick();
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
                }
            }
        },

        initMatrix() {
            const fontSize = 16;
            const columns = Math.floor(this.canvas.width / fontSize);
            this.matrixDrops = [];
            for (let i = 0; i < columns; i++) {
                this.matrixDrops[i] = {
                    y: Math.floor(Math.random() * -40),
                    speed: Math.floor(Math.random() * 2) + 1
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
            const isLight = document.documentElement.dataset.theme === 'light';

            // Silky smooth trailing fade without strobing
            this.ctx.fillStyle = isLight ? 'rgba(248, 250, 252, 0.08)' : 'rgba(2, 5, 14, 0.08)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.font = `${fontSize}px "JetBrains Mono", "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", "SimSun", sans-serif`;

            for (let i = 0; i < this.matrixDrops.length; i++) {
                const drop = this.matrixDrops[i];
                const x = i * fontSize;
                const y = drop.y * fontSize;

                if (drop.y > 0 && y < this.canvas.height + fontSize) {
                    // Random Chinese character for lead head
                    const leadChar = this.chars[Math.floor(Math.random() * this.chars.length)];
                    this.ctx.fillStyle = isLight ? '#0284c7' : '#ffffff';
                    this.ctx.fillText(leadChar, x, y);

                    // Random Chinese character for trailing body
                    if (drop.y > 1) {
                        const trailChar = this.chars[Math.floor(Math.random() * this.chars.length)];
                        const prevY = (drop.y - 1) * fontSize;
                        this.ctx.fillStyle = isLight ? '#7c3aed' : '#38bdf8';
                        this.ctx.fillText(trailChar, x, prevY);
                    }
                }

                drop.y += drop.speed;

                if (y > this.canvas.height && Math.random() > 0.975) {
                    drop.y = Math.floor(Math.random() * -20);
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
            const isLight = document.documentElement.dataset.theme === 'light';
            this.particles = [];
            for (let i = 0; i < count; i++) {
                this.particles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    vx: (Math.random() - 0.5) * (isMobile ? 0.8 : 1.2),
                    vy: (Math.random() - 0.5) * (isMobile ? 0.8 : 1.2),
                    radius: Math.random() * 2 + 1,
                    color: isLight
                        ? (Math.random() > 0.5 ? '#0284c7' : '#7c3aed')
                        : (Math.random() > 0.5 ? '#38bdf8' : '#a855f7')
                });
            }
        },

        renderParticles() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

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
                        this.ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 * (1 - dist / 140)})`;
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
                        this.ctx.strokeStyle = `rgba(168, 85, 247, ${0.25 * (1 - dist / 100)})`;
                        this.ctx.lineWidth = 0.8;
                        this.ctx.stroke();
                    }
                }
            }

            if (this.mode === 'particles') {
                this.animationFrame = requestAnimationFrame(() => this.renderParticles());
            }
        }
    };

    // ==========================================================================
    // 3. GitHub Activity & Repos Widget
    // ==========================================================================
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
    // Typewriter Engine
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

    // Google Search Enter
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

    // Parallax shapes
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

    // Avatar Click effect
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

    // ==========================================================================
    // Cyber System Time & Date Engine
    // ==========================================================================
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

    // Cyber Target Reticle Cursor System with Neon Particle Trail
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

    // Link hovers & sound FX
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

    // Favicon
    const favicon = document.querySelector("link[rel='icon']");
    if (!favicon) {
        const newFavicon = document.createElement('link');
        newFavicon.rel = 'icon';
        newFavicon.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%2338bdf8' stroke='%23a855f7' stroke-width='4' /%3E%3Ctext x='50' y='68' font-size='50' text-anchor='middle' fill='black' font-weight='bold'%3ED%3C/text%3E%3C/svg%3E";
        document.head.appendChild(newFavicon);
    }

    // Links staggered entrance
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

    // Service cards staggered entrance
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

    // Modal Manager (Services & GitHub Modals)
    const ModalManager = {
        init() {
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
                    overlay.classList.add('active');
                    AudioFX.playClick();
                });
            }

            if (closeBtn && overlay) {
                closeBtn.addEventListener('click', () => {
                    overlay.classList.remove('active');
                    AudioFX.playClick();
                });
            }

            if (overlay) {
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        overlay.classList.remove('active');
                        AudioFX.playClick();
                    }
                });

                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && overlay.classList.contains('active')) {
                        overlay.classList.remove('active');
                        AudioFX.playClick();
                    }
                });
            }
        }
    };

    // ==========================================================================
    // 5. Theme Engine (Dark / Light Cyberpunk Glassmorphism)
    // ==========================================================================
    const ThemeEngine = {
        theme: 'dark',

        init() {
            const savedTheme = localStorage.getItem('user_theme');
            if (savedTheme === 'light' || savedTheme === 'dark') {
                this.theme = savedTheme;
            } else {
                const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
                this.theme = prefersLight ? 'light' : 'dark';
            }

            const themeBtn = document.getElementById('themeToggle');
            if (themeBtn) {
                themeBtn.addEventListener('click', () => {
                    this.theme = this.theme === 'dark' ? 'light' : 'dark';
                    localStorage.setItem('user_theme', this.theme);
                    this.applyTheme();
                    AudioFX.playClick();
                });
            }

            this.applyTheme();
        },

        applyTheme() {
            document.documentElement.dataset.theme = this.theme;

            const icon = document.getElementById('themeIcon');
            const label = document.getElementById('themeLabel');

            if (this.theme === 'light') {
                if (icon) icon.className = 'fas fa-sun';
                if (label) label.textContent = 'LIGHT';
            } else {
                if (icon) icon.className = 'fas fa-moon';
                if (label) label.textContent = 'DARK';
            }

            if (typeof CanvasFX !== 'undefined' && CanvasFX.canvas) {
                CanvasFX.initParticles();
            }
        }
    };

    // ==========================================================================
    // 6. I18n Engine (Multilingual RU / EN Auto-detector)
    // ==========================================================================
    const I18nEngine = {
        lang: 'ru',

        dictionary: {
            ru: {
                typewriter: 'Мой план — это баг. Но он работает.',
                btn_services: 'Сервисы',
                btn_activity: 'GitHub',
                link_telegram: 'Telegram',
                link_site: 'Сайт',
                link_github: 'GitHub',
                search_placeholder: 'Поиск в Google / Enter →',
                services_header: 'Инфраструктура & Сервисы',
                badge_active: 'АКТИВЕН',
                badge_offline: 'ОТКЛЮЧЕН',
                control_desc: 'Панель мониторинга серверов',
                wiki_desc: 'База знаний, гайды и правила',
                projects_name: 'Проекты',
                projects_desc: 'Каталог актуальных разработок',
                sso_desc: 'Единая система авторизации (SSO)',
                speedtest_desc: 'Измерение скорости соединения',
                google_desc: 'Поиск в интернете',
                gh_header: 'GitHub Активность',
                status_online: 'Онлайн',
                status_active: 'Активен',
                status_loading: 'Загрузка...',
                stat_repos: 'Репозитории',
                stat_followers: 'Подписчики',
                stat_stars: 'Звёзды',
                fallback_desc1: 'Личный портал и веб-интерфейс в формате Cyberpunk / Glassmorphism.',
                fallback_desc2: 'Набор основных проектов, скриптов и систем управления.',
                tooltip_lang: 'Переключить язык (RU / EN)',
                tooltip_theme: 'Сменить тему (Dark / Light)',
                tooltip_services: 'Инфраструктура & Сервисы',
                tooltip_activity: 'GitHub Активность & Проекты',
                tooltip_sound: 'Звуковые эффекты (SFX)',
                tooltip_mode_grid: 'Стандартный фон (Сетка)',
                tooltip_mode_matrix: 'Режим Matrix Rain',
                tooltip_mode_particles: 'Режим Неоновые частицы',
                tooltip_time: 'Системное время и дата',
                system_online: 'СИСТЕМА В СЕТИ',
                hacker_title: 'NETRUNNER BREACH PROTOCOL',
                hacker_timer: 'ОСТАЛОСЬ ВРЕМЕНИ:',
                hacker_score: 'ОЧКИ:',
                hacker_target: 'ЦЕЛЕВАЯ ПОСЛЕДОВАТЕЛЬНОСТЬ:',
                hacker_buffer: 'БУФЕР ВВОДА:',
                hacker_restart: 'ПЕРЕЗАПУСК ПРОТОКОЛА',
                tooltip_hacker: 'Пасхалка: Кликни 3 раза или Ctrl+Shift+H'
            },
            en: {
                typewriter: 'My plan is a bug. But it works.',
                btn_services: 'Services',
                btn_activity: 'GitHub',
                link_telegram: 'Telegram',
                link_site: 'Website',
                link_github: 'GitHub',
                search_placeholder: 'Search Google / Enter →',
                services_header: 'Infrastructure & Services',
                badge_active: 'ONLINE',
                badge_offline: 'OFFLINE',
                control_desc: 'Server monitoring dashboard',
                wiki_desc: 'Knowledge base, guides & rules',
                projects_name: 'Projects',
                projects_desc: 'Catalog of current projects',
                sso_desc: 'Single Sign-On system (SSO)',
                speedtest_desc: 'Connection speed measurement',
                google_desc: 'Web search',
                gh_header: 'GitHub Activity',
                status_online: 'Online',
                status_active: 'Active',
                status_loading: 'Loading...',
                stat_repos: 'Repositories',
                stat_followers: 'Followers',
                stat_stars: 'Stars',
                fallback_desc1: 'Personal portal & web interface in Cyberpunk / Glassmorphism style.',
                fallback_desc2: 'Collection of core projects, scripts & management systems.',
                tooltip_lang: 'Switch language (RU / EN)',
                tooltip_theme: 'Toggle theme (Dark / Light)',
                tooltip_services: 'Infrastructure & Services',
                tooltip_activity: 'GitHub Activity & Projects',
                tooltip_sound: 'Sound Effects (SFX)',
                tooltip_mode_grid: 'Default background (Grid)',
                tooltip_mode_matrix: 'Matrix Rain Mode',
                tooltip_mode_particles: 'Neon Particles Mode',
                tooltip_time: 'System Time & Date',
                system_online: 'SYSTEM ONLINE',
                hacker_title: 'NETRUNNER BREACH PROTOCOL',
                hacker_timer: 'TIME REMAINING:',
                hacker_score: 'SCORE:',
                hacker_target: 'TARGET SEQUENCE:',
                hacker_buffer: 'INPUT BUFFER:',
                hacker_restart: 'RESTART PROTOCOL',
                tooltip_hacker: 'Easter Egg: Click 3x or Ctrl+Shift+H'
            }
        },

        init() {
            const savedLang = localStorage.getItem('user_lang');
            if (savedLang && (savedLang === 'ru' || savedLang === 'en')) {
                this.lang = savedLang;
            } else {
                const userNavLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
                this.lang = userNavLang.startsWith('ru') ? 'ru' : 'en';
            }

            const langBtn = document.getElementById('langToggle');
            if (langBtn) {
                langBtn.addEventListener('click', () => {
                    this.lang = this.lang === 'ru' ? 'en' : 'ru';
                    localStorage.setItem('user_lang', this.lang);
                    this.applyLanguage();
                    AudioFX.playClick();
                });
            }

            this.applyLanguage();
        },

        applyLanguage() {
            const dict = this.dictionary[this.lang] || this.dictionary.ru;
            document.documentElement.lang = this.lang;

            const langLabel = document.getElementById('langLabel');
            if (langLabel) {
                langLabel.textContent = this.lang.toUpperCase();
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

    // ==========================================================================
    // 7. Custom Glassmorphic Tooltip Engine
    // ==========================================================================
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
                    this.show(target);
                }
            });

            document.addEventListener('mouseout', (e) => {
                const target = e.target.closest('[data-tooltip-key], [data-tooltip]');
                if (target) {
                    this.hide();
                }
            });

            document.addEventListener('mousemove', (e) => {
                if (this.element && this.element.classList.contains('active')) {
                    this.position(e.clientX, e.clientY);
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
        },

        hide() {
            if (this.element) {
                this.element.classList.remove('active');
            }
        },

        position(x, y) {
            const padding = 12;
            let posX = x + 12;
            let posY = y + 22;

            const rect = this.element.getBoundingClientRect();
            if (posX + rect.width > window.innerWidth - padding) {
                posX = x - rect.width - 12;
            }
            if (posY + rect.height > window.innerHeight - padding) {
                posY = y - rect.height - 12;
            }

            this.element.style.left = `${posX}px`;
            this.element.style.top = `${posY}px`;
        }
    };

    // ==========================================================================
    // 9. Cyberpunk Netrunner Hacker Mini-Game Engine
    // ==========================================================================
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

    // Initialize modules
    ThemeEngine.init();
    I18nEngine.init();
    AudioFX.init();
    CanvasFX.init();
    GitHubWidget.init();
    ModalManager.init();
    TimeEngine.init();
    CyberCursor.init();
    TooltipEngine.init();
    HackerGameEngine.init();
})();