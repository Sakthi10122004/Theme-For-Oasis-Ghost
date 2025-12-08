// INDEX PAGE JS

// Critical JavaScript (loads immediately)
(function() {
  // Load deferred CSS
  var deferred = document.querySelector('link[rel="preload"][as="style"]');
  if (deferred) {
    deferred.onload = function() {
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
    
    let lazyImageObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
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

    lazyImages.forEach(function(lazyImage) {
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
window.addEventListener('load', function() {
  // Newsletter form handling
  const form = document.querySelector('[data-members-form="subscribe"]');
  if (form) {
    const button = form.querySelector("button[type='submit']");
    if (button) {
      const defaultText = button.textContent;

      const observer = new MutationObserver(() => {
        button.classList.remove("state-checking", "state-success", "state-error");

        if (form.classList.contains("loading")) {
          button.textContent = "Checking...";
          button.classList.add("state-checking");
          button.disabled = true;
        }
        else if (form.classList.contains("success")) {
          button.textContent = "Done!";
          button.classList.add("state-success");
          button.disabled = true;
        }
        else if (form.classList.contains("error")) {
          button.textContent = "Try Again";
          button.classList.add("state-error");
          button.disabled = false;

          setTimeout(() => {
            button.textContent = defaultText;
            button.classList.remove("state-error");
          }, 2000);
        }
        else {
          button.textContent = defaultText;
          button.disabled = false;
        }
      });

      observer.observe(form, { attributes: true, attributeFilter: ["class"] });
    }
  }
  
  // Infinite scroll animations (non-critical)
  const scrollContainer = document.querySelector(".impact-scroll");
  if (scrollContainer && scrollContainer.children.length > 0) {
    // Only duplicate if we have content
    scrollContainer.innerHTML += scrollContainer.innerHTML;
  }
  
  // Add smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"], a[href^="/"]').forEach(anchor => {
    if (anchor.getAttribute('href').startsWith('/')) return;
    
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
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
});

// Add error handling for images
document.addEventListener('error', function(e) {
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
  document.querySelectorAll(".verified-info").forEach(function(box) {
    const raw = (box.dataset.raw || "").trim();
    const match = raw.match(/Specialisation:\s*(.+)/i);
    const value = match ? match[1].trim() : "—";
    const target = box.querySelector(".verified-specialisation");
    
    if (target) {
      target.innerText = "Specialisation: " + value;
    }
  });
});


// PAGE.hbs JS
// Basic link handling - remove download and open in new tab
document.addEventListener("DOMContentLoaded", function () {
    const fileCards = document.querySelectorAll(".kg-file-card a");
    
    fileCards.forEach(function (link) {
        link.removeAttribute("download");
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
    });
    
    // Generate PDF previews if PDF.js is available
    generatePDFPreviews();
});

// Function to generate PDF previews
async function generatePDFPreviews() {
    // Check if PDF.js is loaded
    if (typeof pdfjsLib === 'undefined') {
        console.warn('PDF.js library not loaded. PDF previews disabled.');
        return;
    }
    
    // Configure PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    // Get all PDF file cards
    const pdfCards = document.querySelectorAll(".kg-file-card a");
    
    // Process each PDF card
    pdfCards.forEach(async (link) => {
        const url = link.href;
        
        // Only process PDF files
        if (!url.toLowerCase().endsWith('.pdf')) {
            return;
        }
        
        try {
            // Load the PDF
            const pdf = await pdfjsLib.getDocument(url).promise;
            
            // Get the first page
            const page = await pdf.getPage(1);
            
            // Set preview scale
            const scale = 0.3;
            const viewport = page.getViewport({ scale });
            
            // Create canvas for preview
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            canvas.className = "pdf-preview";
            
            // Render PDF page to canvas
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            
            // Find or create icon container
            let iconBox = link.querySelector(".kg-file-card-icon");
            if (!iconBox) {
                // Create icon container if it doesn't exist
                iconBox = document.createElement("div");
                iconBox.className = "kg-file-card-icon";
                link.insertBefore(iconBox, link.firstChild);
            }
            
            // Clear existing content and add preview
            iconBox.innerHTML = "";
            iconBox.appendChild(canvas);
            
            // Add PDF label
            const pdfLabel = document.createElement("div");
            pdfLabel.className = "pdf-label";
            pdfLabel.textContent = "PDF";
            iconBox.appendChild(pdfLabel);
            
        } catch (err) {
            console.error("Error generating PDF preview:", err);
            // Fallback to default icon
            const iconBox = link.querySelector(".kg-file-card-icon");
            if (iconBox) {
                iconBox.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M16 13H8"></path><path d="M16 17H8"></path><path d="M10 9H8"></path></svg>';
            }
        }
    });
}

// COMMUNITY PAGE JS
// ================================
//      JS FOR SLIDER
// ================================ 
document.addEventListener('DOMContentLoaded', function() {
    const sliders = document.querySelectorAll('[data-slider]');
    sliders.forEach(function(slider) {
        const track = slider.querySelector('[data-slider-track]');
        const slides = Array.from(slider.querySelectorAll('[data-slider-slide]'));
        if (!track || slides.length <= 1) return;
        let currentIndex = 0;
        const totalSlides = slides.length;
        let autoTimer = null;
        function updateUI() {
            track.style.transform = 'translateX(-' + (currentIndex * 100) + '%)';
        }
        function nextSlide() {
            currentIndex = (currentIndex + 1) % totalSlides;
            updateUI();
        }
        function startAuto() {
            if (autoTimer) clearInterval(autoTimer);
            autoTimer = setInterval(nextSlide, 5000);
        }
        function stopAuto() {
            if (autoTimer) clearInterval(autoTimer);
        }
        updateUI();
        startAuto();
        slider.addEventListener('mouseenter', stopAuto);
        slider.addEventListener('mouseleave', startAuto);
        let startX;
        slider.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
            stopAuto();
        });
        slider.addEventListener('touchend', function(e) {
            const endX = e.changedTouches[0].clientX;
            if (startX - endX > 50) nextSlide();
            else if (endX - startX > 50) {
                currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
                updateUI();
            }
            startAuto();
        });
    });
});