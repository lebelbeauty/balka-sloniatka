/**
 * BALKA-SLONIATKA - Main JavaScript
 * Modern interactions: scroll animations, counters, mobile nav, smooth scroll,
 * magnetic buttons, particle system, scroll progress, enhanced parallax
 */

(function() {
  'use strict';

  // ========================================
  // Utility Functions
  // ========================================

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const lerp = (start, end, factor) => start + (end - start) * factor;

  const throttle = (fn, limit) => {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };

  const debounce = (fn, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  };

  // ========================================
  // Particle System (Hero)
  // ========================================

  function initParticles() {
    const container = $('#hero-particles');
    if (!container) return;

    const particleCount = 30;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.cssText = `
        left: ${Math.random() * 100}%;
        top: ${100 + Math.random() * 20}%;
        animation-delay: ${Math.random() * 15}s;
        animation-duration: ${15 + Math.random() * 10}s;
      `;
      container.appendChild(particle);
      particles.push(particle);
    }

    // Respawn particles when they go off screen
    setInterval(() => {
      particles.forEach(p => {
        const rect = p.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          p.style.left = `${Math.random() * 100}%`;
          p.style.top = `${100 + Math.random() * 20}%`;
          p.style.animationDelay = '0s';
          p.style.animationDuration = `${15 + Math.random() * 10}s`;
          // Force reflow to restart animation
          void p.offsetWidth;
        }
      });
    }, 5000);
  }

  // ========================================
  // Scroll Progress Indicator
  // ========================================

  function initScrollProgress() {
    const progressBar = $('.scroll-progress');
    if (!progressBar) return;

    const updateProgress = throttle(() => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollTop / docHeight : 0;
      progressBar.style.setProperty('--scroll-progress', progress.toFixed(4));
    }, 16);

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress(); // Initial
  }

  // ========================================
  // Mobile Navigation
  // ========================================

  function initMobileNav() {
    const toggle = $('.nav__toggle');
    const list = $('.nav__list');
    const links = $$('.nav__link');

    if (!toggle || !list) return;

    const openMenu = () => {
      toggle.setAttribute('aria-expanded', 'true');
      list.dataset.visible = 'true';
      document.body.style.overflow = 'hidden';
    };

    const closeMenu = () => {
      toggle.setAttribute('aria-expanded', 'false');
      list.dataset.visible = 'false';
      document.body.style.overflow = '';
    };

    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      isOpen ? closeMenu() : openMenu();
    });

    links.forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        toggle.focus();
      }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (list.dataset.visible === 'true' &&
          !list.contains(e.target) &&
          !toggle.contains(e.target)) {
        closeMenu();
      }
    });
  }

  // ========================================
  // Scroll Animations (IntersectionObserver)
  // ========================================

  function initScrollAnimations() {
    const animatedElements = $$('[data-animate]');
    const staggerContainers = $$('.stagger-children');

    if (animatedElements.length === 0 && staggerContainers.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.1
    });

    animatedElements.forEach(el => observer.observe(el));
    staggerContainers.forEach(el => observer.observe(el));
  }

  // ========================================
  // Counter Animation
  // ========================================

  function initCounters() {
    const counters = $$('[data-count]');

    if (counters.length === 0) return;

    const animateCounter = (el, target) => {
      const duration = 2000;
      const startTime = performance.now();
      const isThousands = target >= 1000;

      const updateCounter = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = clamp(elapsed / duration, 0, 1);
        // Easing: easeOutExpo
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const current = Math.floor(eased * target);

        if (isThousands && target >= 1000) {
          el.textContent = current.toLocaleString('ru-RU');
        } else {
          el.textContent = current;
        }

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        }
      };

      requestAnimationFrame(updateCounter);
    };

    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = parseInt(entry.target.dataset.count, 10);
          animateCounter(entry.target, target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -20% 0px',
      threshold: 0.5
    });

    counters.forEach(el => counterObserver.observe(el));
  }

  // ========================================
  // Smooth Scroll for Anchor Links
  // ========================================

  function initSmoothScroll() {
    $$('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href === '#') return;

        const target = $(href);
        if (!target) return;

        e.preventDefault();

        const navHeight = $('.nav')?.offsetHeight || 0;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        // Update URL without jumping
        history.pushState(null, '', href);

        // Focus for accessibility
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        target.removeAttribute('tabindex');
      });
    });
  }

  // ========================================
  // Nav Background on Scroll
  // ========================================

  function initNavScroll() {
    const nav = $('.nav');
    if (!nav) return;

    const handleScroll = throttle(() => {
      if (window.scrollY > 20) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }, 50);

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  // ========================================
  // Newsletter Form
  // ========================================

  function initNewsletter() {
    const form = $('.newsletter__form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const input = form.querySelector('.newsletter__input');
      const button = form.querySelector('button[type="submit"]');
      const email = input?.value.trim();

      if (!email || !email.includes('@')) {
        input?.focus();
        input?.setAttribute('aria-invalid', 'true');
        return;
      }

      input.removeAttribute('aria-invalid');

      // Simulate submission
      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = 'Подписываем...';

      await new Promise(resolve => setTimeout(resolve, 1000));

      button.textContent = 'Готово!';
      button.style.background = 'var(--color-primary)';
      input.value = '';

      setTimeout(() => {
        button.disabled = false;
        button.textContent = originalText;
        button.style.background = '';
      }, 2000);
    });
  }

  // ========================================
  // Hero Parallax & Mouse Tracking
  // ========================================

  function initHeroParallax() {
    const photo = $('.hero__photo');
    const blobs = $$('.hero__blob');
    const hero = $('.hero');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!hero || !photo || reduced) return;

    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMove = throttle((e) => {
      const rect = hero.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / rect.width - 0.5;
      mouseY = (e.clientY - rect.top) / rect.height - 0.5;
    }, 16);

    const animate = () => {
      // Smooth follow
      currentX = lerp(currentX, mouseX, 0.1);
      currentY = lerp(currentY, mouseY, 0.1);

      const deltaX = clamp(currentX * 30, -30, 30);
      const deltaY = clamp(currentY * 20, -20, 20);

      photo.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

      // Parallax blobs
      blobs.forEach((blob, i) => {
        const factor = (i + 1) * 0.3;
        blob.style.transform = `translate(${deltaX * factor}px, ${deltaY * factor}px)`;
      });

      requestAnimationFrame(animate);
    };

    const handleLeave = () => {
      mouseX = 0;
      mouseY = 0;
    };

    document.addEventListener('mousemove', handleMove, { passive: true });
    document.addEventListener('mouseleave', handleLeave);
    animate();
  }

  // ========================================
  // Magnetic Buttons
  // ========================================

  function initMagneticButtons() {
    const magneticButtons = $$('.btn--magnetic');

    magneticButtons.forEach(btn => {
      let rafId = null;

      const handleMove = (e) => {
        const rect = btn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = (e.clientX - centerX) * 0.3;
        const deltaY = (e.clientY - centerY) * 0.3;

        btn.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      };

      const handleLeave = () => {
        btn.style.transform = 'translate(0, 0)';
        btn.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      };

      const handleEnter = () => {
        btn.style.transition = 'transform 0.1s linear';
      };

      btn.addEventListener('mousemove', handleMove);
      btn.addEventListener('mouseleave', handleLeave);
      btn.addEventListener('mouseenter', handleEnter);
    });
  }

  // ========================================
  // Active Nav Link on Scroll
  // ========================================

  function initActiveNav() {
    const sections = $$('section[id]');
    const navLinks = $$('.nav__link');
    if (sections.length === 0 || navLinks.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(link => {
            link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, {
      rootMargin: '-50% 0px -50% 0px',
      threshold: 0
    });

    sections.forEach(section => observer.observe(section));
  }

  // ========================================
  // Card Hover Effects Enhancement
  // ========================================

  function initCardEffects() {
    // Species cards - slight 3D tilt on hover
    $$('.species__card').forEach(card => {
      const image = card.querySelector('.species__image img');

      card.addEventListener('mousemove', throttle((e) => {
        if (!image) return;
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        image.style.transform = `
          perspective(1000px)
          rotateY(${x * 8}deg)
          rotateX(${-y * 8}deg)
          scale(1.05)
        `;
      }, 16));

      card.addEventListener('mouseleave', () => {
        if (!image) return;
        image.style.transform = 'perspective(1000px) rotateY(0) rotateX(0) scale(1)';
        image.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
      });

      card.addEventListener('mouseenter', () => {
        if (image) image.style.transition = 'transform 0.1s linear';
      });
    });

    // Gallery cards - zoom on hover
    $$('.gallery__item').forEach(item => {
      const image = item.querySelector('.gallery__image svg');

      item.addEventListener('mouseenter', () => {
        if (image) image.style.transform = 'scale(1.1)';
      });

      item.addEventListener('mouseleave', () => {
        if (image) image.style.transform = 'scale(1)';
      });
    });

    // About cards - icon animation
    $$('.about__card').forEach(card => {
      const icon = card.querySelector('.about__icon');

      card.addEventListener('mouseenter', () => {
        if (icon) icon.style.transform = 'rotate(5deg) scale(1.1)';
      });

      card.addEventListener('mouseleave', () => {
        if (icon) icon.style.transform = 'rotate(0) scale(1)';
      });
    });

    // Fact cards - number animation
    $$('.fact__card').forEach(card => {
      const number = card.querySelector('.fact__number');

      card.addEventListener('mouseenter', () => {
        if (number) number.style.transform = 'scale(1.1)';
      });

      card.addEventListener('mouseleave', () => {
        if (number) number.style.transform = 'scale(1)';
      });
    });
  }

  // ========================================
  // Keyboard Navigation Enhancement
  // ========================================

  function initKeyboardNav() {
    // Make sure focus is visible for keyboard users
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-nav');
    });
  }

  // ========================================
  // Performance: Lazy Load Images (if any)
  // ========================================

  function initLazyLoad() {
    if ('loading' in HTMLImageElement.prototype) return; // Native lazy loading supported

    const images = $$('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }

  // ========================================
  // Reveal Hero Elements Immediately
  // ========================================

  function revealHero() {
    requestAnimationFrame(() => {
      $$('.hero [data-animate]').forEach((el, i) => {
        setTimeout(() => el.classList.add('is-visible'), i * 150);
      });
    });
  }

  // ========================================
  // Modern upgrade: preloader, theme, cursor,
  // spotlight, lightbox, scroll-to-top, word reveal
  // ========================================

  function initPreloader() {
    const preloader = $('#preloader');
    if (!preloader) return;

    document.body.classList.add('is-loading');
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      preloader.classList.add('is-done');
      document.body.classList.remove('is-loading');
      setTimeout(() => preloader.remove(), 700);
    };

    if (document.readyState === 'complete') {
      setTimeout(finish, 450);
    } else {
      window.addEventListener('load', () => setTimeout(finish, 450), { once: true });
    }

    // Safety net: never trap the page behind the loader
    setTimeout(finish, 3000);
  }

  function initThemeToggle() {
    const btn = $('#theme-toggle');
    if (!btn) return;

    const root = document.documentElement;
    const meta = $('#theme-color-meta');
    const mql = window.matchMedia('(prefers-color-scheme: dark)');

    const readStored = () => {
      try { return localStorage.getItem('theme'); } catch (e) { return null; }
    };
    const store = (value) => {
      try { localStorage.setItem('theme', value); } catch (e) { /* ignore */ }
    };

    const apply = (theme) => {
      root.setAttribute('data-theme', theme);
      const isDark = theme === 'dark';
      btn.setAttribute('aria-pressed', String(isDark));
      btn.setAttribute('aria-label', isDark ? 'Включить светлую тему' : 'Включить тёмную тему');
      if (meta) meta.setAttribute('content', isDark ? '#141412' : '#FAF9F6');
    };

    // Resolve the initial theme: saved choice wins, otherwise follow the OS.
    const saved = readStored();
    const initial = (saved === 'dark' || saved === 'light')
      ? saved
      : (mql.matches ? 'dark' : 'light');
    apply(initial);

    btn.addEventListener('click', () => {
      const current = root.getAttribute('data-theme');
      const isDark = current ? current === 'dark' : mql.matches;
      const next = isDark ? 'light' : 'dark';
      store(next);
      apply(next);
    });

    if (mql.addEventListener) {
      mql.addEventListener('change', () => {
        if (!readStored()) apply(null);
      });
    }
  }

  function initCustomCursor() {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer || reduced) return;

    const dot = $('.cursor-dot');
    const ring = $('.cursor-ring');
    if (!dot || !ring) return;

    document.body.classList.add('has-custom-cursor');
    document.body.classList.add('cursor-hidden');

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let visible = false;

    const placeDot = () => {
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    };

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!visible) {
        visible = true;
        document.body.classList.remove('cursor-hidden');
        ringX = mouseX;
        ringY = mouseY;
      }
      placeDot();
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      visible = false;
      document.body.classList.add('cursor-hidden');
    });

    document.addEventListener('mouseenter', () => {
      visible = true;
      document.body.classList.remove('cursor-hidden');
    });

    const loop = () => {
      ringX = lerp(ringX, mouseX, 0.2);
      ringY = lerp(ringY, mouseY, 0.2);
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    loop();

    const interactive = 'a, button, .gallery__button, .gallery__image, input, textarea, select, .theme-toggle';

    document.addEventListener('pointerover', (e) => {
      if (e.target.closest && e.target.closest(interactive)) {
        ring.classList.add('is-hover');
        dot.classList.add('is-hover');
      }
    });

    document.addEventListener('pointerout', (e) => {
      if (e.target.closest && e.target.closest(interactive)) {
        ring.classList.remove('is-hover');
        dot.classList.remove('is-hover');
      }
    });

    // Click feedback: the lens contracts while the button is held down.
    document.addEventListener('pointerdown', () => {
      ring.classList.add('is-pressed');
      dot.classList.add('is-pressed');
    });
    document.addEventListener('pointerup', () => {
      ring.classList.remove('is-pressed');
      dot.classList.remove('is-pressed');
    });
    document.addEventListener('pointercancel', () => {
      ring.classList.remove('is-pressed');
      dot.classList.remove('is-pressed');
    });
  }

  function initSpotlight() {
    const cards = $$('.about__card, .species__card, .fact__card, .gallery__item, .conservation__stat-item, .conservation__threats-list li, .newsletter__card');
    cards.forEach(card => {
      card.addEventListener('pointermove', throttle((e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width * 100).toFixed(1) + '%');
        card.style.setProperty('--my', ((e.clientY - rect.top) / rect.height * 100).toFixed(1) + '%');
      }, 30), { passive: true });
    });
  }

  // ========================================
  // Gallery Carousel (infinite scroll)
  // ========================================

  function initGalleryCarousel() {
    const viewport = $('.gallery__viewport');
    const track = $('.gallery__track');
    const prevBtn = $('[data-gallery-prev]');
    const nextBtn = $('[data-gallery-next]');
    const toggleBtn = $('[data-gallery-toggle]');
    const countEl = $('[data-gallery-count]');
    if (!viewport || !track || !prevBtn || !nextBtn) return;

    // Collect original items (slides)
    const originalItems = [...track.querySelectorAll('.gallery__item')];
    if (originalItems.length === 0) return;

    const slideCount = originalItems.length;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    // --- Build seamless loop by cloning first/last slides ---
    const cloneCount = Math.min(3, slideCount);
    const clones = [];

    // Prepend clones of last N slides
    for (let i = slideCount - cloneCount; i < slideCount; i++) {
      const clone = originalItems[i].cloneNode(true);
      clone.dataset.clone = 'true';
      clone.setAttribute('aria-hidden', 'true');
      track.prepend(clone);
      clones.push({ node: clone, index: i, type: 'prepend' });
    }
    // Append clones of first N slides
    for (let i = 0; i < cloneCount; i++) {
      const clone = originalItems[i].cloneNode(true);
      clone.dataset.clone = 'true';
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
      clones.push({ node: clone, index: i, type: 'append' });
    }

    const allItems = [...track.querySelectorAll('.gallery__item')];
    const totalItems = allItems.length;

    // Scroll state
    let scrollPos = 0;
    let targetPos = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartScroll = 0;
    let rafId = null;
    let driftId = null;
    let driftSpeed = 0;
    const DRIFT_SPEED = 0.45; // px per frame (~27px/s at 60fps)
    const DRIFT_DECAY = 0.997;

    // Helper: measure a single slide width + gap
    const getSlideSize = () => {
      const item = allItems[0];
      if (!item) return 0;
      const style = getComputedStyle(viewport);
      const gap = parseFloat(style.gap) || parseFloat(getComputedStyle(track).gap) || 24;
      return item.getBoundingClientRect().width + gap;
    };

    // Normalize scroll position to keep it within the "real" range
    const normalize = () => {
      const slideSize = getSlideSize();
      const period = slideSize * slideCount;
      if (period === 0) return;
      // Scroll is currently at cloneCount * slideSize (start of real items)
      const base = cloneCount * slideSize;
      // Allow one period in each direction
      if (scrollPos < base - period) scrollPos += period;
      else if (scrollPos >= base + period) scrollPos -= period;
      viewport.scrollLeft = scrollPos;
    };

    // Scroll to a specific index (0-based in original items)
    const scrollToIndex = (idx, animate = true) => {
      const slideSize = getSlideSize();
      const base = cloneCount * slideSize;
      const target = base + idx * slideSize;
      if (animate) {
        viewport.scrollTo({ left: target, behavior: 'smooth' });
      } else {
        viewport.scrollLeft = target;
        scrollPos = target;
      }
      updateCount(idx);
    };

    const updateCount = (idx) => {
      if (countEl) countEl.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(slideCount).padStart(2, '0')}`;
    };

    // --- Auto-drift ---
    const startDrift = () => {
      if (reduced || coarse || driftId) return;
      driftSpeed = DRIFT_SPEED;
      const step = () => {
        if (!isDragging && !document.hidden) {
          scrollPos += driftSpeed;
          viewport.scrollLeft = scrollPos;
          normalize();
        }
        driftSpeed *= DRIFT_DECAY;
        if (driftSpeed > 0.02) driftId = requestAnimationFrame(step);
        else driftId = null;
      };
      driftId = requestAnimationFrame(step);
    };

    const stopDrift = () => {
      if (driftId) cancelAnimationFrame(driftId);
      driftId = null;
      driftSpeed = 0;
    };

    // --- Drag / swipe ---
    const onDragStart = (e) => {
      isDragging = true;
      viewport.classList.add('is-dragging');
      dragStartX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
      dragStartScroll = viewport.scrollLeft;
      scrollPos = dragStartScroll;
      stopDrift();
    };

    const onDragMove = (e) => {
      if (!isDragging) return;
      const x = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
      const delta = dragStartX - x;
      scrollPos = dragStartScroll + delta;
      viewport.scrollLeft = scrollPos;
    };

    const onDragEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      viewport.classList.remove('is-dragging');
      // Snap to nearest slide
      const slideSize = getSlideSize();
      const base = cloneCount * slideSize;
      let relative = scrollPos - base;
      const idx = Math.round(relative / slideSize);
      const clamped = ((idx % slideCount) + slideCount) % slideCount;
      scrollToIndex(clamped);
      startDrift();
    };

    // Pointer events
    viewport.addEventListener('pointerdown', onDragStart, { passive: true });
    viewport.addEventListener('pointermove', onDragMove, { passive: true });
    viewport.addEventListener('pointerup', onDragEnd);
    viewport.addEventListener('pointercancel', onDragEnd);
    viewport.addEventListener('pointerleave', onDragEnd);

    // Touch fallback (passive already on pointerdown)
    viewport.addEventListener('touchstart', onDragStart, { passive: true });
    viewport.addEventListener('touchmove', onDragMove, { passive: true });
    viewport.addEventListener('touchend', onDragEnd);
    viewport.addEventListener('touchcancel', onDragEnd);

    // Mouse wheel horizontal scroll
    viewport.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        stopDrift();
        scrollPos += e.deltaX;
        viewport.scrollLeft = scrollPos;
        normalize();
        startDrift();
      }
    }, { passive: false });

    // Arrow buttons
    prevBtn.addEventListener('click', () => {
      stopDrift();
      const slideSize = getSlideSize();
      const base = cloneCount * slideSize;
      const relative = viewport.scrollLeft - base;
      const idx = Math.round(relative / slideSize);
      const clamped = ((idx - 1) % slideCount + slideCount) % slideCount;
      scrollToIndex(clamped);
      startDrift();
    });

    nextBtn.addEventListener('click', () => {
      stopDrift();
      const slideSize = getSlideSize();
      const base = cloneCount * slideSize;
      const relative = viewport.scrollLeft - base;
      const idx = Math.round(relative / slideSize);
      const clamped = ((idx + 1) % slideCount + slideCount) % slideCount;
      scrollToIndex(clamped);
      startDrift();
    });

    // Pause/resume toggle
    let paused = false;
    toggleBtn?.addEventListener('click', () => {
      paused = !paused;
      toggleBtn.setAttribute('aria-pressed', String(paused));
      toggleBtn.setAttribute('aria-label', paused ? 'Запустить автопрокрутку' : 'Остановить автопрокрутку');
      if (paused) stopDrift(); else startDrift();
    });

    // IntersectionObserver: pause when out of view
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting && !paused) startDrift();
        else stopDrift();
      });
    }, { rootMargin: '100px' });
    io.observe(viewport);

    // Visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopDrift(); else if (!paused) startDrift();
    });

    // Scroll sync (user scrolled manually)
    viewport.addEventListener('scroll', () => {
      scrollPos = viewport.scrollLeft;
      normalize();
      // Update count based on current position
      const slideSize = getSlideSize();
      const base = cloneCount * slideSize;
      const relative = scrollPos - base;
      const idx = Math.round(relative / slideSize);
      const clamped = ((idx % slideCount) + slideCount) % slideCount;
      updateCount(clamped);
    }, { passive: true });

    // Keyboard navigation for viewport
    viewport.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stopDrift();
        const slideSize = getSlideSize();
        const base = cloneCount * slideSize;
        const relative = viewport.scrollLeft - base;
        const idx = Math.round(relative / slideSize);
        const clamped = ((idx - 1) % slideCount + slideCount) % slideCount;
        scrollToIndex(clamped);
        startDrift();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        stopDrift();
        const slideSize = getSlideSize();
        const base = cloneCount * slideSize;
        const relative = viewport.scrollLeft - base;
        const idx = Math.round(relative / slideSize);
        const clamped = ((idx + 1) % slideCount + slideCount) % slideCount;
        scrollToIndex(clamped);
        startDrift();
      }
    });

    // Initialize position at first real slide (index 0) - wait for layout & images
    const initPosition = () => {
      const initialSlideSize = getSlideSize();
      if (initialSlideSize > 0) {
        viewport.scrollLeft = cloneCount * initialSlideSize;
        scrollPos = viewport.scrollLeft;
        updateCount(0);
        startDrift();
      } else {
        requestAnimationFrame(initPosition);
      }
    };
    requestAnimationFrame(initPosition);
  }

  function initLightbox() {
    const originalItems = $$('.gallery__item:not([data-clone])');
    const allItems = $$('.gallery__item');
    const box = $('#lightbox');
    if (!originalItems.length || !box) return;

    const imgEl = $('.lightbox__img', box);
    const capEl = $('.lightbox__caption', box);
    const closeBtn = $('.lightbox__close', box);
    const prevBtn = $('.lightbox__nav--prev', box);
    const nextBtn = $('.lightbox__nav--next', box);

    // Data from original items only
    const data = originalItems.map(item => {
      const img = item.querySelector('.gallery__image img');
      const title = item.querySelector('.gallery__caption-title');
      const sub = item.querySelector('.gallery__caption-subtitle');
      const caption = [title?.textContent?.trim(), sub?.textContent?.trim()]
        .filter(Boolean).join(' — ');
      return {
        src: img?.src || '',
        alt: img?.alt || '',
        caption
      };
    });

    let index = 0;
    let lastTrigger = null;
    const slideCount = data.length;

    const render = () => {
      const d = data[index];
      if (!d) return;
      imgEl.src = d.src;
      imgEl.alt = d.alt;
      capEl.textContent = d.caption;
    };

    const open = (i, trigger) => {
      index = i;
      lastTrigger = trigger || null;
      render();
      box.classList.add('is-open');
      box.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lightbox-open');
      setTimeout(() => closeBtn.focus(), 60);
    };

    const close = () => {
      box.classList.remove('is-open');
      box.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lightbox-open');
      if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
      lastTrigger = null;
    };

    const step = (dir) => {
      index = (index + dir + slideCount) % slideCount;
      render();
    };

    // Attach click handlers to ALL items (original + clones)
    allItems.forEach((item, i) => {
      const imageBox = item.querySelector('.gallery__image');
      const img = imageBox?.querySelector('img');
      if (!imageBox || !img) return;

      // For clones, map back to original index
      const dataIndex = item.hasAttribute('data-clone')
        ? (item.dataset.cloneIndex ?? (i % slideCount))
        : (i - (allItems.length - slideCount) / 2); // rough fallback

      // Better: determine index from the original items
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gallery__button';
      const cap = item.querySelector('.gallery__caption-title')?.textContent?.trim()
        || item.querySelector('.gallery__caption-subtitle')?.textContent?.trim()
        || img.alt || 'слон';
      btn.setAttribute('aria-label', 'Открыть фото: ' + cap);

      // Determine correct data index by finding matching original item
      let actualIndex = 0;
      if (item.hasAttribute('data-clone')) {
        // Clone: find which original it corresponds to by comparing image src
        const src = img.src;
        actualIndex = originalItems.findIndex(orig =>
          orig.querySelector('.gallery__image img')?.src === src
        );
        if (actualIndex === -1) actualIndex = 0;
      } else {
        actualIndex = originalItems.indexOf(item);
        if (actualIndex === -1) actualIndex = 0;
      }

      imageBox.appendChild(btn);
      btn.appendChild(img);
      btn.addEventListener('click', () => open(actualIndex, btn));

      // Make clone buttons non-focusable for keyboard nav
      if (item.hasAttribute('data-clone')) {
        btn.tabIndex = -1;
      }
    });

    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', () => step(-1));
    nextBtn.addEventListener('click', () => step(1));

    box.addEventListener('click', (e) => {
      if (e.target === box) close();
    });

    document.addEventListener('keydown', (e) => {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  }

  function initScrollTop() {
    const btn = $('#to-top');
    if (!btn) return;

    const update = throttle(() => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? clamp(window.scrollY / docHeight, 0, 1) : 0;
      btn.style.setProperty('--to-top-progress', progress.toFixed(3));
      btn.classList.toggle('is-visible', window.scrollY > 420);
    }, 30);

    window.addEventListener('scroll', update, { passive: true });
    update();

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function initWordReveal() {
    const titles = $$('.section__title, .newsletter__title');
    if (!titles.length) return;

    titles.forEach(title => {
      const words = (title.textContent || '').trim().split(/\s+/).filter(Boolean);
      if (words.length < 2) return;

      title.textContent = '';
      words.forEach((word, i) => {
        const span = document.createElement('span');
        span.className = 'reveal-word';
        span.style.setProperty('--i', String(i));
        span.textContent = word;
        title.appendChild(span);
        if (i < words.length - 1) title.appendChild(document.createTextNode(' '));
      });
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-words-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35, rootMargin: '0px 0px -8% 0px' });

    titles.forEach(title => observer.observe(title));
  }

  // ========================================
  // Initialize All
  // ========================================

  function init() {
    // Wait for DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    initPreloader();
    initThemeToggle();
    initCustomCursor();
    initParticles();
    initScrollProgress();
    initMobileNav();
    initWordReveal();
    initScrollAnimations();
    initCounters();
    initSmoothScroll();
    initNavScroll();
    initNewsletter();
    initHeroParallax();
    initMagneticButtons();
    initActiveNav();
    initCardEffects();
    initKeyboardNav();
    initLazyLoad();
    initSpotlight();
    initGalleryCarousel();
    initLightbox();
    initScrollTop();
    revealHero();
  }

  init();

})();