(function () {
    "use strict";

    var layout = document.querySelector(".dp-admin-layout");
    var toggle = document.querySelector("[data-dashboard-sidebar-toggle]");
    if (!layout || !toggle) return;

    var closeButtons = layout.querySelectorAll("[data-dashboard-sidebar-close]");
    var mobile = window.matchMedia("(max-width: 760px), (min-width: 761px) and (max-width: 1319px) and (orientation: portrait), (min-width: 1000px) and (max-width: 1319px) and (orientation: landscape)");

    function setOpen(open) {
        layout.classList.toggle("is-sidebar-open", open && mobile.matches);
        toggle.setAttribute("aria-expanded", String(open && mobile.matches));
        toggle.setAttribute("aria-label", open ? "Close dashboard menu" : "Open dashboard menu");
        document.body.classList.toggle("dg-no-scroll", open && mobile.matches);
    }

    toggle.addEventListener("click", function () {
        setOpen(!layout.classList.contains("is-sidebar-open"));
    });

    Array.prototype.forEach.call(closeButtons, function (button) {
        button.addEventListener("click", function () { setOpen(false); });
    });

    layout.addEventListener("click", function (event) {
        if (event.target.closest(".ad-nav-item, .dg-dash-tab")) setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") setOpen(false);
    });

    function handleBreakpoint(event) {
        if (!event.matches) setOpen(false);
    }
    if (mobile.addEventListener) mobile.addEventListener("change", handleBreakpoint);
    else if (mobile.addListener) mobile.addListener(handleBreakpoint);
})();
