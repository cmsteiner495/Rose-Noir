// Solid header once you scroll past the initial hero vibe
const header = document.getElementById("siteHeader");
const headerSolidAt = 30; // px

const onScroll = () => {
  if (!header) return;
  if (window.scrollY > headerSolidAt) header.classList.add("is-solid");
  else header.classList.remove("is-solid");
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Page fade-in
document.addEventListener("DOMContentLoaded", () => {
  requestAnimationFrame(() => document.body.classList.add("is-loaded"));
});

// Mobile menu
const mobileToggle = document.getElementById("openMenu");
const mobileMenu = document.getElementById("mobileMenu");

function closeMobileSubmenus(){
  mobileMenu?.querySelectorAll(".mobile-submenu").forEach(panel => {
    panel.hidden = true;
    panel.classList.remove("is-open");
  });
  mobileMenu?.querySelectorAll("[data-mobile-toggle]").forEach(btn => {
    btn.setAttribute("aria-expanded", "false");
  });
}

function setMobileMenu(open){
  if (!mobileMenu || !mobileToggle) return;
  const isOpen = Boolean(open);
  mobileMenu.classList.toggle("is-open", isOpen);
  mobileMenu.hidden = !isOpen;
  mobileToggle.setAttribute("aria-expanded", String(isOpen));
  mobileToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  if (!isOpen) closeMobileSubmenus();
}

mobileToggle?.addEventListener("click", () => {
  const next = !mobileMenu.classList.contains("is-open");
  setMobileMenu(next);
});

mobileMenu?.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => setMobileMenu(false));
});

document.addEventListener("click", (event) => {
  if (!mobileMenu || !mobileToggle) return;
  const isInsideMenu = mobileMenu.contains(event.target);
  const isToggle = mobileToggle.contains(event.target);
  const isVisible = mobileMenu.classList.contains("is-open");
  if (!isVisible) return;
  if (!isInsideMenu && !isToggle) setMobileMenu(false);
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && mobileMenu?.classList.contains("is-open")) setMobileMenu(false);
});

const desktopQuery = window.matchMedia("(min-width: 769px)");
desktopQuery.addEventListener("change", (event) => {
  if (event.matches) setMobileMenu(false);
});

mobileMenu?.querySelectorAll("[data-mobile-toggle]").forEach(btn => {
  btn.addEventListener("click", (event) => {
    event.preventDefault();
    const targetId = btn.getAttribute("data-target");
    const panel = targetId ? document.getElementById(targetId) : null;
    const isOpen = panel?.classList.contains("is-open");
    closeMobileSubmenus();
    if (panel && !isOpen) {
      panel.hidden = false;
      panel.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
    }
  });
});

// Dropdown interactions for desktop hover/focus and mobile tap
(function initNavDropdowns(){
  const navRoots = Array.from(document.querySelectorAll(".nav"));
  if (!navRoots.length) return;

  const hoverNoneQuery = window.matchMedia("(hover: none)");
  const compactWidthQuery = window.matchMedia("(max-width: 900px)");
  const isTouchMode = () => hoverNoneQuery.matches || compactWidthQuery.matches;

  const closeAll = (except = null) => {
    navRoots.forEach(root => {
      root.querySelectorAll(".has-submenu").forEach(item => {
        if (except && item === except) return;
        item.classList.remove("is-open");
        item.querySelector(".nav-link")?.setAttribute("aria-expanded", "false");
      });
    });
  };

  const openItem = (item) => {
    closeAll(item);
    item.classList.add("is-open");
    item.querySelector(".nav-link")?.setAttribute("aria-expanded", "true");
  };

  navRoots.forEach(root => {
    root.querySelectorAll(".has-submenu").forEach(item => {
      const trigger = item.querySelector(".nav-link");
      const submenu = item.querySelector(".submenu");
      if (!trigger || !submenu) return;

      trigger.addEventListener("click", (e) => {
        if (!isTouchMode()) {
          trigger.setAttribute("aria-expanded", "true");
          return;
        }
        if (!item.classList.contains("is-open")) {
          e.preventDefault();
          openItem(item);
        } else {
          closeAll();
        }
      });

      item.addEventListener("mouseenter", () => {
        if (isTouchMode()) return;
        openItem(item);
      });
      item.addEventListener("mouseleave", (e) => {
        if (isTouchMode()) return;
        if (e && item.contains(e.relatedTarget)) return;
        if (item.contains(document.activeElement)) return;
        item.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
      });
      item.addEventListener("focusin", () => openItem(item));
      item.addEventListener("focusout", () => {
        setTimeout(() => {
          if (!item.contains(document.activeElement)) {
            item.classList.remove("is-open");
            trigger.setAttribute("aria-expanded", "false");
          }
        }, 0);
      });
    });
  });

  document.addEventListener("click", (e) => {
    const isInsideNav = navRoots.some(root => root.contains(e.target));
    if (!isInsideNav) closeAll();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll();
  });
})();

// Scroll reveal for shared sections
(function initScrollReveal(){
  const targets = Array.from(document.querySelectorAll(".reveal"));
  if (!targets.length || !("IntersectionObserver" in window)) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const showAll = () => {
    targets.forEach(target => target.classList.add("is-visible"));
  };

  if (reduceMotion.matches) {
    showAll();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -5% 0px" });

  targets.forEach(target => observer.observe(target));

  reduceMotion.addEventListener("change", (event) => {
    if (event.matches) {
      observer.disconnect();
      showAll();
    }
  });
})();

// Hero b-roll double-buffer rotation
(function initHeroVideoRotation(){
  const hero = document.querySelector(".hero");
  const videoBg = document.getElementById("heroVideoBg");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const videoSources = ["img/clip1.mp4", "img/clip2.mp4", "img/clip3.mp4"];
  const CLIP_DURATION = 10000; // ms
  const FADE_DURATION = 1200; // ms
  const CROSSFADE_AT = CLIP_DURATION - FADE_DURATION;

  if (!hero || !videoBg) return;

  const buffers = [
    videoBg.querySelector(".hero-video--a"),
    videoBg.querySelector(".hero-video--b")
  ];

  if (buffers.some(v => !v)) return;

  let activeBuffer = 0;
  let sourceIndex = 0;
  let timerId;

  const disableVideoBg = () => {
    hero.classList.add("video-bg--disabled");
    clearTimeout(timerId);
    buffers.forEach(video => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.classList.remove("is-active");
      video.classList.add("is-idle");
    });
  };

  const primeVideo = (video, src) => {
    if (!video || !src) return;
    if (video.getAttribute("data-src") === src) return;
    video.setAttribute("data-src", src);
    video.src = src;
    video.load();
  };

  const scheduleNext = () => {
    clearTimeout(timerId);
    timerId = window.setTimeout(() => swapBuffers(), CROSSFADE_AT);
  };

  const swapBuffers = () => {
    if (hero.classList.contains("video-bg--disabled")) return;

    const current = buffers[activeBuffer];
    const idleIndex = 1 - activeBuffer;
    const idle = buffers[idleIndex];
    const nextSourceIndex = (sourceIndex + 1) % videoSources.length;

    primeVideo(idle, videoSources[nextSourceIndex]);
    idle.currentTime = 0;

    const playPromise = idle.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise.then(() => {
        current.classList.remove("is-active");
        current.classList.add("is-idle");
        idle.classList.add("is-active");
        idle.classList.remove("is-idle");

        activeBuffer = idleIndex;
        sourceIndex = nextSourceIndex;

        primeVideo(buffers[1 - activeBuffer], videoSources[(sourceIndex + 1) % videoSources.length]);
        scheduleNext();
      }).catch(disableVideoBg);
    } else {
      disableVideoBg();
    }
  };

  const startPlayback = () => {
    buffers.forEach(video => {
      video.muted = true;
      video.loop = false;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.preload = "metadata";
      video.classList.add("is-idle");
      video.addEventListener("ended", swapBuffers, { passive: true });
    });

    primeVideo(buffers[0], videoSources[sourceIndex]);
    primeVideo(buffers[1], videoSources[(sourceIndex + 1) % videoSources.length]);

    buffers[0].classList.add("is-active");
    buffers[0].classList.remove("is-idle");

    const startPromise = buffers[0].play();
    if (startPromise && typeof startPromise.then === "function") {
      startPromise.then(scheduleNext).catch(disableVideoBg);
    } else {
      disableVideoBg();
    }
  };

  if (reduceMotion.matches) {
    hero.classList.add("video-bg--disabled");
    return;
  }

  reduceMotion.addEventListener("change", (event) => {
    if (event.matches) {
      disableVideoBg();
    } else if (hero.classList.contains("video-bg--disabled")) {
      hero.classList.remove("video-bg--disabled");
      activeBuffer = 0;
      sourceIndex = 0;
      startPlayback();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearTimeout(timerId);
      buffers.forEach(video => video.pause());
    } else if (!hero.classList.contains("video-bg--disabled") && !reduceMotion.matches) {
      buffers[activeBuffer].play().then(scheduleNext).catch(disableVideoBg);
    }
  });

  startPlayback();
})();

// Form redirect helper
(function initFormRedirects(){
  const forms = Array.from(document.querySelectorAll("form[data-redirect]"));
  if (!forms.length) return;

  forms.forEach(form => {
    const redirectTo = form.getAttribute("data-redirect") || "/thank-you.html";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const action = form.getAttribute("action");
      const method = (form.getAttribute("method") || "POST").toUpperCase();
      const formData = new FormData(form);

      if (action) {
        let request;
        if (method === "GET") {
          const params = new URLSearchParams(formData).toString();
          const target = params ? `${action}?${params}` : action;
          request = fetch(target, { method: "GET" });
        } else {
          request = fetch(action, { method, body: formData });
        }
        request.catch(() => {}).finally(() => {
          window.location.href = redirectTo;
        });
      } else {
        window.location.href = redirectTo;
      }
    });
  });
})();
