// INDEX PAGE JS

// Critical JavaScript (loads immediately)

(function () {
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

  let resetTimer = null;

  const resetButton = () => {
    button.textContent = defaultText;
    button.disabled = false;
    button.style.backgroundColor = defaultBg;
    button.style.color = defaultColor;
    button.classList.remove("state-checking", "state-success", "state-error");
  };

  const observer = new MutationObserver(() => {
    // Clear any previous reset
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
    }

    else if (form.classList.contains("success")) {
      button.textContent = "Done!";
      button.disabled = true;
      button.classList.add("state-success");
      button.style.backgroundColor = "green";
      button.style.color = "white";

      resetTimer = setTimeout(resetButton, 4000);
    }

    else if (form.classList.contains("error")) {
      button.textContent = "Try Again";
      button.disabled = false;
      button.classList.add("state-error");
      button.style.backgroundColor = "red";
      button.style.color = "white";

      resetTimer = setTimeout(resetButton, 4000);
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

      // 👇 allow ghost portal
      if (href.startsWith('#/portal')) return;

      if (href.startsWith('#')) {
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

  triggers.forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      modal.style.display = 'block';
      modal.setAttribute('aria-hidden', 'false');
    });
  });

  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  });

  window.addEventListener('click', e => {
    if (e.target === modal) {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
    }
  });

});
