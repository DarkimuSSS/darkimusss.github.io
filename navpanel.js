(function () {
    function initNavPanel() {
        const container = document.querySelector('.top-controls-container');
        if (!container) return;

        const path = window.location.pathname;
        const isHomePage = path.endsWith('index.html') || path === '/' || path.endsWith('/');
        const isStudioPage = path.endsWith('studio.html');
        const isSandboxPage = path.endsWith('sandbox.html');

        const navHtml = `
        <div class="dynamic-island-bar">
            <div class="island-nav-links">
                ${!isHomePage ? `
                <a href="index.html" class="island-link" data-tooltip-key="tooltip_home">
                    <i class="fas fa-house"></i>
                    <span>Главная</span>
                </a>` : ''}

                ${!isStudioPage ? `
                <a href="studio.html" class="island-link" data-tooltip-key="tooltip_studio">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                    <span>Studio</span>
                </a>` : ''}

                ${!isSandboxPage ? `
                <a href="sandbox.html" class="island-link" data-tooltip-key="tooltip_sandbox">
                    <i class="fa-solid fa-code"></i>
                    <span>Sandbox</span>
                </a>` : ''}
            </div>

            <div class="island-actions">
                <div class="lang-dropdown-wrapper" id="langDropdownWrapper">
                    <button id="langToggle" class="island-btn" data-tooltip-key="tooltip_lang" aria-label="Переключить язык">
                        <i class="fas fa-globe"></i>
                        <span id="langLabel" style="display:none;">RU</span>
                    </button>
                    <div class="lang-dropdown-menu" id="langMenu"></div>
                </div>

                <div class="theme-dropdown-wrapper" id="themeDropdownWrapper">
                    <button id="themeToggle" class="island-btn" data-tooltip-key="tooltip_theme" aria-label="Сменить тему">
                        <i class="fas fa-palette" id="themeIcon"></i>
                    </button>
                    <div class="theme-dropdown-menu" id="themeMenu">
                        <button class="theme-option" data-theme-val="dark">
                            <i class="fas fa-moon"></i>
                            <span class="theme-name">Dark</span>
                        </button>
                        <button class="theme-option" data-theme-val="light">
                            <i class="fas fa-sun"></i>
                            <span class="theme-name">Light</span>
                        </button>
                        <button class="theme-option" data-theme-val="emerald">
                            <i class="fas fa-gem"></i>
                            <span class="theme-name">Emerald</span>
                        </button>
                        <button class="theme-option" data-theme-val="velvet">
                            <i class="fas fa-fire"></i>
                            <span class="theme-name">Velvet Red</span>
                        </button>
                    </div>
                </div>

                <button id="ghWidgetBtn" class="island-btn" data-tooltip-key="tooltip_activity" aria-label="GitHub Активность">
                    <i class="fa-brands fa-github"></i>
                </button>

                <button id="soundToggle" class="island-btn" data-tooltip-key="tooltip_sound" aria-label="Звуковой эффект">
                    <i class="fas fa-volume-mute" id="soundIcon"></i>
                </button>

                <button id="musicToggle" class="island-btn music-control-btn" data-tooltip-key="tooltip_music" aria-label="Фоновая музыка">
                    <i class="fas fa-music" id="musicIcon"></i>
                    <div class="sound-wave-bars" id="musicVisualizer" style="display:none;">
                        <span class="eq-bar"></span>
                        <span class="eq-bar"></span>
                        <span class="eq-bar"></span>
                    </div>
                </button>

                <div class="bgmode-dropdown-wrapper" id="bgModeDropdownWrapper">
                    <button id="bgModeToggleBtn" class="island-btn" data-tooltip-key="tooltip_mode_grid" aria-label="Режим фона">
                        <i class="fas fa-border-all" id="bgModeIcon"></i>
                    </button>
                    <div class="bgmode-dropdown-menu" id="bgModeMenu">
                        <button class="theme-option mode-option active" data-mode-val="grid" data-tooltip-key="tooltip_mode_grid">
                            <i class="fas fa-border-all"></i>
                            <span class="theme-name">Grid</span>
                        </button>
                        <button class="theme-option mode-option" data-mode-val="matrix" data-tooltip-key="tooltip_mode_matrix">
                            <i class="fas fa-code"></i>
                            <span class="theme-name">Matrix</span>
                        </button>
                        <button class="theme-option mode-option" data-mode-val="particles" data-tooltip-key="tooltip_mode_particles">
                            <i class="fas fa-atom"></i>
                            <span class="theme-name">Particles</span>
                        </button>
                        <button class="theme-option mode-option" data-mode-val="fireflies" data-tooltip-key="tooltip_mode_fireflies">
                            <i class="fas fa-wand-magic-sparkles"></i>
                            <span class="theme-name">Fireflies</span>
                        </button>
                    </div>
                </div>
            </div>

            <div class="system-time-widget" id="systemTimeWidget" data-tooltip-key="tooltip_time" style="background:transparent; border:none; box-shadow:none; padding:0 4px; height:auto;">
                <div class="time-block time-main" style="gap:4px; font-size:0.75rem;">
                    <i class="fa-regular fa-clock time-icon"></i>
                    <span id="timeHours">00</span><span class="time-colon">:</span><span id="timeMinutes">00</span><span class="time-colon">:</span><span id="timeSeconds">00</span>
                    <span class="time-zone" id="timeZone" style="font-size:0.65rem;">MSK</span>
                </div>
            </div>
        </div>
        `;

        container.innerHTML = navHtml;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNavPanel);
    } else {
        initNavPanel();
    }
})();
