document.addEventListener('DOMContentLoaded', () => {
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
   * @param {string} tabName - The data-tab value of the target tab.
   */
  function switchTab(tabName) {
    // Update desktop tabs UI
    desktopNav.querySelectorAll('.tab-link').forEach(link => {
      const isActive = link.dataset.tab === tabName;
      link.classList.toggle('active', isActive);
      link.classList.toggle('text-text-secondary', !isActive);
      if (isActive) {
        link.classList.remove('text-text-secondary');
      }
    });

    // Update page content visibility
    pageContents.forEach(content => {
      content.classList.toggle('active', content.id === tabName);
    });
    
    // Scroll to top of the page if switching to home
    if(tabName === 'home-content' && homeContent) {
        homeContent.scrollTo(0, 0);
    }

    // Close mobile menu after selection
    if (mobileNav.classList.contains('is-open')) {
        mobileNav.classList.remove('is-open');
        hamburgerBtn.classList.remove('is-open');
    }
  }

  // --- Event Listeners ---

  // Desktop navigation
  if (desktopNav) {
    desktopNav.addEventListener('click', (e) => {
      const target = e.target.closest('.tab-link');
      if (target) {
        switchTab(target.dataset.tab);
      }
    });
  }
  
  // Mobile navigation
  if (mobileNav) {
    mobileNav.addEventListener('click', (e) => {
      const target = e.target.closest('button[data-tab]');
      if (target) {
        switchTab(target.dataset.tab);
      }
    });
  }

  // Hamburger button for mobile menu
  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', () => {
      mobileNav.classList.toggle('is-open');
      hamburgerBtn.classList.toggle('is-open');
    });
  }

  // Accordion logic for guide section
  if (accordionContainer) {
    accordionContainer.addEventListener('click', (e) => {
      // Handle accordion item expand/collapse
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

  // Reveal on scroll logic
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

    // Set canvas initial size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Particle class
    class Particle {
        constructor(x, y, directionX, directionY, size) {
            this.x = x;
            this.y = y;
            this.directionX = directionX;
            this.directionY = directionY;
            this.size = size;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = 'rgba(147, 197, 253, 0.4)'; // light blue, semi-transparent
            ctx.fill();
        }

        update() {
            if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX;
            if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY;
            
            this.x += this.directionX;
            this.y += this.directionY;
            this.draw();
        }
    }

    // Create particle array
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

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
        }
        connect();
    }
    
    // Connect particles with lines
    function connect() {
        let opacityValue = 1;
        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a; b < particlesArray.length; b++) {
                let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x)) +
                    ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));

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

    // Resize event
    window.addEventListener('resize', () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        init();
    });
    
    // Start the animation
    init();
    animate();
  }
});

