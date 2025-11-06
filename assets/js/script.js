document.addEventListener("DOMContentLoaded", () => {
  const counters = document.querySelectorAll('.count');
  const speed = 35;

  const animate = () => {
    counters.forEach(counter => {
      const update = () => {
        const target = +counter.getAttribute('data-target');
        const current = +counter.innerText;
        const increment = Math.ceil(target / speed);

        if (current < target) {
          counter.innerText = current + increment;
          setTimeout(update, 20);
        } else {
          counter.innerText = target;
        }
      };
      update();
    });
  };

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      animate();
      observer.disconnect();
    }
  });

  observer.observe(document.querySelector('.stats-section'));
});
