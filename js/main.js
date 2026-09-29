/* ==========================================================================
   DabbaGo — main.js
   Core application utilities shared by every page.
   --------------------------------------------------------------------------
   Sections
     1.  Namespace + storage
     2.  Theme engine (dark / light)
     3.  Lucide icon hydration
     4.  Toast notifications
     5.  Navbar behaviour (stuck state + mobile drawer)
     6.  Scroll reveal
     7.  FAQ accordion
     8.  Back-to-top
     9.  Auth helpers (frontend demo only)
     10. Favourites / notifications / payments stores
     11. Formatting helpers
     12. Home page renderers
     13. Boot
   ========================================================================== */

(function () {
    "use strict";

    /* ------------------------------------------------------------------
       1. Namespace + storage
       ------------------------------------------------------------------ */

    var KEYS = {
        theme: "dabbago_theme",
        user: "dabbago_user",
        favorites: "dabbago_favorites",
        subscription: "dabbago_subscription",
        delivery: "dabbago_delivery",
        pauseRequests: "dabbago_pause_requests",
        notifications: "dabbago_notifications",
        planSelection: "dabbago_plan_selection",
        payments: "dabbago_payments",
        areaCheck: "dabbago_area_check",
        mealPref: "dabbago_meal_pref"
    };

    var DG = (window.DG = window.DG || {});
    DG.KEYS = KEYS;
    DG.data = DG.data || {};

    function readRaw(key) {
        try {
            return window.localStorage.getItem(key);
        } catch (err) {
            return null;
        }
    }

    function writeRaw(key, value) {
        try {
            window.localStorage.setItem(key, value);
            return true;
        } catch (err) {
            return false;
        }
    }

    function removeRaw(key) {
        try {
            window.localStorage.removeItem(key);
            return true;
        } catch (err) {
            return false;
        }
    }

    DG.store = {
        keys: KEYS,
        get: function (key, fallback) {
            var raw = readRaw(key);
            if (raw === null || raw === undefined) return fallback;
            try {
                var parsed = JSON.parse(raw);
                return parsed === null || parsed === undefined ? fallback : parsed;
            } catch (err) {
                return fallback;
            }
        },
        set: function (key, value) {
            return writeRaw(key, JSON.stringify(value));
        },
        remove: function (key) {
            return removeRaw(key);
        },
        has: function (key) {
            return readRaw(key) !== null;
        }
    };

    DG.debounce = function (fn, wait) {
        var t;
        return function () {
            var ctx = this;
            var args = arguments;
            window.clearTimeout(t);
            t = window.setTimeout(function () {
                fn.apply(ctx, args);
            }, wait || 150);
        };
    };

    DG.clamp = function (n, min, max) {
        return Math.min(max, Math.max(min, n));
    };

    /* ------------------------------------------------------------------
       2. Theme engine
       ------------------------------------------------------------------ */

    var THEME_KEY = KEYS.theme;

    function prefersDark() {
        return (
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
        );
    }

    function storedTheme() {
        try {
            var v = window.localStorage.getItem(THEME_KEY);
            return v === "light" || v === "dark" ? v : null;
        } catch (err) {
            return null;
        }
    }

    DG.theme = {
        get: function () {
            return storedTheme() || (prefersDark() ? "dark" : "light");
        },
        isDark: function () {
            return document.documentElement.classList.contains("dark");
        },
        apply: function (mode, opts) {
            var options = opts || {};
            var isDark = mode === "dark";

            if (options.animate !== false) {
                document.documentElement.classList.add("theme-anim");
                window.clearTimeout(DG.theme._t);
                DG.theme._t = window.setTimeout(function () {
                    document.documentElement.classList.remove("theme-anim");
                }, 340);
            }

            document.documentElement.classList.toggle("dark", isDark);
            document.documentElement.style.colorScheme = isDark ? "dark" : "light";

            var meta = document.querySelector('meta[name="theme-color"]');
            if (meta) meta.setAttribute("content", isDark ? "#17110c" : "#fffbf4");

            if (options.persist !== false) {
                try {
                    window.localStorage.setItem(THEME_KEY, mode);
                } catch (err) {
                    /* storage unavailable — theme still applies for this page */
                }
            }

            document.dispatchEvent(new CustomEvent("dg:themechange", { detail: { mode: mode } }));
            return mode;
        },
        set: function (mode) {
            mode = mode === "dark" ? "dark" : "light";
            DG.theme.apply(mode, { persist: true });
            return mode;
        },
        toggle: function () {
            return DG.theme.set(DG.theme.isDark() ? "light" : "dark");
        }
    };

    /* Keep in sync if the OS preference changes and the user has no saved choice */
    if (window.matchMedia) {
        var mq = window.matchMedia("(prefers-color-scheme: dark)");
        var onScheme = function (e) {
            if (!storedTheme()) DG.theme.apply(e.matches ? "dark" : "light", { persist: false });
        };
        if (mq.addEventListener) mq.addEventListener("change", onScheme);
        else if (mq.addListener) mq.addListener(onScheme);
    }

    /* Any element with [data-dg-theme-toggle] flips the theme (delegated) */
    document.addEventListener("click", function (e) {
        var t = e.target.closest("[data-dg-theme-toggle]");
        if (!t) return;
        e.preventDefault();
        DG.theme.toggle();
    });

    /* ------------------------------------------------------------------
       2b. Text direction (LTR / RTL)
       ------------------------------------------------------------------ */

    var DIR_KEY = "dabbago_dir";

    function storedDir() {
        try {
            var v = window.localStorage.getItem(DIR_KEY);
            return v === "rtl" || v === "ltr" ? v : null;
        } catch (err) {
            return null;
        }
    }

    function syncDirButtons() {
        var rtl = DG.dir.get() === "rtl";
        Array.prototype.forEach.call(
            document.querySelectorAll("[data-dg-dir-toggle]"),
            function (btn) {
                btn.setAttribute("aria-pressed", rtl ? "true" : "false");
                btn.setAttribute("aria-label", rtl ? "Switch to left-to-right" : "Switch to right-to-left");
                btn.setAttribute("title", rtl ? "Switch to LTR" : "Switch to RTL");
            }
        );
    }

    DG.dir = {
        get: function () {
            return document.documentElement.getAttribute("dir") === "rtl" ? "rtl" : "ltr";
        },
        isRtl: function () {
            return DG.dir.get() === "rtl";
        },
        apply: function (dir, opts) {
            var options = opts || {};
            var mode = dir === "rtl" ? "rtl" : "ltr";

            document.documentElement.setAttribute("dir", mode);

            if (options.persist !== false) {
                try {
                    window.localStorage.setItem(DIR_KEY, mode);
                } catch (err) {
                    /* storage unavailable — direction still applies for this page */
                }
            }

            syncDirButtons();
            document.dispatchEvent(new CustomEvent("dg:dirchange", { detail: { dir: mode } }));
            return mode;
        },
        set: function (dir) {
            var mode = DG.dir.apply(dir, { persist: true });
            return mode;
        },
        toggle: function () {
            return DG.dir.set(DG.dir.isRtl() ? "ltr" : "rtl");
        },
        syncButtons: syncDirButtons
    };

    /* Any element with [data-dg-dir-toggle] flips the direction (delegated) */
    document.addEventListener("click", function (e) {
        var b = e.target.closest("[data-dg-dir-toggle]");
        if (!b) return;
        e.preventDefault();
        DG.dir.toggle();
    });

    /* ------------------------------------------------------------------
       3. Lucide icon hydration
       ------------------------------------------------------------------ */

    var ICON_ATTR = "data-lucide";

    DG.icons = function (root) {
        if (!window.lucide || typeof window.lucide.createIcons !== "function") return false;
        try {
            window.lucide.createIcons({
                attrs: {
                    "stroke-width": 2,
                    "aria-hidden": "true",
                    focusable: "false"
                },
                nameAttr: ICON_ATTR,
                root: root || document.body
            });
            return true;
        } catch (err) {
            return false;
        }
    };

    /* Icons are declared with <i data-lucide="name"> so markup stays readable. */
    function hydrateIcons() {
        if (DG.icons()) return;
        /* CDN may still be in flight — retry briefly */
        var tries = 0;
        var timer = window.setInterval(function () {
            tries += 1;
            if (DG.icons() || tries > 40) window.clearInterval(timer);
        }, 50);
    }

    /* Replace <i data-lucide="x"> inside a freshly rendered node with a
       plain fallback if the CDN is unavailable, so nothing renders empty. */
    DG.iconFallback = function (root) {
        var scope = root || document;
        var pending = scope.querySelectorAll("i[" + ICON_ATTR + "]");
        if (!pending.length) return;
        Array.prototype.forEach.call(pending, function (el) {
            var name = el.getAttribute(ICON_ATTR) || "circle-dot";
            var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("viewBox", "0 0 24 24");
            svg.setAttribute("fill", "none");
            svg.setAttribute("stroke", "currentColor");
            svg.setAttribute("stroke-width", "2");
            svg.setAttribute("stroke-linecap", "round");
            svg.setAttribute("stroke-linejoin", "round");
            svg.setAttribute("aria-hidden", "true");
            var c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            c.setAttribute("cx", "12");
            c.setAttribute("cy", "12");
            c.setAttribute("r", "9");
            svg.appendChild(c);
            svg.setAttribute("data-icon-fallback", name);
            el.parentNode.replaceChild(svg, el);
        });
    };

    /* ------------------------------------------------------------------
       4. Toast notifications
       ------------------------------------------------------------------ */

    var TOAST_ICON = {
        success: "circle-check",
        error: "circle-alert",
        warning: "triangle-alert",
        info: "info"
    };

    function toastHost() {
        var host = document.getElementById("dg-toasts");
        if (!host) {
            host = document.createElement("div");
            host.id = "dg-toasts";
            host.className = "dg-toasts";
            host.setAttribute("role", "status");
            host.setAttribute("aria-live", "polite");
            document.body.appendChild(host);
        }
        return host;
    }

    /**
     * DG.toast(message, options)
     * options: { title, type: success|error|warning|info, icon, timeout }
     */
    DG.toast = function (message, options) {
        var opts = options || {};
        var type = opts.type || "info";
        var icon = opts.icon || TOAST_ICON[type] || "info";
        var host = toastHost();

        var el = document.createElement("div");
        el.className = "dg-toast dg-toast-" + type;
        el.setAttribute("role", "alert");

        el.innerHTML =
            '<span class="dg-toast-ico"><i data-lucide="' + icon + '"></i></span>' +
            '<div class="dg-toast-body">' +
            (opts.title ? '<p class="dg-toast-title"></p>' : "") +
            '<p class="dg-toast-msg"></p>' +
            "</div>" +
            '<button type="button" class="dg-toast-close" aria-label="Dismiss notification">' +
            '<i data-lucide="x"></i></button>';

        if (opts.title) el.querySelector(".dg-toast-title").textContent = opts.title;
        el.querySelector(".dg-toast-msg").textContent = message;

        host.appendChild(el);
        DG.icons(el);

        var timeout = opts.timeout === undefined ? 4200 : opts.timeout;
        var timer = null;

        function dismiss() {
            if (!el.parentNode) return;
            el.classList.add("is-out");
            window.setTimeout(function () {
                if (el.parentNode) el.parentNode.removeChild(el);
                var back = document.querySelector(".dg-totop");
                if (back && !host.children.length) back.classList.remove("is-nudged");
            }, 260);
        }

        el.querySelector(".dg-toast-close").addEventListener("click", dismiss);
        if (timeout > 0) timer = window.setTimeout(dismiss, timeout);

        el.addEventListener("mouseenter", function () {
            if (timer) window.clearTimeout(timer);
        });
        el.addEventListener("mouseleave", function () {
            if (timeout > 0) timer = window.setTimeout(dismiss, 1800);
        });

        var toTop = document.querySelector(".dg-totop");
        if (toTop) toTop.classList.add("is-nudged");

        /* keep the stack shallow */
        var all = host.querySelectorAll(".dg-toast");
        if (all.length > 4) all[0].querySelector(".dg-toast-close").click();

        return { dismiss: dismiss, el: el };
    };

    DG.toast.success = function (msg, opts) {
        return DG.toast(msg, Object.assign({ type: "success" }, opts || {}));
    };
    DG.toast.error = function (msg, opts) {
        return DG.toast(msg, Object.assign({ type: "error" }, opts || {}));
    };
    DG.toast.warning = function (msg, opts) {
        return DG.toast(msg, Object.assign({ type: "warning" }, opts || {}));
    };

    /* ------------------------------------------------------------------
       5. Navbar behaviour
       ------------------------------------------------------------------ */

    function initNavStuck() {
        var nav = document.querySelector(".dg-nav");
        if (!nav) return;
        var onScroll = DG.debounce(function () {
            nav.classList.toggle("is-stuck", window.scrollY > 8);
        }, 60);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
    }

    DG.drawer = {
        open: function () {
            var d = document.getElementById("dg-drawer");
            if (!d) return;
            d.classList.add("is-open");
            d.setAttribute("aria-hidden", "false");
            document.body.classList.add("dg-no-scroll");
            var burger = document.querySelector("[data-dg-burger]");
            if (burger) burger.setAttribute("aria-expanded", "true");
            var first = d.querySelector("a, button");
            if (first) window.setTimeout(function () { first.focus(); }, 90);
        },
        close: function () {
            var d = document.getElementById("dg-drawer");
            if (!d) return;
            d.classList.remove("is-open");
            d.setAttribute("aria-hidden", "true");
            document.body.classList.remove("dg-no-scroll");
            var burger = document.querySelector("[data-dg-burger]");
            if (burger) {
                burger.setAttribute("aria-expanded", "false");
                burger.focus();
            }
        },
        isOpen: function () {
            var d = document.getElementById("dg-drawer");
            return !!(d && d.classList.contains("is-open"));
        }
    };

    function initDrawer() {
        document.addEventListener("click", function (e) {
            if (e.target.closest("[data-dg-burger]")) {
                e.preventDefault();
                DG.drawer.isOpen() ? DG.drawer.close() : DG.drawer.open();
                return;
            }
            if (e.target.closest("[data-dg-drawer-close]")) {
                e.preventDefault();
                DG.drawer.close();
                return;
            }
            /* tap the scrim to close */
            if (e.target.closest(".dg-drawer-scrim")) {
                DG.drawer.close();
                return;
            }
            /* any navigation inside the drawer closes it */
            var link = e.target.closest(".dg-drawer a[href]");
            if (link) DG.drawer.close();
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && DG.drawer.isOpen()) DG.drawer.close();
        });

        window.addEventListener("resize", DG.debounce(function () {
            if (window.innerWidth >= 1200 && DG.drawer.isOpen()) DG.drawer.close();
        }, 150));
    }

    /* ------------------------------------------------------------------
       6. Scroll reveal
       Elements opt in with data-dg-reveal so content is visible without JS.
       ------------------------------------------------------------------ */

    var revealObserver = null;

    function ensureObserver() {
        if (revealObserver || !("IntersectionObserver" in window)) return revealObserver;
        revealObserver = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    var el = entry.target;
                    revealObserver.unobserve(el);
                    el.setAttribute("data-dg-revealed", "1");
                    window.requestAnimationFrame(function () {
                        window.requestAnimationFrame(function () {
                            el.classList.add("is-in");
                        });
                    });
                });
            },
            { rootMargin: "0px 0px -8% 0px", threshold: 0.06 }
        );
        return revealObserver;
    }

    DG.reveal = {
        scan: function (root) {
            var scope = root || document;
            var nodes = scope.querySelectorAll("[data-dg-reveal]:not([data-dg-revealed])");
            if (!nodes.length) return;
            var obs = ensureObserver();

            Array.prototype.forEach.call(nodes, function (el) {
                var delay = el.getAttribute("data-dg-delay");
                if (delay) el.setAttribute("data-dg-delay", delay);
                el.classList.add("dg-reveal");

                if (!obs) {
                    /* no IntersectionObserver — show immediately */
                    el.classList.add("is-in");
                    el.setAttribute("data-dg-revealed", "1");
                    return;
                }
                obs.observe(el);
            });
        }
    };

    /* ------------------------------------------------------------------
       7. Accordion (FAQ) — delegated so it works on any container
       ------------------------------------------------------------------ */

    function initAccordion() {
        document.addEventListener("click", function (e) {
            var btn = e.target.closest("[data-dg-acc-btn]");
            if (!btn) return;
            var acc = btn.closest("[data-dg-acc]");
            if (!acc) return;

            var willOpen = acc.getAttribute("data-open") !== "true";

            /* optional single-open behaviour */
            if (willOpen && acc.hasAttribute("data-dg-single")) {
                var group = acc.parentElement;
                if (group) {
                    Array.prototype.forEach.call(
                        group.querySelectorAll('[data-dg-acc][data-open="true"]'),
                        function (other) {
                            other.setAttribute("data-open", "false");
                            var ob = other.querySelector("[data-dg-acc-btn]");
                            if (ob) ob.setAttribute("aria-expanded", "false");
                        }
                    );
                }
            }

            acc.setAttribute("data-open", willOpen ? "true" : "false");
            btn.setAttribute("aria-expanded", willOpen ? "true" : "false");
        });
    }

    /* ------------------------------------------------------------------
       8. Back-to-top
       ------------------------------------------------------------------ */

    function initBackToTop() {
        if (!document.querySelector(".dg-totop")) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "dg-totop";
            btn.setAttribute("aria-label", "Back to top");
            btn.innerHTML = '<i data-lucide="arrow-up"></i>';
            btn.addEventListener("click", function () {
                window.scrollTo({ top: 0, behavior: "smooth" });
            });
            document.body.appendChild(btn);
            DG.icons(btn);
        }

        var totop = document.querySelector(".dg-totop");
        if (totop) {
            var onScroll = DG.debounce(function () {
                totop.classList.toggle("is-shown", window.scrollY > 420);
            }, 100);
            onScroll();
            window.addEventListener("scroll", onScroll, { passive: true });
        }

        /* inline "back to top" links (footer) reuse the same behaviour */
        document.addEventListener("click", function (e) {
            var link = e.target.closest("[data-dg-totop]");
            if (!link) return;
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    /* ------------------------------------------------------------------
       9. Auth helpers — frontend demo only, no backend
       ------------------------------------------------------------------ */

    DG.auth = {
        user: function () {
            return DG.store.get(KEYS.user, null);
        },
        isLoggedIn: function () {
            var u = DG.store.get(KEYS.user, null);
            return !!(u && u.email);
        },
        signIn: function (user) {
            DG.store.set(KEYS.user, user);
            document.dispatchEvent(new CustomEvent("dg:authchange", { detail: { user: user } }));
            return user;
        },
        update: function (patch) {
            var u = DG.auth.user() || {};
            u = Object.assign({}, u, patch);
            DG.store.set(KEYS.user, u);
            document.dispatchEvent(new CustomEvent("dg:authchange", { detail: { user: u } }));
            return u;
        },
        signOut: function () {
            DG.store.remove(KEYS.user);
            DG.store.remove(KEYS.planSelection);
            document.dispatchEvent(new CustomEvent("dg:authchange", { detail: { user: null } }));
        },
        initials: function (name) {
            var parts = String(name || "DabbaGo").trim().split(/\s+/).slice(0, 2);
            return parts
                .map(function (p) { return p.charAt(0).toUpperCase(); })
                .join("") || "DG";
        },
        /* Sends guests to login, remembering where they wanted to go. */
        requireLogin: function (opts) {
            if (DG.auth.isLoggedIn()) return true;
            var o = opts || {};
            DG.toast("Please sign in to continue with your subscription.", {
                title: "Sign in required",
                type: "info"
            });
            var next = o.next || DG.currentPage();
            var url = "login.html?next=" + encodeURIComponent(next);
            if (o.plan) {
                DG.store.set(KEYS.planSelection, { planId: o.plan, at: new Date().toISOString() });
                url += "&plan=" + encodeURIComponent(o.plan);
            }
            window.setTimeout(function () { window.location.href = url; }, 650);
            return false;
        }
    };

    DG.currentPage = function () {
        var file = window.location.pathname.split("/").pop();
        return file && file.indexOf(".html") > -1 ? file : "index.html";
    };

    /* ------------------------------------------------------------------
       10. Favourites / notifications / payments
       ------------------------------------------------------------------ */

    DG.favorites = {
        list: function () {
            var v = DG.store.get(KEYS.favorites, []);
            return Array.isArray(v) ? v : [];
        },
        has: function (id) {
            return DG.favorites.list().indexOf(id) > -1;
        },
        toggle: function (id) {
            var list = DG.favorites.list();
            var i = list.indexOf(id);
            if (i > -1) {
                list.splice(i, 1);
                DG.store.set(KEYS.favorites, list);
                return false;
            }
            list.push(id);
            DG.store.set(KEYS.favorites, list);
            return true;
        },
        count: function () {
            return DG.favorites.list().length;
        }
    };

    DG.notify = {
        list: function () {
            var v = DG.store.get(KEYS.notifications, []);
            return Array.isArray(v) ? v : [];
        },
        unread: function () {
            return DG.notify.list().filter(function (n) { return !n.read; });
        },
        unreadCount: function () {
            return DG.notify.list().filter(function (n) { return !n.read; }).length;
        },
        add: function (item) {
            var list = DG.notify.list();
            var entry = Object.assign(
                {
                    id: "n" + Date.now() + Math.random().toString(36).slice(2, 6),
                    time: new Date().toISOString(),
                    read: false,
                    icon: "bell"
                },
                item || {}
            );
            list.unshift(entry);
            DG.store.set(KEYS.notifications, list.slice(0, 40));
            document.dispatchEvent(new CustomEvent("dg:notify", { detail: entry }));
            return entry;
        },
        markAllRead: function () {
            var list = DG.notify.list().map(function (n) {
                return Object.assign({}, n, { read: true });
            });
            DG.store.set(KEYS.notifications, list);
        },
        clear: function () {
            DG.store.set(KEYS.notifications, []);
        }
    };

    DG.payments = {
        list: function () {
            var v = DG.store.get(KEYS.payments, []);
            return Array.isArray(v) ? v : [];
        },
        add: function (payment) {
            var list = DG.payments.list();
            var entry = Object.assign(
                {
                    id: "DG" + Date.now().toString().slice(-8),
                    date: new Date().toISOString(),
                    status: "Paid",
                    method: "UPI"
                },
                payment || {}
            );
            list.unshift(entry);
            DG.store.set(KEYS.payments, list.slice(0, 30));
            return entry;
        },
        total: function () {
            return DG.payments.list().reduce(function (sum, p) {
                return sum + (Number(p.amount) || 0);
            }, 0);
        }
    };

    /* Delivery data + requests to the kitchen (pause / reschedule).
       Both kinds live in dabbago_pause_requests as an array of records. */
    DG.delivery = {
        schedule: function () {
            var v = DG.store.get(KEYS.delivery, []);
            return Array.isArray(v) ? v : [];
        },
        setSchedule: function (rows) {
            DG.store.set(KEYS.delivery, rows);
        },
        requests: function () {
            var v = DG.store.get(KEYS.pauseRequests, []);
            return Array.isArray(v) ? v : [];
        },
        addRequest: function (req) {
            var list = DG.delivery.requests();
            var entry = Object.assign(
                { id: "r" + Date.now().toString(36), at: new Date().toISOString(), status: "Pending" },
                req || {}
            );
            list.unshift(entry);
            DG.store.set(KEYS.pauseRequests, list.slice(0, 20));
            document.dispatchEvent(new CustomEvent("dg:request", { detail: entry }));
            return entry;
        },
        latest: function (type) {
            var list = DG.delivery.requests();
            for (var i = 0; i < list.length; i++) if (list[i].type === type) return list[i];
            return null;
        },
        /* Active pause — not yet expired */
        pauseActive: function () {
            var p = DG.delivery.latest("pause");
            if (!p) return null;
            if (p.until && new Date(p.until).getTime() < Date.now()) return null;
            return p;
        },
        setPause: function (state) {
            var list = DG.delivery.requests().filter(function (r) { return r.type !== "pause"; });
            if (state) {
                list.unshift(
                    Object.assign(
                        { id: "r" + Date.now().toString(36), at: new Date().toISOString() },
                        state
                    )
                );
            }
            DG.store.set(KEYS.pauseRequests, list.slice(0, 20));
        },
        /* Pending schedule-change request */
        changeRequest: function () {
            var c = DG.delivery.latest("schedule-change");
            return c && c.status === "Pending" ? c : null;
        },
        setChange: function (state) {
            var list = DG.delivery.requests().filter(function (r) { return r.type !== "schedule-change"; });
            if (state) {
                list.unshift(
                    Object.assign(
                        { id: "r" + Date.now().toString(36), at: new Date().toISOString() },
                        state
                    )
                );
            }
            DG.store.set(KEYS.pauseRequests, list.slice(0, 20));
        }
    };

    DG.subscription = {
        get: function () {
            return DG.store.get(KEYS.subscription, null);
        },
        set: function (sub) {
            DG.store.set(KEYS.subscription, sub);
            document.dispatchEvent(new CustomEvent("dg:subscription", { detail: sub }));
            return sub;
        }
    };

    /* ------------------------------------------------------------------
       11. Formatting helpers
       ------------------------------------------------------------------ */

    var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    DG.fmt = {
        money: function (n) {
            var v = Number(n) || 0;
            return "₹" + v.toLocaleString("en-IN", { maximumFractionDigits: 0 });
        },
        date: function (value) {
            var d = value instanceof Date ? value : new Date(value);
            if (isNaN(d.getTime())) return "—";
            return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
        },
        dateShort: function (value) {
            var d = value instanceof Date ? value : new Date(value);
            if (isNaN(d.getTime())) return "—";
            return d.getDate() + " " + MONTHS[d.getMonth()];
        },
        dayName: function (value) {
            var d = value instanceof Date ? value : new Date(value);
            if (isNaN(d.getTime())) return "—";
            return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()];
        },
        time: function (value) {
            var d = value instanceof Date ? value : new Date(value);
            if (isNaN(d.getTime())) return "—";
            var h = d.getHours();
            var m = d.getMinutes();
            var ap = h >= 12 ? "PM" : "AM";
            h = h % 12 || 12;
            return h + ":" + (m < 10 ? "0" : "") + m + " " + ap;
        },
        timeAgo: function (value) {
            var d = new Date(value);
            if (isNaN(d.getTime())) return "";
            var diff = Date.now() - d.getTime();
            var mins = Math.round(diff / 60000);
            if (mins < 1) return "just now";
            if (mins < 60) return mins + " min ago";
            var hrs = Math.round(mins / 60);
            if (hrs < 24) return hrs + (hrs === 1 ? " hour ago" : " hours ago");
            var days = Math.round(hrs / 24);
            if (days < 30) return days + (days === 1 ? " day ago" : " days ago");
            return DG.fmt.date(d);
        },
        addDays: function (value, days) {
            var d = value instanceof Date ? new Date(value.getTime()) : new Date(value);
            d.setDate(d.getDate() + days);
            return d;
        },
        initials: DG.auth.initials
    };

    /* Escape helper for anything interpolated into innerHTML */
    DG.esc = function (str) {
        return String(str === null || str === undefined ? "" : str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    };

    /* ------------------------------------------------------------------
       12. Home page renderers (data driven)
       ------------------------------------------------------------------ */

    DG.home = {};

    /* Today's meal preview — breakfast / lunch / dinner cards */
    DG.home.renderToday = function (root) {
        var host = typeof root === "string" ? document.querySelector(root) : root;
        if (!host || !DG.data.meals) return;

        var todayKey = DG.data.todayKey ? DG.data.todayKey() : null;
        var rows = todayKey
            ? DG.data.meals.filter(function (m) { return m.day === todayKey; })
            : [];

        if (!rows.length) {
            host.innerHTML = '<p class="dg-lede">Menu for today is being updated. Please check back shortly.</p>';
            return;
        }

        /* the featured dish rotates through the meal's main courses, so the
           name and photo change from day to day */
        var days = DG.data.days || [];
        var dayIndex = days.findIndex(function (d) { return d.key === todayKey; });
        if (dayIndex < 0) dayIndex = 0;

        var ICONS = { Breakfast: "coffee", Lunch: "hand-platter", Dinner: "soup" };

        /* The three dishes Today's meal is built around. Named here so they
           are trivial to change, then looked up in the menu data so the photo,
           price, calories, veg mark and description all stay real rather than
           being hardcoded. Edit a name to swap the dish. */
        var HERO = {
            Breakfast: "Idli & Sambar (3 pc)",
            Lunch: "Butter Chicken",
            Dinner: "Chapati (3 pc)"
        };
        function findHero(name) {
            var hit = DG.data.meals.filter(function (m) { return m.name === name; })[0];
            return hit || null;
        }

        /* A side dish makes a poor hero photo, so rotate only across mains.
           Several sides are filed under "thali" in the data (raita, salad,
           dahi), so they are matched by name as well as by category. Breads
           are allowed at dinner, where a thali is built around them. */
        var SIDE_CATS = ["snack", "dessert", "beverage"];
        var SIDE_WORDS = /salad|raita|dahi|chaas|poriyal|papad|jeera rice|plain rice|steamed rice/i;
        function isMain(dish, meal) {
            if (SIDE_CATS.indexOf(dish.cat) !== -1) return false;
            if (SIDE_WORDS.test(dish.name)) return false;
            if (dish.cat === "bread") return meal === "Dinner";
            return true;
        }


        var order = ["Breakfast", "Lunch", "Dinner"];
        var html = order
            .map(function (meal, slot) {
                var items = rows.filter(function (m) { return m.meal === meal; });
                if (!items.length) return "";

                var linkDay = todayKey;
                var hero = findHero(HERO[meal]);

                /* The named dish may be served on a different day. When it is,
                   follow it there so the photo, totals, dish count and the menu
                   link all describe the same real meal instead of a mix. */
                if (hero && !items.some(function (m) { return m.name === hero.name; })) {
                    linkDay = hero.day;
                    items = DG.data.meals.filter(function (m) {
                        return m.day === hero.day && m.meal === meal;
                    });
                    if (!items.length) return "";
                }

                var calories = items.reduce(function (s, i) { return s + (i.kcal || 0); }, 0);
                var price = items.reduce(function (s, i) { return s + (i.price || 0); }, 0);

                var mains = items.filter(function (m) { return isMain(m, meal); });
                if (!mains.length) mains = items;

                /* prefer the named dish, else rotate through the mains */
                var featured = hero
                    ? mains.findIndex(function (m) { return m.name === hero.name; })
                    : -1;
                if (featured < 0) featured = (dayIndex + slot) % mains.length;
                var main = mains[featured];

                var pips = mains
                    .map(function (_, i) {
                        return '<span class="dg-mealcard-pip' + (i === featured ? " is-on" : " is-off") + '"></span>';
                    })
                    .join("");

                return (
                    '<a class="dg-mealcard" data-dg-reveal data-dg-delay="' + slot + '"' +
                    ' href="menu.html?day=' + encodeURIComponent(linkDay) +
                    "&meal=" + encodeURIComponent(meal) + '">' +

                    '<div class="dg-mealcard-media">' +
                    '<img src="assets/images/' + DG.esc(main.img) + '" alt="' + DG.esc(main.name) +
                    '" loading="lazy" width="640" height="400">' +
                    '<div class="dg-mealcard-top">' +
                    '<span class="dg-badge dg-badge-solid"><i data-lucide="' + ICONS[meal] + '"></i>' + meal + "</span>" +
                    (main.veg ? '<span class="dg-veg">Veg</span>' : '<span class="dg-nonveg">Non-veg</span>') +
                    "</div>" +
                    '<div class="dg-mealcard-bottom">' +
                    '<span class="dg-price">' + DG.fmt.money(price) + "</span>" +
                    '<span class="text-xs font-bold">for ' + items.length +
                    (items.length === 1 ? " dish" : " dishes") + "</span>" +
                    "</div></div>" +

                    '<div class="dg-mealcard-body">' +
                    '<h3 class="text-base">' + DG.esc(main.name) + "</h3>" +
                    '<p class="dg-lede dg-clamp-2 text-sm">' + DG.esc(main.desc) + "</p>" +
                    '<div class="dg-mealcard-foot">' +
                    '<span class="dg-badge dg-badge-outline"><i data-lucide="flame"></i>' +
                    calories + " kcal</span>" +
                    pips +
                    '<i data-lucide="arrow-right" class="dg-mealcard-go"></i>' +
                    "</div></div></a>"
                );
            })
            .join("");

        host.innerHTML = html;
        DG.icons(host);
        DG.reveal.scan(host);
    };

    /* Gallery band — a curated set of dishes, named from the live menu data */
    DG.home.renderGallery = function (root) {
        var host = typeof root === "string" ? document.querySelector(root) : root;
        if (!host || !DG.data.meals) return;

        var PICKS = [
            "paneer-butter-masala.jpg",
            "veg-biryani.jpg",
            "chole-bhature.jpg",
            "mutton-rogan-josh.jpg",
            "masala-dosa.jpg"
        ];

        var found = [];
        PICKS.forEach(function (img) {
            var m = DG.data.meals.find(function (x) { return x.img === img; });
            if (m && found.indexOf(m) === -1) found.push(m);
        });

        if (!found.length) found = DG.data.meals.slice(0, PICKS.length);

        var html = found
            .map(function (m, i) {
                return (
                    '<a class="dg-gallery-tile" data-dg-reveal data-dg-delay="' + (i % 5) + '"' +
                    ' href="menu.html?day=' + encodeURIComponent(m.day) +
                    '&meal=' + encodeURIComponent(m.meal) + '">' +

                    '<img class="dg-gallery-img" src="' + DG.esc(m.image) + '" alt="' + DG.esc(m.name) +
                    '" loading="lazy" width="600" height="600">' +

                    '<span class="dg-gallery-cap">' +
                    '<span class="dg-gallery-tag">' + (m.veg ? "Veg" : "Non-veg") + "</span>" +
                    '<span class="dg-gallery-name dg-clamp-2">' + DG.esc(m.name) + "</span>" +
                    '<span class="dg-gallery-meta">' + DG.esc(m.meal) + " · " +
                    DG.esc(DG.fmt.money(m.price)) + " · " + m.kcal + " kcal" +
                    "</span></span>" +

                    '<span class="dg-gallery-go"><i data-lucide="arrow-right"></i></span>' +
                    "</a>"
                );
            })
            .join("");

        host.innerHTML = html;
        DG.icons(host);
        DG.reveal.scan(host);
    };

    /* Popular subscription plans teaser */
    DG.home.renderPlans = function (root) {
        var host = typeof root === "string" ? document.querySelector(root) : root;
        if (!host || !DG.data.plans || !DG.data.plans.length) return;

        var all = DG.data.plans.slice().sort(function (a, b) { return a.price - b.price; });

        /* Build a price ladder \u2014 entry plan, popular plan, premium plan \u2014 instead of
           just filtering on `popular`, which only ever matches a single plan. */
        var picks = [];
        var pop = all.filter(function (p) { return p.popular; })[0];
        if (pop) picks.push(pop);
        if (all[0] && picks.indexOf(all[0]) === -1) picks.push(all[0]);
        var dear = all[all.length - 1];
        if (dear && picks.indexOf(dear) === -1) picks.push(dear);
        picks.sort(function (a, b) { return a.price - b.price; });

        var html = picks
            .map(function (p, i) {
                var save = Math.max(0, (p.wasPrice || 0) - p.price);
                var off = p.wasPrice ? Math.round((save / p.wasPrice) * 100) : 0;
                var per = p.totalMeals ? Math.round(p.price / p.totalMeals) : 0;

                return (
                    '<a class="dg-plancard' + (p.popular ? " is-featured" : "") +
                    (p.badge ? "" : " no-flag") + '"' +
                    ' data-dg-reveal data-dg-delay="' + i + '"' +
                    ' href="plans.html#' + encodeURIComponent(p.id) + '">' +

                    (p.badge
                        ? '<span class="dg-plancard-flag' + (p.popular ? " is-solid" : "") + '">' +
                          '<i data-lucide="sparkles"></i>' + DG.esc(p.badge) + "</span>"
                        : "") +

                    '<div class="dg-plancard-body">' +

                    '<div class="dg-plancard-head">' +
                    '<span class="dg-icon-tile ' + (p.tone === "green" ? "dg-icon-tile-green" : p.tone === "brown" ? "dg-icon-tile-brown" : "") + '">' +
                    '<i data-lucide="' + DG.esc(p.icon) + '"></i></span>' +
                    "<div class=\"min-w-0\"><h3>" + DG.esc(p.name) + "</h3>" +
                    '<p class="dg-plancard-tag">' + DG.esc(p.tagline) + "</p></div></div>" +

                    '<div class="dg-plancard-price">' +
                    '<span class="dg-price">' + DG.fmt.money(p.price) + "</span>" +
                    '<span class="dg-plancard-per">per ' + DG.esc(p.perLabel) + "</span>" +
                    "</div>" +

                    '<div class="dg-plancard-save">' +
                    "<s>" + DG.fmt.money(p.wasPrice) + "</s>" +
                    (save
                        ? '<span class="dg-plancard-off">Save ' + DG.fmt.money(save) +
                          (off ? " (" + off + "%)" : "") + "</span>"
                        : "") +
                    "</div>" +

                    (per
                        ? '<p class="dg-plancard-permeal"><b>' + DG.fmt.money(per) + "</b> a meal &middot; " +
                          p.totalMeals + " meals</p>"
                        : "") +

                    '<div class="dg-plancard-spec">' +
                    "<div><span>Meals a day</span><b>" + p.mealsPerDay + "</b></div>" +
                    "<div><span>Duration</span><b>" + DG.esc(p.duration) + "</b></div>" +
                    "<div><span>Best for</span><b>" + DG.esc(p.bestFor) + "</b></div>" +
                    "</div>" +

                    '<ul class="dg-plancard-feats">' +
                    p.features
                        .slice(0, 3)
                        .map(function (f) {
                            return '<li><i data-lucide="check" class="dg-tick"></i><span>' + DG.esc(f) + "</span></li>";
                        })
                        .join("") +
                    "</ul>" +

                    '<span class="dg-btn ' + (p.popular ? "dg-btn-primary" : "dg-btn-outline") +
                    ' dg-btn-block mt-auto">View plan<i data-lucide="arrow-right"></i></span>' +

                    "</div></a>"
                );
            })
            .join("");

        host.innerHTML = html;
        DG.icons(host);
        DG.reveal.scan(host);
    };

    /* Delivery zones */
    DG.home.renderAreas = function (root) {
        var host = typeof root === "string" ? document.querySelector(root) : root;
        if (!host || !DG.data.zones) return;

        var zones = DG.data.zones;
        var html = zones
            .map(function (z, i) {
                return (
                    '<article class="dg-zonecard' + (z.charge === 0 ? " is-free" : "") + '"' +
                    ' data-dg-reveal data-dg-delay="' + i + '">' +

                    '<div class="dg-zonecard-head">' +
                    '<span class="dg-zonecard-dot is-' + DG.esc(z.color || "orange") + '"></span>' +
                    "<h3>" + DG.esc(z.name) + "</h3>" +
                    "</div>" +

                    '<p class="dg-zonecard-areas dg-clamp-2">' + DG.esc(z.areas) + "</p>" +

                    '<div class="dg-zonecard-meta">' +
                    '<span class="dg-badge dg-badge-outline"><i data-lucide="timer"></i>' + DG.esc(z.eta) + "</span>" +
                    '<span class="dg-badge ' + (z.charge === 0 ? "dg-badge-green" : "dg-badge-orange") + '">' +
                    (z.charge === 0 ? "Free delivery" : DG.fmt.money(z.charge) + " delivery") + "</span>" +
                    "</div>" +

                    '<p class="dg-zonecard-min">Minimum order ' + DG.fmt.money(z.min) + "</p>" +
                    "</article>"
                );
            })
            .join("");

        host.innerHTML = html;
        DG.icons(host);
        DG.reveal.scan(host);
    };

    /* ------------------------------------------------------------------
       13. Boot
       ------------------------------------------------------------------ */

    var booted = false;

    function boot() {
        if (booted) return;
        booted = true;

        /* theme: the inline <head> script already set the class — just
           make sure it matches what we consider "current" */
        var mode = DG.theme.isDark() ? "dark" : "light";
        if (mode !== DG.theme.get()) {
            DG.theme.apply(mode, { persist: true, animate: false });
        }

        /* chrome */
        if (typeof DG.renderNavbar === "function") DG.renderNavbar();
        if (typeof DG.renderFooter === "function") DG.renderFooter();

        initNavStuck();
        initDrawer();
        initAccordion();
        initBackToTop();
        hydrateIcons();

        /* page-specific bootstraps declared by the page module */
        var page = document.body.getAttribute("data-page");
        if (page && typeof DG.pages === "object" && DG.pages && typeof DG.pages[page] === "function") {
            try {
                DG.pages[page]();
            } catch (err) {
                /* keep the page usable if a page module fails */
                if (window.console && console.error) console.error("DabbaGo: page init failed —", err);
            }
        }

        /* home data-driven blocks */
        if (page === "home") {
            DG.home.renderToday("#dg-home-today");
            DG.home.renderGallery("#dg-home-gallery");
            DG.home.renderPlans("#dg-home-plans");
            DG.home.renderAreas("#dg-home-areas");
        }

        DG.reveal.scan(document);
    }

    DG.pages = DG.pages || {};
    DG.iconFallbackTimeout = null;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        /* this file is deferred, so readyState is already "interactive" while
           nav.js / footer.js / the page modules have not run yet — yield one
           task so every sibling script registers itself before we boot */
        window.setTimeout(boot, 0);
    }

    /* If Lucide never arrives, swap placeholders for neutral glyphs so the
       layout never shows empty gaps. */
    window.setTimeout(function () {
        if (!window.lucide) {
            DG.iconFallback(document);
            DG.iconFallbackTimeout = null;
        }
    }, 4000);
})();
