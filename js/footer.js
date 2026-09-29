/* ==========================================================================
   DabbaGo — footer.js
   Builds the site footer: brand, quick links, menu links, contact,
   delivery areas, social icons and copyright.
   ========================================================================== */

(function () {
    "use strict";

    var DG = (window.DG = window.DG || {});

    var QUICK = [
        { href: "index.html", label: "Home" },
        { href: "plans.html", label: "Subscription Plans" },
        { href: "delivery-area.html", label: "Delivery Areas" },
        { href: "menu.html", label: "Weekly Menu" },
        { href: "about.html", label: "About Us" },
        { href: "contact.html", label: "Contact" },
        { href: "dashboard.html", label: "My Dashboard" }
    ];

    var ACCOUNT = [
        { href: "login.html", label: "Subscriber Login" },
        { href: "signup.html", label: "Create Account" },
        { href: "dashboard.html#dg-pay", label: "Payment History" },
        { href: "dashboard.html#dg-profile", label: "My Profile" }
    ];

    /* Lucide ships no brand marks, so each channel carries the real
       Simple Icons path inline, tinted with its brand colour. */
    var SOCIAL = [
        {
            href: "https://www.instagram.com/",
            label: "Instagram",
            color: "#E4405F",
            path: "M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"
        },
        {
            href: "https://www.facebook.com/",
            label: "Facebook",
            color: "#1877F2",
            path: "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"
        },
        {
            href: "https://www.linkedin.com/",
            label: "LinkedIn",
            color: "#0A66C2",
            path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
        },
        {
            href: "https://wa.me/919876543210",
            label: "WhatsApp",
            color: "#25D366",
            path: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
        }
    ];

    function brandIcon(s) {
        return (
            '<span class="dg-social-btn" style="--dg-social:' + s.color + '">' +
            '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" focusable="false" aria-hidden="true">' +
            '<path d="' + s.path + '"></path></svg>' +
            "</span>"
        );
    }

    var LOGO =
        '<span class="dg-logo-mark"><i data-lucide="cooking-pot"></i></span>' +
        "<span>Dabba<em>Go</em></span>";

    function linkList(items) {
        return (
            '<div class="dg-footer-links">' +
            items
                .map(function (i) {
                    return '<a href="' + i.href + '">' + DG.esc(i.label) + "</a>";
                })
                .join("") +
            "</div>"
        );
    }

    DG.renderFooter = function (mountSelector) {
        var host =
            typeof mountSelector === "string" ? document.querySelector(mountSelector) : mountSelector;
        if (!host) host = document.getElementById("dg-footer-root");
        if (!host) return;

        var year = new Date().getFullYear();

        host.innerHTML = [
            '<footer class="dg-footer">',
            '<div class="dg-shell">',

            /* top row */
            '<div class="dg-footer-top flex flex-col gap-8 md:flex-row md:justify-between">',

            /* brand column */
            '<div class="dg-footer-brand" style="max-width:22rem">',
            '<a class="dg-logo" href="index.html">' + LOGO + "</a>",
            '<p class="dg-lede text-sm" style="margin-top:.85rem">',
            "DabbaGo cooks fresh, homely tiffin meals in small batches every night and delivers them to ",
            "hostels, PG rooms and apartments on a schedule you choose. No maida, no MSG, no surprises on your bill.",
            "</p>",
             '<div class="dg-social" style="margin-top:1.1rem">',
             SOCIAL.map(function (s) {
                 return (
                     '<a href="' + s.href + '" title="' + DG.esc(s.label) + '" ' +
                     'aria-label="DabbaGo on ' + DG.esc(s.label) + '" rel="noopener noreferrer" target="_blank">' +
                     brandIcon(s) +
                     '<span class="dg-visually-hidden">' + DG.esc(s.label) + "</span>" +
                     "</a>"
                 );
             }).join(""),
             "</div>",
             '<p class="text-xs mt-3" style="color:var(--dg-ink-mute)">',
             '<i data-lucide="message-circle" style="display:inline;width:.85rem;height:.85rem;vertical-align:-1px"></i> ',
             "Order on WhatsApp, or follow us for the weekly menu.",
             "</p>",
            "</div>",

            /* link columns */
            '<div class="dg-footer-nav-grid grid grid-cols-2 gap-6 gap-x-8 gap-y-6" style="flex:1">',

            '<div><h4>Quick Links</h4>' + linkList(QUICK) + "</div>",

            '<div><h4>My Account</h4>' + linkList(ACCOUNT) + "</div>",

            "</div>",

            /* contact */
            '<div class="dg-card dg-card-pad dg-footer-contact" style="min-width:0">',
            '<h4 class="!mb-3">Get in Touch</h4>',
            '<div class="flex flex-col gap-2.5 text-sm">',
            '<a class="flex items-start gap-2" href="tel:+919876543210" style="color:var(--dg-ink-soft)">',
            '<i data-lucide="phone" class="dg-ico-sm"></i><span>+91 98765 43210</span></a>',
            '<a class="flex items-start gap-2" href="mailto:hello@dabbago.in" style="color:var(--dg-ink-soft)">',
            '<i data-lucide="mail" class="dg-ico-sm"></i><span>hello@dabbago.in</span></a>',
            '<p class="flex items-start gap-2" style="color:var(--dg-ink-soft)">',
            '<i data-lucide="clock" class="dg-ico-sm"></i>',
            '<span>Kitchen open 6:00 AM &ndash; 11:00 PM<br>Support 8:00 AM &ndash; 9:00 PM</span></p>',
            '<p class="flex items-start gap-2" style="color:var(--dg-ink-soft)">',
            '<i data-lucide="map-pin" class="dg-ico-sm"></i>',
            '<span>DabbaGo Kitchen, Sneh Nagar<br>Mumbai &ndash; 400 004</span></p>',
            "</div></div>",

            "</div>",

            /* bottom bar */
            '<div class="dg-footer-bottom">',
            "<span>&copy; " + year + " DabbaGo Foods Pvt. Ltd. All rights reserved.</span>",
            '<span class="flex items-center gap-1.5 flex-wrap justify-center">',
            '<span>Made with care in Mumbai</span>',
            '<span aria-hidden="true">&middot;</span>',
            '<a href="#" data-dg-totop style="color:var(--dg-ink-soft)">Back to top</a>',
            "</span>",
            "</div>",

            "</div>",
            "</footer>"
        ].join("");

        if (DG.icons) DG.icons(host);
        if (DG.reveal) DG.reveal.scan(host);
    };
})();
