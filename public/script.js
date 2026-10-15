(() => {
  "use strict";

  const live = document.getElementById("live");
  const announce = (message) => {
    live.textContent = "";
    requestAnimationFrame(() => { live.textContent = message; });
  };

  /* copy buttons */
  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;opacity:0;top:0;left:0";
    document.body.append(area);
    area.select();
    const copied = document.execCommand("copy");
    area.remove();
    if (!copied) throw new Error("copy failed");
  }

  document.querySelectorAll("[data-copy]").forEach((button) => {
    const label = button.textContent;
    let timer;
    button.addEventListener("click", async () => {
      const source = button.closest(".code").querySelector("pre code");
      clearTimeout(timer);
      try {
        await copyText(source.textContent.trim());
        button.dataset.state = "ok";
        button.textContent = "Copied";
        announce("Copied to clipboard.");
      } catch {
        button.dataset.state = "error";
        button.textContent = "Copy failed";
        announce("Copy failed. Select the text and copy it manually.");
      }
      timer = setTimeout(() => {
        delete button.dataset.state;
        button.textContent = label;
      }, 1800);
    });
  });

  /* install tabs */
  document.querySelectorAll("[data-tabs]").forEach((root) => {
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    const panels = tabs.map((tab) => document.getElementById(tab.getAttribute("aria-controls")));

    const select = (index, focus) => {
      tabs.forEach((tab, n) => {
        const on = n === index;
        tab.setAttribute("aria-selected", String(on));
        tab.tabIndex = on ? 0 : -1;
        panels[n].hidden = !on;
      });
      window.dispatchEvent(new Event("resize"));
      if (focus) {
        tabs[index].focus({ preventScroll: true });
        tabs[index].scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => select(index));
      tab.addEventListener("keydown", (event) => {
        let next = null;
        if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabs.length - 1;
        if (next !== null) {
          event.preventDefault();
          select(next, true);
        }
      });
    });
    select(0);
  });

  /* side rail: filter, mobile sheet, current section */
  const rail = document.getElementById("rail");
  const menu = document.getElementById("menu");
  const closeButton = document.getElementById("rail-close");
  const filter = document.getElementById("rail-filter");
  const empty = document.getElementById("rail-empty");
  const links = [...rail.querySelectorAll(".rail__link")];
  const sections = [...rail.querySelectorAll(".rail__sec")];
  const mobile = window.matchMedia("(max-width: 59.99rem)");
  let lastFocus = null;

  const isOpen = () => rail.classList.contains("is-open");

  function openMenu() {
    lastFocus = document.activeElement;
    rail.classList.add("is-open");
    rail.setAttribute("role", "dialog");
    rail.setAttribute("aria-modal", "true");
    rail.setAttribute("aria-label", "Menu");
    menu.setAttribute("aria-expanded", "true");
    document.documentElement.classList.add("is-locked");
    void rail.offsetWidth;
    filter.focus();
  }

  function closeMenu(restoreFocus = true) {
    rail.classList.remove("is-open");
    rail.removeAttribute("role");
    rail.removeAttribute("aria-modal");
    rail.setAttribute("aria-label", "Page navigation");
    menu.setAttribute("aria-expanded", "false");
    document.documentElement.classList.remove("is-locked");
    if (restoreFocus && lastFocus) lastFocus.focus({ preventScroll: true });
  }

  menu.addEventListener("click", openMenu);
  closeButton.addEventListener("click", () => closeMenu());
  mobile.addEventListener("change", () => { if (!mobile.matches && isOpen()) closeMenu(false); });

  function applyFilter() {
    const query = filter.value.trim().toLowerCase();
    let any = false;
    sections.forEach((section) => {
      let visible = 0;
      section.querySelectorAll("li").forEach((item) => {
        const hide = Boolean(query) && !item.textContent.toLowerCase().includes(query);
        item.hidden = hide;
        if (!hide) visible += 1;
      });
      section.hidden = visible === 0;
      if (visible) any = true;
    });
    empty.hidden = any;
  }
  filter.addEventListener("input", applyFilter);

  links.forEach((link) => {
    link.addEventListener("click", () => { if (isOpen()) closeMenu(false); });
  });

  document.addEventListener("keydown", (event) => {
    const typing = /^(input|textarea|select)$/i.test(document.activeElement.tagName);
    const shortcut = ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") || (event.key === "/" && !typing);
    if (shortcut) {
      event.preventDefault();
      if (mobile.matches) openMenu();
      else filter.focus();
      return;
    }
    if (document.activeElement === filter) {
      if (event.key === "Enter") {
        const first = links.find((link) => !link.closest("li").hidden && !link.closest(".rail__sec").hidden);
        if (first) first.click();
      } else if (event.key === "Escape" && filter.value) {
        filter.value = "";
        applyFilter();
        event.preventDefault();
        return;
      }
    }
    if (!isOpen()) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
    } else if (event.key === "Tab") {
      const focusable = [...rail.querySelectorAll("a[href], button, input")].filter((el) => el.offsetParent !== null);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  /* current section and stage: the deepest target crossing the probe line wins */
  if ("IntersectionObserver" in window) {
    const targets = [...new Set(links.map((link) => link.getAttribute("href")))]
      .filter((href) => href.startsWith("#"))
      .map((href) => document.getElementById(href.slice(1)))
      .filter(Boolean)
      .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    const stages = [...document.querySelectorAll("[data-stage]")];
    let pinned = null;

    const update = () => {
      const probe = window.innerHeight * 0.3;
      const matches = targets.filter((target) => {
        const box = target.getBoundingClientRect();
        return box.top <= probe && box.bottom > probe;
      });
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      let current = matches[matches.length - 1] || null;
      const pinnedBox = pinned && pinned.getBoundingClientRect();
      const pinnedShown = pinnedBox && pinnedBox.top < window.innerHeight * 0.6 && pinnedBox.bottom > 0;
      if (pinned && (pinnedShown || atBottom)) current = pinned;
      else if (atBottom) current = targets[targets.length - 1];
      links.forEach((link) => {
        if (current && link.getAttribute("href") === `#${current.id}`) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
      stages.forEach((stage) => stage.classList.toggle("is-current", stage === current));
    };

    // A clicked link wins over siblings that share the probe line until the user scrolls.
    // The observer only fires on band crossings, so re-run once the smooth scroll stops.
    let settling = 0;
    const updateWhenStill = () => {
      cancelAnimationFrame(settling);
      let last = -1;
      let still = 0;
      const tick = () => {
        if (window.scrollY === last) {
          still += 1;
          if (still >= 6) { update(); return; }
        } else {
          still = 0;
          last = window.scrollY;
        }
        settling = requestAnimationFrame(tick);
      };
      tick();
    };
    links.forEach((link) => {
      link.addEventListener("click", () => {
        pinned = document.getElementById(link.getAttribute("href").slice(1));
        update();
        updateWhenStill();
      });
    });
    const unpin = () => { pinned = null; };
    window.addEventListener("wheel", unpin, { passive: true });
    window.addEventListener("touchmove", unpin, { passive: true });
    window.addEventListener("keydown", (event) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) unpin();
    });

    const observer = new IntersectionObserver(update, { rootMargin: "-30% 0px -69% 0px" });
    targets.forEach((target) => observer.observe(target));
    update();
  }

  /* code blocks that overflow become keyboard-scrollable */
  const markScrollable = () => {
    document.querySelectorAll(".code__pre").forEach((pre) => {
      if (pre.scrollWidth > pre.clientWidth) {
        pre.tabIndex = 0;
        pre.setAttribute("role", "region");
        pre.setAttribute("aria-label", "Code, scrollable");
      } else {
        pre.removeAttribute("tabindex");
        pre.removeAttribute("role");
        pre.removeAttribute("aria-label");
      }
    });
  };
  markScrollable();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(markScrollable);
  window.addEventListener("resize", () => requestAnimationFrame(markScrollable));
})();
