document.addEventListener("DOMContentLoaded", () => {
  // Simple Counter Animation
  const counters = document.querySelectorAll('.count');
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      counters.forEach((counter) => {
        const target = +counter.getAttribute('data-target');
        const increment = target / 50;
        let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            counter.innerHTML = target;
            clearInterval(timer);
          } else {
            counter.innerHTML = Math.ceil(current);
          }
        }, 20);
      });
      observer.disconnect();
    }
  });
  observer.observe(document.querySelector('.stats-orbit'));

  // Swiper for Stories
  new Swiper('.galaxy-swiper', {
    loop: true,
    spaceBetween: 16,
    slidesPerView: 1.1,
    pagination: { el: '.swiper-pagination', clickable: true },
    breakpoints: {
      640:  { slidesPerView: 2.1, spaceBetween: 18 },
      1024: { slidesPerView: 3.1, spaceBetween: 20 }
    }
  });

  // Hamburger Menu Toggle
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('.nebula-nav-horizontal');
  if (hamburger && nav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      nav.classList.toggle('active');
    });
  }
});

document.addEventListener("DOMContentLoaded", function () {
  // Dropdown toggle for mobile
  document.querySelectorAll(".nav-dropdown > .nav-link").forEach(link => {
    link.addEventListener("click", function (e) {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        const parent = this.closest(".nav-dropdown");
        parent.classList.toggle("open");
      }
    });
  });
});