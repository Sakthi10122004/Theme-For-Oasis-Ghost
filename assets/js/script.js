// INDEX PAGE JS

// Critical JavaScript (loads immediately)

(function () {
  // =====================================================
  //  GHOST NATIVE ANNOUNCEMENT BAR DETECTION
  //  Dynamically measures the bar height and sets the
  //  CSS variable so header + content offset correctly.
  // =====================================================
  (function initAnnouncementPopup() {
    // =====================================================
    //  ANNOUNCEMENT POPUP
    //  Intercepts Ghost's native .gh-announcement-bar,
    //  hides it, and shows a branded popup modal instead.
    //  Shown once per session via sessionStorage.
    // =====================================================

    var SESSION_KEY = 'oasis_announcement_seen';

    function getBarText(bar) {
      // Ghost puts the message in .gh-announcement-bar-content or as direct text
      var inner = bar.querySelector('.gh-announcement-bar-content');
      return (inner ? inner.innerHTML : bar.innerHTML).trim();
    }

    function showPopup(bar) {
      // Hide the native bar immediately (before paint if possible)
      bar.style.setProperty('display', 'none', 'important');

      // Don't show again this session
      if (sessionStorage.getItem(SESSION_KEY)) return;

      var msg = getBarText(bar);
      if (!msg) return; // Nothing to display

      var popup = document.getElementById('announcementPopup');
      var body = document.getElementById('announcementPopupBody');
      var backdrop = document.getElementById('announcementPopupBackdrop');
      var closeBtn = document.getElementById('announcementPopupClose');
      var dismissBtn = document.getElementById('announcementPopupDismiss');

      if (!popup || !body) return;

      body.innerHTML = msg;
      popup.classList.add('active');
      popup.removeAttribute('inert');
      if (backdrop) backdrop.classList.add('active');
      document.body.classList.add('announcement-popup-open');

      function closePopup() {
        // Move focus away before hiding so no descendant is focused while inert
        if (popup.contains(document.activeElement)) {
          document.activeElement.blur();
        }
        popup.classList.remove('active');
        popup.setAttribute('inert', '');
        if (backdrop) backdrop.classList.remove('active');
        document.body.classList.remove('announcement-popup-open');
        sessionStorage.setItem(SESSION_KEY, '1');
      }

      if (closeBtn) closeBtn.addEventListener('click', closePopup);
      if (dismissBtn) dismissBtn.addEventListener('click', closePopup);
      if (backdrop) backdrop.addEventListener('click', closePopup);

      document.addEventListener('keydown', function onKey(e) {
        if (e.key === 'Escape') {
          closePopup();
          document.removeEventListener('keydown', onKey);
        }
      });
    }

    function hideNativeBar(bar) {
      bar.style.setProperty('display', 'none', 'important');
    }

    // Check if bar already exists (cached DOM / pre-rendered)
    var existing = document.querySelector('.gh-announcement-bar');
    if (existing) { showPopup(existing); }

    // Watch for Ghost to inject it dynamically
    new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var added = mutations[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var node = added[j];
          if (node.nodeType === 1) {
            if (node.classList && node.classList.contains('gh-announcement-bar')) {
              showPopup(node); return;
            }
            var inner = node.querySelector && node.querySelector('.gh-announcement-bar');
            if (inner) { showPopup(inner); return; }
          }
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  })();

  // Load deferred CSS
  var deferred = document.querySelector('link[rel="preload"][as="style"]');
  if (deferred) {
    deferred.onload = function () {
      this.rel = 'stylesheet';
    };
    // Fallback for browsers that don't support onload
    if (deferred.sheet || deferred.href) {
      deferred.rel = 'stylesheet';
    }
  }

  // Lazy load images with Intersection Observer
  if ('IntersectionObserver' in window) {
    const lazyImages = [].slice.call(document.querySelectorAll('img.lazy-load'));

    let lazyImageObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          let lazyImage = entry.target;
          // If image hasn't loaded yet, trigger load
          if (!lazyImage.complete) {
            lazyImage.classList.add('lazy-loaded');
          }
          lazyImageObserver.unobserve(lazyImage);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });

    lazyImages.forEach(function (lazyImage) {
      lazyImageObserver.observe(lazyImage);
    });
  }

  // Basic counter animation (optimized)
  const counters = document.querySelectorAll(".count");
  if (counters.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const counter = entry.target;
          const target = +counter.getAttribute("data-target") || 0;
          if (target > 0) {
            animateCounter(counter, target);
          }
          observer.unobserve(counter);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));

    function animateCounter(element, target) {
      let count = 0;
      const increment = target / 50; // Faster animation
      const duration = 1000; // 1 second
      const stepTime = Math.max(16, duration / 50); // ~60fps

      const timer = setInterval(() => {
        count += increment;
        if (count >= target) {
          count = target;
          clearInterval(timer);
        }
        element.textContent = Math.floor(count);
      }, stepTime);
    }
  }
})();

// Deferred JavaScript (loads after page is interactive)
window.addEventListener('load', function () {
  // Newsletter form handling
  const form = document.querySelector('[data-members-form="subscribe"]');

  if (form) {
    const button = form.querySelector("button[type='submit']");
    if (!button) return;

    const defaultText = button.textContent;
    const defaultBg = button.style.backgroundColor || "black";
    const defaultColor = button.style.color || "white";

    // Create inline message element
    let msgEl = form.parentElement.querySelector('.subscribe-msg');
    if (!msgEl) {
      msgEl = document.createElement('p');
      msgEl.className = 'subscribe-msg';
      msgEl.style.cssText = 'margin-top:0.75rem;font-size:0.9rem;font-weight:600;text-align:center;min-height:1.4em;transition:opacity 0.3s ease;';
      form.insertAdjacentElement('afterend', msgEl);
    }

    let resetTimer = null;

    const setMsg = (text, color) => {
      msgEl.textContent = text;
      msgEl.style.color = color;
      msgEl.style.opacity = '1';
    };

    const clearMsg = () => {
      msgEl.style.opacity = '0';
      setTimeout(() => { msgEl.textContent = ''; }, 300);
    };

    const resetButton = () => {
      button.textContent = defaultText;
      button.disabled = false;
      button.style.backgroundColor = defaultBg;
      button.style.color = defaultColor;
      button.classList.remove("state-checking", "state-success", "state-error");
      clearMsg();
    };

    // Intercept Ghost's magic-link fetch to detect 429 rate limiting
    const originalFetch = window.fetch;
    window.fetch = function () {
      return originalFetch.apply(this, arguments).then(function (response) {
        if (arguments[0] && String(arguments[0]).indexOf('send-magic-link') !== -1) {
          if (response.status === 429) {
            form._rateLimited = true;
          } else {
            form._rateLimited = false;
          }
        }
        return response;
      });
    };

    const observer = new MutationObserver(() => {
      if (resetTimer) {
        clearTimeout(resetTimer);
        resetTimer = null;
      }

      button.classList.remove("state-checking", "state-success", "state-error");

      if (form.classList.contains("loading")) {
        button.textContent = "Checking...";
        button.disabled = true;
        button.classList.add("state-checking");
        button.style.backgroundColor = "yellow";
        button.style.color = "black";
        setMsg('', 'transparent');
      }

      else if (form.classList.contains("success")) {
        button.textContent = "Done!";
        button.disabled = true;
        button.classList.add("state-success");
        button.style.backgroundColor = "green";
        button.style.color = "white";
        setMsg('✓ Check your inbox for a confirmation link!', '#16a34a');

        resetTimer = setTimeout(resetButton, 6000);
      }

      else if (form.classList.contains("error")) {
        button.classList.add("state-error");
        button.style.backgroundColor = "red";
        button.style.color = "white";

        if (form._rateLimited) {
          button.textContent = "Slow down";
          button.disabled = true;
          setMsg('Too many attempts — please try again in 10 minutes.', '#dc2626');
          resetTimer = setTimeout(resetButton, 10000);
        } else {
          button.textContent = "Try Again";
          button.disabled = false;
          setMsg('Something went wrong. Please check your email and try again.', '#dc2626');
          resetTimer = setTimeout(resetButton, 5000);
        }
      }

      else {
        resetButton();
      }
    });

    observer.observe(form, {
      attributes: true,
      attributeFilter: ["class"]
    });
  }

  // Add smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"], a[href^="/"]').forEach(anchor => {
    if (anchor.getAttribute('href').startsWith('/')) return;

    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');

      // Skip ghost portal links and bare "#" anchors
      if (href === '#' || href.startsWith('#/portal')) return;

      if (href.startsWith('#') && href.length > 1) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });

  // Add error handling for images
  document.addEventListener('error', function (e) {
    if (e.target.tagName === 'IMG') {
      e.target.style.opacity = '0';
      setTimeout(() => {
        e.target.style.display = 'none';
        const parent = e.target.parentElement;
        if (parent && parent.classList.contains('bbb-img')) {
          parent.innerHTML = '<div style="width:100%;height:100%;background:#f0f0f0;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#999;">Image not available</div>';
        }
      }, 300);
    }
  }, true);

  // TAG PAGE JS
  // ================================
  //      JS FOR SPECIALISATION FIELD
  // ================================ 

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".verified-info").forEach(function (box) {
      const raw = (box.dataset.raw || "").trim();
      const match = raw.match(/Specialisation:\s*(.+)/i);
      const value = match ? match[1].trim() : "—";
      const target = box.querySelector(".verified-specialisation");

      if (target) {
        target.innerText = "Specialisation: " + value;
      }
    });
  });



  const modal = document.getElementById('getStartedModal');
  const triggers = document.querySelectorAll('.js-get-started');
  const closeBtn = modal.querySelector('.gs-close');
  const body = document.body;

  const openModal = () => {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');
  };

  const closeModal = () => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    body.classList.remove('modal-open');
  };

  triggers.forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      openModal();
    });
  });

  closeBtn.addEventListener('click', closeModal);

  window.addEventListener('click', e => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // ESC to close
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

});