document.addEventListener('DOMContentLoaded', () => {

    // --- Simple Password Authentication with Hashing ---
    const ADMIN_PASSWORD_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'; 

    /**
     * Hashes a string using the SHA-256 algorithm.
     */
    async function sha256(str) {
        const buffer = new TextEncoder().encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    /**
     * Shows elements that are marked as admin-only features.
     */
    function showAdminFeatures() {
        // Show admin tabs
        document.querySelectorAll('.admin-feature').forEach(el => {
            el.style.display = el.classList.contains('tab-link') ? 'flex' : 'block';
        });
        
        // Disable login icon
        const loginIcon = document.getElementById('admin-login-icon');
        if (loginIcon) {
            loginIcon.style.cursor = 'default';
            loginIcon.removeAttribute('title');
        }
    }

    /**
     * Hides admin features and shows the login button.
     */
    function hideAdminFeatures() {
        // Hide admin tabs
        document.querySelectorAll('.admin-feature').forEach(el => {
            el.style.display = 'none';
        });

        // Enable login icon
        const loginIcon = document.getElementById('admin-login-icon');
        if (loginIcon) {
            loginIcon.style.cursor = 'pointer';
            loginIcon.setAttribute('title', 'Admin Login');
        }
    }

    /**
     * Checks if the user is authenticated via sessionStorage on page load.
     */
    function checkAdminStatus() {
        if (sessionStorage.getItem('isAdmin') === 'true') {
            showAdminFeatures();
        } else {
            hideAdminFeatures();
        }
    }

    // Attach click event to the admin login icon with async hashing
    const adminLoginIcon = document.getElementById('admin-login-icon');
    if (adminLoginIcon) {
        adminLoginIcon.addEventListener('click', async () => {
            if (sessionStorage.getItem('isAdmin') !== 'true') {
                const enteredPassword = prompt('Vui lòng nhập mật khẩu quản trị:');
                
                if (enteredPassword !== null) { 
                    const enteredPasswordHash = await sha256(enteredPassword);
                    
                    if (enteredPasswordHash === ADMIN_PASSWORD_HASH) {
                        sessionStorage.setItem('isAdmin', 'true');
                        showAdminFeatures();
                    } else {
                        alert('Mật khẩu không chính xác.');
                    }
                }
            }
        });
    }

    // Attach click event to the logo text to go home
    const logoTextButton = document.getElementById('logo-text-button');
    if (logoTextButton) {
        logoTextButton.addEventListener('click', () => {
            switchTab('home-content');
        });
    }

    checkAdminStatus();


    // --- Elements Cache ---
    const desktopNav = document.getElementById('tab-navigation');
    const mobileNav = document.getElementById('mobile-menu');
    const hamburgerBtn = document.getElementById('hamburger-button');
    const pageContents = document.querySelectorAll('.page-content');
    const accordionContainer = document.getElementById('accordion-container');
    const homeContent = document.getElementById('home-content');

    // --- Functions ---
    /**
     * Switches the active tab and page content.
     */
    function switchTab(tabName) {
        desktopNav.querySelectorAll('.tab-link').forEach(link => {
            const isActive = link.dataset.tab === tabName;
            link.classList.toggle('active', isActive);
            link.classList.toggle('text-text-secondary', !isActive);
            if (isActive) {
                link.classList.remove('text-text-secondary');
            }
        });

        pageContents.forEach(content => {
            content.classList.toggle('active', content.id === tabName);
        });
        
        if (tabName === 'home-content' && homeContent) {
            homeContent.scrollTo(0, 0);
        }

        if (mobileNav.classList.contains('is-open')) {
            mobileNav.classList.remove('is-open');
            hamburgerBtn.classList.remove('is-open');
        }
    }

    // --- Event Listeners ---
    if (desktopNav) {
        desktopNav.addEventListener('click', (e) => {
            const target = e.target.closest('.tab-link');
            if (target) {
                switchTab(target.dataset.tab);
            }
        });
    }
    
    if (mobileNav) {
        mobileNav.addEventListener('click', (e) => {
            const target = e.target.closest('button[data-tab]');
            if (target) {
                switchTab(target.dataset.tab);
            }
        });
    }

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            mobileNav.classList.toggle('is-open');
            hamburgerBtn.classList.toggle('is-open');
        });
    }

    if (accordionContainer) {
        accordionContainer.addEventListener('click', (e) => {
            const header = e.target.closest('.accordion-header');
            if (header) {
                const item = header.parentElement;
                const currentlyActive = accordionContainer.querySelector('.accordion-item.active');
                if (currentlyActive && currentlyActive !== item) {
                    currentlyActive.classList.remove('active');
                }
                item.classList.toggle('active');
            }
        });
    }

    if (homeContent) {
        const revealElements = homeContent.querySelectorAll('.reveal');
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { 
            threshold: 0.1,
            root: homeContent 
        });
        revealElements.forEach(el => revealObserver.observe(el));
    }

    // --- Particle Effect for Hero Section ---
    const canvas = document.getElementById('particle-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particlesArray;

        if (ctx) {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;

            class Particle {
                constructor(x, y, directionX, directionY, size) {
                    this.x = x; this.y = y; this.directionX = directionX; this.directionY = directionY; this.size = size;
                }
                draw() {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
                    ctx.fillStyle = 'rgba(147, 197, 253, 0.4)';
                    ctx.fill();
                }
                update() {
                    if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX;
                    if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY;
                    this.x += this.directionX; this.y += this.directionY; this.draw();
                }
            }

            function init() {
                particlesArray = [];
                let numberOfParticles = (canvas.height * canvas.width) / 11000;
                for (let i = 0; i < numberOfParticles; i++) {
                    let size = (Math.random() * 1.5) + 1;
                    let x = (Math.random() * ((canvas.width - size * 2) - (size * 2)) + size * 2);
                    let y = (Math.random() * ((canvas.height - size * 2) - (size * 2)) + size * 2);
                    let directionX = (Math.random() * .4) - 0.2;
                    let directionY = (Math.random() * .4) - 0.2;
                    particlesArray.push(new Particle(x, y, directionX, directionY, size));
                }
            }

            function animate() {
                requestAnimationFrame(animate);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                for (let i = 0; i < particlesArray.length; i++) {
                    particlesArray[i].update();
                }
                connect();
            }
            
            function connect() {
                let opacityValue = 1;
                for (let a = 0; a < particlesArray.length; a++) {
                    for (let b = a; b < particlesArray.length; b++) {
                        let distance = ((particlesArray[a].x - particlesArray[b].x) ** 2) + ((particlesArray[a].y - particlesArray[b].y) ** 2);
                        if (distance < (canvas.width / 8) * (canvas.height / 8)) {
                            opacityValue = 1 - (distance / 15000);
                            ctx.strokeStyle = `rgba(147, 197, 253, ${opacityValue})`;
                            ctx.lineWidth = 1;
                            ctx.beginPath();
                            ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                            ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                            ctx.stroke();
                        }
                    }
                }
            }

            window.addEventListener('resize', () => {
                canvas.width = canvas.offsetWidth;
                canvas.height = canvas.offsetHeight;
                init();
            });
            
            init();
            animate();
        }
    }
});