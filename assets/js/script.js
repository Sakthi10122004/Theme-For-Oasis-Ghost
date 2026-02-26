// INDEX PAGE JS

// Critical JavaScript (loads immediately)

(function () {
  // =====================================================
  //  GHOST NATIVE ANNOUNCEMENT BAR DETECTION
  //  Dynamically measures the bar height and sets the
  //  CSS variable so header + content offset correctly.
  // =====================================================
  (function detectAnnouncementBar() {
    var root = document.documentElement;
    var resizeObs = null;

    function applyBarHeight(bar) {
      var h = bar.getBoundingClientRect().height;
      root.style.setProperty('--announcement-bar-height', h + 'px');
      root.style.setProperty('--announcement-bar-height-js', h + 'px');
      document.body.classList.add('has-announcement-bar');
    }

    function removeBarHeight() {
      root.style.setProperty('--announcement-bar-height', '0px');
      root.style.removeProperty('--announcement-bar-height-js');
      document.body.classList.remove('has-announcement-bar');
      if (resizeObs) { resizeObs.disconnect(); resizeObs = null; }
    }

    function watchBar(bar) {
      applyBarHeight(bar);
      if (typeof ResizeObserver !== 'undefined') {
        resizeObs = new ResizeObserver(function () { applyBarHeight(bar); });
        resizeObs.observe(bar);
      }
    }

    // Check if bar already exists (e.g. cached DOM)
    var existing = document.querySelector('.gh-announcement-bar');
    if (existing) { watchBar(existing); }

    // Watch for Ghost to inject it (or remove it)
    new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var added = mutations[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var node = added[j];
          if (node.nodeType === 1) {
            if (node.classList && node.classList.contains('gh-announcement-bar')) {
              watchBar(node); return;
            }
            var inner = node.querySelector && node.querySelector('.gh-announcement-bar');
            if (inner) { watchBar(inner); return; }
          }
        }
        var removed = mutations[i].removedNodes;
        for (var k = 0; k < removed.length; k++) {
          var rn = removed[k];
          if (rn.nodeType === 1 && rn.classList && rn.classList.contains('gh-announcement-bar')) {
            removeBarHeight(); return;
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

  // =====================================================
  //  FOOTER: Replace social link text with SVG icons
  // =====================================================
  (function replaceSocialIcons() {
    var socialIcons = {
      linkedin: '<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.2 0H1.8C1.32261 0 0.864773 0.18964 0.527213 0.527213C0.18964 0.864773 0 1.32261 0 1.8V22.2C0 22.6773 0.18964 23.1352 0.527213 23.4728C0.864773 23.8104 1.32261 24 1.8 24H22.2C22.6773 24 23.1352 23.8104 23.4728 23.4728C23.8104 23.1352 24 22.6773 24 22.2V1.8C24 1.32261 23.8104 0.864773 23.4728 0.527213C23.1352 0.18964 22.6773 0 22.2 0ZM7.2 20.4H3.6V9.6H7.2V20.4ZM5.4 7.5C4.98741 7.48821 4.58747 7.35509 4.25011 7.11729C3.91275 6.87949 3.65293 6.54755 3.50316 6.16293C3.35337 5.77832 3.32025 5.35809 3.40793 4.95476C3.4956 4.55144 3.7002 4.18288 3.99613 3.89517C4.29208 3.60745 4.66624 3.41332 5.07188 3.33704C5.47752 3.26075 5.89664 3.30569 6.27688 3.46625C6.65712 3.6268 6.98163 3.89585 7.20983 4.23977C7.43804 4.58371 7.55983 4.98725 7.56 5.4C7.55052 5.96441 7.318 6.50213 6.91327 6.89564C6.50852 7.28913 5.96447 7.50643 5.4 7.5ZM20.4 20.4H16.8V14.712C16.8 13.008 16.08 12.396 15.144 12.396C14.8696 12.4143 14.6015 12.4865 14.3551 12.6088C14.1087 12.7309 13.8888 12.9007 13.7081 13.108C13.5276 13.3155 13.3896 13.5565 13.3024 13.8173C13.2152 14.0781 13.1804 14.3536 13.2 14.628C13.194 14.6839 13.194 14.7401 13.2 14.796V20.4H9.6V9.6H13.08V11.16C13.4311 10.626 13.9133 10.1911 14.4807 9.89693C15.048 9.6028 15.6813 9.4592 16.32 9.48C18.18 9.48 20.352 10.512 20.352 13.872L20.4 20.4Z" fill="currentColor"/></svg>',
      whatsapp: '<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.05 4.91C18.1332 3.98392 17.0412 3.24967 15.8377 2.75005C14.6341 2.25043 13.3432 1.99546 12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91ZM12.04 20.15C10.56 20.15 9.11 19.75 7.84 19L7.54 18.82L4.42 19.64L5.25 16.6L5.05 16.29C4.2278 14.977 3.79119 13.4593 3.79 11.91C3.79 7.37 7.49 3.67 12.04 3.67C14.23 3.67 16.3 4.52 17.85 6.08C18.6175 6.84497 19.2257 7.75266 19.6394 8.7512C20.0531 9.74975 20.264 10.8199 20.26 11.9C20.28 16.46 16.58 20.15 12.04 20.15ZM16.56 13.99C16.31 13.87 15.09 13.27 14.87 13.18C14.64 13.1 14.48 13.06 14.31 13.3C14.14 13.55 13.67 14.11 13.53 14.27C13.39 14.44 13.24 14.46 12.99 14.33C12.74 14.21 11.94 13.94 11 13.1C10.26 12.44 9.77 11.63 9.62 11.38C9.48 11.13 9.6 11 9.73 10.87C9.84 10.76 9.98 10.58 10.1 10.44C10.22 10.3 10.27 10.19 10.35 10.03C10.43 9.86 10.39 9.72 10.33 9.6C10.27 9.48 9.77 8.26 9.57 7.76C9.37 7.28 9.16 7.34 9.01 7.33H8.53C8.36 7.33 8.1 7.39 7.87 7.64C7.65 7.89 7.01 8.49 7.01 9.71C7.01 10.93 7.9 12.11 8.02 12.27C8.14 12.44 9.77 14.94 12.25 16.01C12.84 16.27 13.3 16.42 13.66 16.53C14.25 16.72 14.79 16.69 15.22 16.63C15.7 16.56 16.69 16.03 16.89 15.45C17.1 14.87 17.1 14.38 17.03 14.27C16.96 14.16 16.81 14.11 16.56 13.99Z" fill="currentColor"/></svg>',
      instagram: '<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.982C14.937 2.982 15.285 2.993 16.445 3.046C17.1424 3.05412 17.8331 3.18233 18.487 3.425C18.965 3.60111 19.3973 3.88237 19.752 4.248C20.1176 4.60269 20.3989 5.035 20.575 5.513C20.8177 6.16685 20.9459 6.85762 20.954 7.555C21.007 8.715 21.018 9.063 21.018 12C21.018 14.937 21.007 15.285 20.954 16.445C20.9459 17.1424 20.8177 17.8331 20.575 18.487C20.3919 18.9615 20.1116 19.3924 19.752 19.752C19.3924 20.1116 18.9615 20.3919 18.487 20.575C17.8331 20.8177 17.1424 20.9459 16.445 20.954C15.285 21.007 14.937 21.018 12 21.018C9.063 21.018 8.715 21.007 7.555 20.954C6.85762 20.9459 6.16685 20.8177 5.513 20.575C5.035 20.3989 4.60269 20.1176 4.248 19.752C3.88237 19.3973 3.60111 18.965 3.425 18.487C3.18233 17.8331 3.05412 17.1424 3.046 16.445C2.993 15.285 2.982 14.937 2.982 12C2.982 9.063 2.993 8.715 3.046 7.555C3.05412 6.85762 3.18233 6.16685 3.425 5.513C3.60111 5.035 3.88237 4.60269 4.248 4.248C4.60269 3.88237 5.035 3.60111 5.513 3.425C6.16685 3.18233 6.85762 3.05412 7.555 3.046C8.715 2.993 9.063 2.982 12 2.982ZM12 1C9.013 1 8.638 1.013 7.465 1.066C6.55258 1.08486 5.6499 1.25762 4.795 1.577C4.06355 1.86017 3.3994 2.29319 2.84521 2.84824C2.29102 3.40329 1.85904 4.06811 1.577 4.8C1.25762 5.6549 1.08486 6.55758 1.066 7.47C1.013 8.638 1 9.013 1 12C1 14.987 1.013 15.362 1.066 16.535C1.08486 17.4474 1.25762 18.3501 1.577 19.205C1.86017 19.9365 2.29319 20.6006 2.84824 21.1548C3.40329 21.709 4.06811 22.141 4.8 22.423C5.6549 22.7424 6.55758 22.9151 7.47 22.934C8.638 22.987 9.013 23 12 23C14.987 23 15.362 22.987 16.535 22.934C17.4474 22.9151 18.3501 22.7424 19.205 22.423C19.9365 22.1398 20.6006 21.7068 21.1548 21.1518C21.709 20.5967 22.141 19.9319 22.423 19.2C22.7424 18.3451 22.9151 17.4424 22.934 16.53C22.987 15.362 23 14.987 23 12C23 9.013 22.987 8.638 22.934 7.465C22.9151 6.55258 22.7424 5.6499 22.423 4.795C22.1398 4.06355 21.7068 3.3994 21.1518 2.84521C20.5967 2.29102 19.9319 1.85904 19.2 1.577C18.3451 1.25762 17.4424 1.08486 16.53 1.066C15.362 1.013 14.987 1 12 1Z" fill="currentColor"/><path d="M11.9996 6.35107C10.8823 6.35107 9.79015 6.68238 8.86117 7.3031C7.9322 7.92382 7.20815 8.80608 6.78059 9.8383C6.35303 10.8705 6.24116 12.0063 6.45913 13.1021C6.6771 14.1979 7.21512 15.2045 8.00514 15.9945C8.79517 16.7845 9.80172 17.3226 10.8975 17.5405C11.9933 17.7585 13.1291 17.6466 14.1614 17.2191C15.1936 16.7915 16.0758 16.0675 16.6966 15.1385C17.3173 14.2095 17.6486 13.1173 17.6486 12.0001C17.6486 10.5019 17.0534 9.06502 15.994 8.00563C14.9346 6.94624 13.4978 6.35107 11.9996 6.35107ZM11.9996 15.6671C11.2743 15.6671 10.5653 15.452 9.96231 15.0491C9.35928 14.6461 8.88927 14.0734 8.61172 13.4034C8.33418 12.7333 8.26156 11.996 8.40305 11.2847C8.54454 10.5734 8.89379 9.91995 9.40663 9.40711C9.91947 8.89427 10.5729 8.54503 11.2842 8.40353C11.9955 8.26204 12.7328 8.33466 13.4029 8.61221C14.0729 8.88975 14.6457 9.35976 15.0486 9.9628C15.4515 10.5658 15.6666 11.2748 15.6666 12.0001C15.6666 12.9726 15.2802 13.9053 14.5925 14.593C13.9049 15.2807 12.9721 15.6671 11.9996 15.6671Z" fill="currentColor"/><path d="M17.8718 7.44811C18.6008 7.44811 19.1918 6.85712 19.1918 6.12811C19.1918 5.39909 18.6008 4.80811 17.8718 4.80811C17.1427 4.80811 16.5518 5.39909 16.5518 6.12811C16.5518 6.85712 17.1427 7.44811 17.8718 7.44811Z" fill="currentColor"/></svg>',
      facebook: '<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 12.073C24 5.446 18.627 0.073 12 0.073C5.373 0.073 0 5.446 0 12.073C0 18.063 4.388 23.027 10.125 23.927V15.573H7.078V12.073H10.125V9.413C10.125 6.387 11.917 4.716 14.658 4.716C15.97 4.716 17.344 4.952 17.344 4.952V7.923H15.831C14.34 7.923 13.875 8.854 13.875 9.808V12.073H17.203L16.671 15.573H13.875V23.927C19.612 23.027 24 18.063 24 12.073Z" fill="currentColor"/></svg>',
      twitter: '<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"/></svg>',
      youtube: '<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="currentColor"/></svg>',
      github: '<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" fill="currentColor"/></svg>'
    };

    var footerNav = document.querySelector('.footer-nav-secondary');
    if (!footerNav) return;

    var items = footerNav.querySelectorAll('li');
    items.forEach(function (li) {
      var className = li.className || '';
      var link = li.querySelector('a');
      if (!link) return;

      // Match social platform from Ghost's auto-generated nav-xxx class
      var matched = null;
      Object.keys(socialIcons).forEach(function (key) {
        if (className.indexOf('nav-' + key) !== -1) matched = key;
      });

      if (matched) {
        link.innerHTML = socialIcons[matched];
        link.setAttribute('aria-label', matched.charAt(0).toUpperCase() + matched.slice(1));
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });
  })();


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
