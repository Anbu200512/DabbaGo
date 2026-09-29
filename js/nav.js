/* ==========================================================================
   DabbaGo - nav.js
   Builds the sticky navbar and the mobile drawer.
   Rendered by main.js on boot so every page stays in sync.
   ========================================================================== */

(function () {
    "use strict";

    var DG = (window.DG = window.DG || {});

    /* Single page links keep `href`. Entries with `items` render as a dropdown. */
    var LINKS = [
        {
            label: "Home",
            icon: "house",
            items: [
                { href: "index.html", label: "Home 1", icon: "house" },
                { href: "home2.html", label: "Home 2", icon: "home" }
            ]
        },
        { href: "about.html", label: "About", icon: "book-open" },
        { href: "menu.html", label: "Menu", icon: "utensils-crossed" },
        { href: "plans.html", label: "Plans", icon: "wallet" },
        { href: "delivery-area.html", label: "Delivery Area", icon: "map-pin" },
        { href: "contact.html", label: "Contact", icon: "headset" },
        {
            label: "Dashboard",
            icon: "layout-dashboard",
            items: [
                { href: "admin.html", label: "Admin", icon: "shield-check" },
                { href: "user.html", label: "User", icon: "user-round" }
            ]
        }
    ];

    var CARET = '<i data-lucide="chevron-down" class="dg-dd-caret"></i>';

    function isGroup(link) {
        return !!(link && link.items && link.items.length);
    }

    function groupActive(link, current) {
        return isGroup(link) && link.items.some(function (i) { return i.href === current; });
    }

    var LOGO =
        '<span class="dg-logo-mark"><i data-lucide="cooking-pot"></i></span>' +
        '<span>Dabba<em>Go</em></span>';

    function esc(str) {
        return DG.esc ? DG.esc(str) : String(str);
    }

    function ddItem(item, current) {
        var active = item.href === current;
        return (
            '<a class="dg-dd-item' + (active ? " is-active" : "") + '"' +
            ' href="' + item.href + '" role="menuitem"' +
            (active ? ' aria-current="page"' : "") + ">" +
            '<i data-lucide="' + (item.icon || "circle-dot") + '"></i>' +
            "<span>" + esc(item.label) + "</span></a>"
        );
    }

    function ddMenu(items, current, extraClass) {
        return (
            '<div class="dg-dd-menu ' + (extraClass || "") + '" role="menu">' +
            '<div class="dg-dd-menu-inner">' +
            items.map(function (i) { return ddItem(i, current); }).join("") +
            "</div></div>"
        );
    }

    function ddToggle(link, current) {
        var active = groupActive(link, current);
        return (
            '<button type="button" class="dg-navlink dg-navdd-btn' + (active ? " is-active" : "") + '"' +
            ' data-dg-dd-toggle aria-expanded="false" aria-haspopup="true"' +
            (active ? ' aria-current="true"' : "") + ">" +
            "<span>" + esc(link.label) + "</span>" + CARET + "</button>"
        );
    }

    function desktopNav(current) {
        var items = LINKS.map(function (l) {
            if (isGroup(l)) {
                return (
                    '<div class="dg-navdd" data-dg-dd>' +
                    ddToggle(l, current) +
                    ddMenu(l.items, current) +
                    "</div>"
                );
            }
            var active = l.href === current;
            return (
                '<a class="dg-navlink' + (active ? " is-active" : "") + '" href="' + l.href + '"' +
                (active ? ' aria-current="page"' : "") + ">" + esc(l.label) + "</a>"
            );
        }).join("");

        return '<nav class="dg-navlinks" aria-label="Main">' + items + "</nav>";
    }

    function dirToggle() {
        return (
            '<button type="button" class="dg-iconbtn" data-dg-dir-toggle aria-pressed="false" ' +
            'aria-label="Switch to right-to-left" title="Switch to RTL">' +
            '<i data-lucide="arrow-right-left" class="dg-icon-ltr"></i>' +
            '<i data-lucide="arrow-left-right" class="dg-icon-rtl"></i>' +
            "</button>"
        );
    }

    function themeToggle() {
        return (
            '<button type="button" class="dg-iconbtn" data-dg-theme-toggle aria-label="Toggle dark mode">' +
            '<i data-lucide="sun" class="dg-icon-sun"></i><i data-lucide="moon" class="dg-icon-moon"></i>' +
            "</button>"
        );
    }

    function authSlot(current) {
        return '<a class="dg-btn dg-btn-primary dg-btn-sm" href="login.html"' +
            (current === "login.html" ? ' aria-current="page"' : "") +
            '><i data-lucide="log-in"></i><span>Login</span></a>';
    }

    function drawer(current) {
        var links = LINKS;

        var items = links
            .map(function (l) {
                if (isGroup(l)) {
                    return (
                        '<div class="dg-navdd" data-dg-dd>' +
                        '<button type="button" class="dg-drawer-link dg-navdd-btn' +
                        (groupActive(l, current) ? " is-active" : "") + '"' +
                        ' data-dg-dd-toggle aria-expanded="false" aria-haspopup="true">' +
                        '<i data-lucide="' + (l.icon || "circle-dot") + '"></i>' +
                        "<span>" + esc(l.label) + "</span>" + CARET + "</button>" +
                        ddMenu(l.items, current, "dg-dd-menu-inline") +
                        "</div>"
                    );
                }
                var active = l.href === current;
                return (
                    '<a class="dg-drawer-link' + (active ? " is-active" : "") + '" href="' + l.href + '">' +
                    '<i data-lucide="' + (l.icon || "circle-dot") + '"></i><span>' +
                    esc(l.label) + "</span></a>"
                );
            })
            .join("");

        var foot = '<a class="dg-btn dg-btn-primary dg-drawer-login" href="login.html">' +
            '<i data-lucide="log-in"></i>Login</a>';

        return (
            '<div class="dg-drawer" id="dg-drawer" aria-hidden="true">' +
            '<div class="dg-drawer-scrim" data-dg-drawer-close></div>' +
            '<div class="dg-drawer-panel" role="dialog" aria-modal="true" aria-label="Site menu">' +
            '<div class="dg-drawer-head">' +
            '<a class="dg-logo" href="index.html">' + LOGO + "</a>" +
            '<button type="button" class="dg-iconbtn" data-dg-drawer-close aria-label="Close menu">' +
            '<i data-lucide="x"></i></button>' +
            "</div>" +
            '<div class="dg-drawer-body">' +
            items +
            '<div class="dg-drawer-controls" aria-label="Display options">' + dirToggle() + themeToggle() + "</div>" +
            '<div class="dg-drawer-foot">' + foot + "</div>" +
            "</div></div>"
        );
    }

    DG.renderNavbar = function (mountSelector) {
        var host =
            typeof mountSelector === "string" ? document.querySelector(mountSelector) : mountSelector;
        if (!host) host = document.getElementById("dg-nav-root");
        if (!host) return;

        var current = DG.currentPage();

        host.innerHTML =
            '<header class="dg-nav">' +
            '<div class="dg-shell w-full flex items-center justify-between gap-3">' +
            '<a class="dg-logo" href="index.html" aria-label="DabbaGo home">' + LOGO + "</a>" +
            desktopNav(current) +
            '<div class="flex items-center gap-2 flex-none">' +
            dirToggle() +
            themeToggle() +
            authSlot(current) +
            '<button type="button" class="dg-burger" data-dg-burger aria-expanded="false" ' +
            'aria-controls="dg-drawer" aria-label="Open menu">' +
            '<i data-lucide="menu" class="dg-icon-menu"></i><i data-lucide="x" class="dg-icon-close"></i>' +
            "</button></div>" +
            "</div></header>" +
            drawer(current);

        if (DG.icons) DG.icons(host);
        if (DG.reveal) DG.reveal.scan(host);
        if (DG.dir && DG.dir.syncButtons) DG.dir.syncButtons();

        /* the markup was replaced, so no menu can still be open */
        closeDropdowns();
    };

    /* ------------------------------------------------------------------
       Dropdowns (Home -> Home 1 / Home 2, Dashboard -> Admin / User)
       One delegated handler drives every menu, desktop and drawer alike.
       ------------------------------------------------------------------ */

    function closeDropdowns() {
        var open = document.querySelectorAll('[data-dg-dd][data-open="true"]');
        for (var i = 0; i < open.length; i++) {
            open[i].removeAttribute("data-open");
            var t = open[i].querySelector("[data-dg-dd-toggle]");
            if (t) t.setAttribute("aria-expanded", "false");
        }
    }

    document.addEventListener("click", function (e) {
        var toggle = e.target.closest("[data-dg-dd-toggle]");

        if (toggle) {
            var wrap = toggle.closest("[data-dg-dd]");
            var isOpen = wrap && wrap.getAttribute("data-open") === "true";
            closeDropdowns();
            if (wrap && !isOpen) {
                wrap.setAttribute("data-open", "true");
                toggle.setAttribute("aria-expanded", "true");
            }
            e.preventDefault();
            return;
        }

        /* a click anywhere outside a menu closes it */
        if (!e.target.closest(".dg-dd-menu")) closeDropdowns();
    });

    document.addEventListener("keydown", function (e) {
        if (e.key !== "Escape") return;
        var open = document.querySelector('[data-dg-dd][data-open="true"] [data-dg-dd-toggle]');
        if (!open) return;
        closeDropdowns();
        open.focus();
    });

    /* Sign-out is available from the drawer on every page */
    document.addEventListener("click", function (e) {
        if (!e.target.closest("[data-dg-signout]")) return;
        var name = (DG.auth.user() || {}).name || "your account";
        DG.auth.signOut();
        DG.toast("You have been signed out. See you soon, " + name.split(" ")[0] + "!", {
            title: "Signed out",
            type: "success"
        });
        window.setTimeout(function () { window.location.href = "index.html"; }, 700);
    });

    /* Keep the navbar auth slot in sync if the user signs in without a reload */
    document.addEventListener("dg:authchange", function () {
        var root = document.getElementById("dg-nav-root");
        if (root) DG.renderNavbar(root);
    });
})();
