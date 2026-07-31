gsap.registerPlugin(ScrollTrigger);

if (window.innerWidth > 768) {
  const track = document.querySelector(".horizontal-track");
  gsap.to(track, {
    x: () => -(track.scrollWidth - window.innerWidth),
    y: -550,
    ease: "none",
    scrollTrigger: {
      trigger: ".horizontal-section",
      start: "top 15%",
      end: () => "+=" + (track.scrollWidth - window.innerWidth),
      pin: true,
      scrub: 1
    }
  });
}
