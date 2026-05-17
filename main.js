
(function () {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
                const query = encodeURIComponent(e.target.value.trim());
                window.location.href = `https://www.google.com/search?q=${query}`;
            }
        });
    }

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

    const avatarImg = document.querySelector('.avatar');
    if (avatarImg) {
        avatarImg.addEventListener('click', () => {
            avatarImg.style.transform = 'scale(0.98)';
            setTimeout(() => {
                avatarImg.style.transform = '';
            }, 150);
            const ring = document.querySelector('.avatar-ring');
            if (ring) {
                ring.style.animation = 'none';
                ring.offsetHeight;
                ring.style.animation = 'spinRing 12s linear infinite';
            }
        });
    }

    const cursorDiv = document.createElement('div');
    cursorDiv.className = 'custom-cursor';
    document.body.appendChild(cursorDiv);

    const updateCursor = (e) => {
        cursorDiv.style.left = e.clientX + 'px';
        cursorDiv.style.top = e.clientY + 'px';
    };

    const hideCursor = () => {
        cursorDiv.style.opacity = '0';
    };
    const showCursor = () => {
        cursorDiv.style.opacity = '1';
    };

    document.addEventListener('mousemove', updateCursor);
    document.addEventListener('mouseleave', hideCursor);
    document.addEventListener('mouseenter', showCursor);

    const links = document.querySelectorAll('.link');
    links.forEach(link => {
        link.addEventListener('mouseenter', () => {
            document.querySelector('.main-title')?.style.setProperty('text-shadow', '0 0 12px cyan');
        });
        link.addEventListener('mouseleave', () => {
            document.querySelector('.main-title')?.style.setProperty('text-shadow', '0 0 8px rgba(0, 255, 255, 0.5)');
        });
    });

    const favicon = document.querySelector("link[rel='icon']");
    if (!favicon) {
        const newFavicon = document.createElement('link');
        newFavicon.rel = 'icon';
        newFavicon.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%2300ffff' stroke='%23ff44dd' stroke-width='4' /%3E%3Ctext x='50' y='68' font-size='50' text-anchor='middle' fill='black' font-weight='bold'%3ED%3C/text%3E%3C/svg%3E";
        document.head.appendChild(newFavicon);
    }

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

    const searchWrap = document.querySelector('.search-wrapper');
    if (searchWrap) {
        searchWrap.style.opacity = '0';
        setTimeout(() => {
            searchWrap.style.transition = 'opacity 0.5s ease';
            searchWrap.style.opacity = '1';
        }, 280);
    }
})();