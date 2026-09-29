/* ==========================================================================
   DabbaGo — delivery.js
   Service areas, delivery zones, timings and the pincode availability
   checker. Availability is resolved against a local list of pincodes.
   ========================================================================== */

(function () {
    "use strict";

    var DG = (window.DG = window.DG || {});
    DG.data = DG.data || {};

    /* ------------------------------------------------------------------
       Delivery zones
       ------------------------------------------------------------------ */

    var ZONES = [
        {
            id: "z1",
            name: "Zone 1 \u2014 Core",
            areas: "Andheri West, Vile Parle, Bandra, Santacruz, Khar, Andheri East",
            pincodes: "400050, 400051, 400052, 400053, 400054, 400055, 400058",
            charge: 0,
            eta: "25\u201335 min",
            time: "11:30 AM \u2013 2:30 PM / 6:30 PM \u2013 9:30 PM",
            min: 199,
            color: "green"
        },
        {
            id: "z2",
            name: "Zone 2 \u2014 Extended",
            areas: "Powai, BKC, Chembur, Wadala, Dadar, Prabhadevi, Kurla",
            pincodes: "400076, 400083, 400071, 400014, 400019, 400012, 400070",
            charge: 20,
            eta: "35\u201345 min",
            time: "11:30 AM \u2013 2:30 PM / 6:30 PM \u2013 9:30 PM",
            min: 249,
            color: "orange"
        },
        {
            id: "z3",
            name: "Zone 3 \u2014 Outer Suburbs",
            areas: "Malad, Kandivali, Goregaon, Borivali, Thane, Navi Mumbai (Vashi, Nerul)",
            pincodes: "400064, 400067, 400062, 400066, 400610, 400703, 400705",
            charge: 40,
            eta: "50\u201365 min",
            time: "12:00 PM \u2013 3:00 PM / 7:00 PM \u2013 10:00 PM",
            min: 299,
            color: "brown"
        },
        {
            id: "z4",
            name: "Zone 4 \u2014 Pune Campus",
            areas: "Kothrud, Shivajinagar, Hinjewadi, Wakad, Kharadi, Viman Nagar, Baner, Aundh",
            pincodes: "411038, 411005, 411057, 411045, 411014, 411007, 411044",
            charge: 35,
            eta: "40\u201355 min",
            time: "12:00 PM \u2013 3:00 PM / 7:00 PM \u2013 10:00 PM",
            min: 249,
            color: "orange"
        },
        {
            id: "z5",
            name: "Zone 5 \u2014 Kolkata & Bengaluru",
            areas: "Salt Lake, Garia, Koramangala, HSR Layout, Whitefield, Jayanagar, Electronic City",
            pincodes: "700091, 700084, 700082, 560034, 560102, 560041, 560100",
            charge: 45,
            eta: "45\u201360 min",
            time: "12:00 PM \u2013 3:00 PM / 7:00 PM \u2013 10:00 PM",
            min: 299,
            color: "brown"
        }
    ];

    /* flat lookup: pincode -> zone */
    var PIN_LOOKUP = {};
    ZONES.forEach(function (z) {
        z.pincodes.split(",").forEach(function (p) {
            PIN_LOOKUP[p.trim()] = z;
        });
    });

    var ALL_AREAS = [];
    ZONES.forEach(function (z) {
        z.areas.split(",").forEach(function (a) {
            var name = a.trim();
            if (name) ALL_AREAS.push({ name: name, zone: z });
        });
    });

    DG.data.zones = ZONES;
    DG.data.areas = ALL_AREAS;
    DG.data.pinLookup = PIN_LOOKUP;

    DG.data.timings = {
        breakfast: { label: "Breakfast", window: "7:00 \u2013 8:00 AM", orderBy: "Previous day, 9:00 PM" },
        lunch: { label: "Lunch", window: "12:30 \u2013 1:30 PM", orderBy: "Same day, 10:00 AM" },
        dinner: { label: "Dinner", window: "7:30 \u2013 8:30 PM", orderBy: "Same day, 5:00 PM" }
    };

    DG.delivery.zones = ZONES;

    DG.delivery.check = function (pincode, areaName) {
        var pin = String(pincode || "").replace(/\D/g, "");
        var zone = PIN_LOOKUP[pin];

        if (pin.length !== 6) {
            return { ok: false, code: "bad-pin", pin: pin };
        }
        if (!zone) {
            return { ok: false, code: "not-covered", pin: pin, area: areaName || "" };
        }

        /* soft warning when the typed area does not belong to the pincode's zone */
        var match = null;
        if (areaName) {
            var needle = areaName.trim().toLowerCase();
            match =
                zone.areas.toLowerCase().indexOf(needle) > -1 ||
                ALL_AREAS.some(function (a) {
                    return a.name.toLowerCase() === needle && a.zone.id === zone.id;
                });
        }

        return { ok: true, zone: zone, area: areaName || "", areaMatch: match, pin: pin };
    };

    /* ==================================================================
       Delivery Area page
       ================================================================== */

    function zoneCard(z, i) {
        return (
            '<article class="dg-card dg-card-pad flex flex-col gap-3" data-dg-reveal data-dg-delay="' + (i % 3) + '">' +
            '<div class="flex items-start justify-between gap-2">' +
            '<div class="flex items-center gap-2.5 min-w-0">' +
            '<span class="dg-icon-tile ' + (z.color === "green" ? "dg-icon-tile-green" : z.color === "brown" ? "dg-icon-tile-brown" : "") + '">' +
            '<i data-lucide="map-pin"></i></span>' +
            '<h3 class="text-base leading-tight">' + DG.esc(z.name) + "</h3></div>" +
            '<span class="dg-badge ' + (z.charge === 0 ? "dg-badge-green" : "dg-badge-orange") + ' flex-none">' +
            (z.charge === 0 ? "Free delivery" : DG.fmt.money(z.charge) + " delivery") +
            "</span></div>" +
            '<p class="text-sm dg-lede dg-clamp-3">' + DG.esc(z.areas) + "</p>" +
            '<dl class="dg-meta-list">' +
            '<div><dt>Delivery time</dt><dd>' + DG.esc(z.eta) + "</dd></div>" +
            '<div><dt>Minimum order</dt><dd>' + DG.fmt.money(z.min) + "</dd></div>" +
            '<div><dt>Delivery window</dt><dd>' + DG.esc(z.time) + "</dd></div>" +
            "</dl>" +
            '<details class="dg-details">' +
            "<summary>Pincodes covered <i data-lucide=\"chevron-down\"></i></summary>" +
            '<p class="text-xs flex flex-wrap gap-1.5">' +
            z.pincodes.split(",").map(function (p) {
                return '<span class="dg-badge dg-badge-outline">' + p.trim() + "</span>";
            }).join("") +
            "</p></details>" +
            "</article>"
        );
    }

    function renderZones() {
        var host = document.getElementById("dg-zones-grid");
        if (!host) return;
        host.innerHTML = ZONES.map(zoneCard).join("");
        DG.icons(host);
        DG.reveal.scan(host);
    }

    function renderAreaList() {
        var host = document.getElementById("dg-area-list");
        if (!host) return;

        host.innerHTML = ZONES.map(function (z) {
            return (
                '<div class="dg-card dg-card-pad">' +
                '<div class="flex items-center justify-between gap-2 flex-wrap">' +
                '<h3 class="text-sm">' + DG.esc(z.name) + "</h3>" +
                '<span class="dg-badge ' + (z.charge === 0 ? "dg-badge-green" : "dg-badge-orange") + '">' +
                (z.charge === 0 ? "Free" : DG.fmt.money(z.charge)) + "</span></div>" +
                '<ul class="flex flex-wrap gap-1.5 mt-2.5">' +
                z.areas.split(",").map(function (a) {
                    return '<li class="dg-badge dg-badge-outline">' + DG.esc(a.trim()) + "</li>";
                }).join("") +
                "</ul></div>"
            );
        }).join("");
        DG.icons(host);
    }

    /* ---- availability checker ---- */

    function showResult(result) {
        var box = document.getElementById("dg-area-result");
        if (!box) return;

        if (result.ok) {
            var z = result.zone;
            var matchNote = result.areaMatch
                ? ""
                : result.area
                  ? '<p class="text-xs" style="color:var(--dg-ink-mute)">We could not match "' +
                    DG.esc(result.area) +
                    '" to this pincode, but this pincode is on our list.</p>'
                  : "";
            box.innerHTML =
                '<div class="dg-result dg-result-ok" role="status">' +
                '<span class="dg-icon-tile dg-icon-tile-green"><i data-lucide="circle-check"></i></span>' +
                "<div>" +
                '<p class="font-bold">Yes, we deliver to your area</p>' +
                '<p class="text-sm" style="color:var(--dg-ink-soft)">Pincode ' + DG.esc(result.pin) + " falls under " + DG.esc(z.name) + ". Meals arrive in " +
                DG.esc(z.eta) + ".</p>" +
                '<div class="dg-meta-list" style="margin-top:.7rem">' +
                '<div><dt>Delivery charge</dt><dd>' + (z.charge === 0 ? "Free" : DG.fmt.money(z.charge)) + "</dd></div>" +
                '<div><dt>Minimum order</dt><dd>' + DG.fmt.money(z.min) + "</dd></div>" +
                '<div><dt>Delivery window</dt><dd>' + DG.esc(z.time) + "</dd></div>" +
                "</div>" + matchNote +
                '<a class="dg-btn dg-btn-primary dg-btn-sm" href="plans.html" style="margin-top:.85rem">' +
                'See plans<i data-lucide="arrow-right"></i></a>' +
                "</div></div>";
        } else if (result.code === "bad-pin") {
            box.innerHTML =
                '<div class="dg-result dg-result-bad" role="alert">' +
                '<span class="dg-icon-tile" style="background:var(--dg-danger-soft);color:var(--dg-danger)">' +
                '<i data-lucide="triangle-alert"></i></span>' +
                "<div><p class=\"font-bold\">That pincode does not look right</p>" +
                '<p class="text-sm" style="color:var(--dg-ink-soft)">Please enter a valid 6-digit Indian pincode, for example 400053.</p></div></div>';
        } else {
            box.innerHTML =
                '<div class="dg-result dg-result-bad" role="alert">' +
                '<span class="dg-icon-tile" style="background:var(--dg-danger-soft);color:var(--dg-danger)">' +
                '<i data-lucide="map-pin"></i></span>' +
                "<div><p class=\"font-bold\">We are not in your area yet</p>" +
                '<p class="text-sm" style="color:var(--dg-ink-soft)">Pincode ' + DG.esc(result.pin) +
                (result.area ? " (" + DG.esc(result.area) + ")" : "") +
                ' is outside our current service zones. We add new areas every month \u2014 leave us a note and we will call you.</p>' +
                '<div class="flex gap-2 flex-wrap" style="margin-top:.85rem">' +
                '<a class="dg-btn dg-btn-primary dg-btn-sm" href="mailto:hello@dabbago.in?subject=Request%20delivery%20in%20my%20area">' +
                '<i data-lucide="mail"></i>Request my area</a>' +
                '<a class="dg-btn dg-btn-outline dg-btn-sm" href="tel:+919876543210"><i data-lucide="phone"></i>Call the kitchen</a>' +
                "</div></div></div>";
        }

        box.classList.remove("is-hidden");
        DG.icons(box);
        box.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function initChecker() {
        var form = document.getElementById("dg-area-form");
        if (!form) return;

        /* area datalist */
        var list = document.getElementById("dg-area-options");
        if (list) {
            list.innerHTML = ALL_AREAS.map(function (a) {
                return '<option value="' + DG.esc(a.name) + '"></option>';
            }).join("");
        }

        /* prefill from the signed-in user */
        var user = DG.auth.user();
        if (user && !form.dataset.touched) {
            var pinEl = form.querySelector('[name="pincode"]');
            var areaEl = form.querySelector('[name="area"]');
            if (pinEl && !pinEl.value && user.pincode) pinEl.value = user.pincode;
            if (areaEl && !areaEl.value && user.area) areaEl.value = user.area;
        }

        form.addEventListener("input", function (e) {
            if (e.target.name === "pincode") {
                var v = e.target.value.replace(/\D/g, "").slice(0, 6);
                if (v !== e.target.value) e.target.value = v;
            }
            form.dataset.touched = "1";
        });

        form.addEventListener("submit", function (e) {
            e.preventDefault();

            var pin = form.querySelector('[name="pincode"]');
            var area = form.querySelector('[name="area"]');
            var pinErr = document.getElementById("dg-pin-error");
            var areaErr = document.getElementById("dg-area-name-error");

            var valid = true;

            if (!pin.value || pin.value.length !== 6) {
                valid = false;
                pin.closest(".dg-field").classList.add("is-invalid");
                if (pinErr) pinErr.classList.add("is-shown");
            } else {
                pin.closest(".dg-field").classList.remove("is-invalid");
                if (pinErr) pinErr.classList.remove("is-shown");
            }

            if (!area.value.trim()) {
                valid = false;
                area.closest(".dg-field").classList.add("is-invalid");
                if (areaErr) areaErr.classList.add("is-shown");
            } else {
                area.closest(".dg-field").classList.remove("is-invalid");
                if (areaErr) areaErr.classList.remove("is-shown");
            }

            if (!valid) {
                DG.toast("Please enter a 6-digit pincode and your area name.", { type: "error" });
                return;
            }

            var result = DG.delivery.check(pin.value, area.value);
            showResult(result);

            DG.store.set(DG.KEYS.areaCheck, {
                pin: result.pin,
                area: area.value.trim(),
                served: result.ok,
                zone: result.ok ? result.zone.id : null,
                at: new Date().toISOString()
            });

            if (result.ok) {
                DG.toast("Good news \u2014 we deliver to " + area.value.trim() + ".", {
                    title: "Service available",
                    type: "success"
                });
                if (DG.auth.isLoggedIn()) {
                    DG.auth.update({ pincode: result.pin, area: area.value.trim() });
                }
            } else {
                DG.toast("We are not serving " + area.value.trim() + " yet.", {
                    title: "Outside service area",
                    type: "warning"
                });
            }
        });

        /* "Use my saved address" shortcut */
        var useSaved = document.getElementById("dg-use-saved");
        if (useSaved) {
            if (!DG.auth.isLoggedIn()) {
                useSaved.classList.add("is-hidden");
            } else {
                useSaved.addEventListener("click", function () {
                    var u = DG.auth.user();
                    if (!u || !u.pincode) {
                        DG.toast("Add a delivery address in your profile first.", { type: "info" });
                        return;
                    }
                    form.querySelector('[name="pincode"]').value = u.pincode;
                    form.querySelector('[name="area"]').value = u.area || "";
                    form.requestSubmit
                        ? form.requestSubmit()
                        : form.dispatchEvent(new Event("submit", { cancelable: true }));
                });
            }
        }
    }

    function init() {
        if (!document.getElementById("dg-zones-grid")) return;
        renderZones();
        renderAreaList();
        initChecker();
    }

    DG.pages = DG.pages || {};
    DG.pages.delivery = init;

    /* the area checker is also embedded on the home page */
    DG.delivery.mountChecker = function (formId, resultId) {
        var form = document.getElementById(formId);
        var box = document.getElementById(resultId);
        if (!form || !box) return;
        if (form.dataset.dgBound === "1") return;
        form.dataset.dgBound = "1";

        var list = document.getElementById(formId + "-options");
        if (list) {
            list.innerHTML = ALL_AREAS.map(function (a) {
                return '<option value="' + DG.esc(a.name) + '"></option>';
            }).join("");
        }

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            var pin = form.querySelector('[name="pincode"]');
            var area = form.querySelector('[name="area"]');
            var pinVal = pin.value.replace(/\D/g, "").slice(0, 6);
            pin.value = pinVal;

            if (pinVal.length !== 6 || !area.value.trim()) {
                DG.toast("Enter a 6-digit pincode and your area name.", { type: "error" });
                (pinVal.length !== 6 ? pin : area).focus();
                return;
            }

            var result = DG.delivery.check(pinVal, area.value);
            box.innerHTML = result.ok
                ? '<div class="dg-result dg-result-ok" role="status">' +
                  '<span class="dg-icon-tile dg-icon-tile-green"><i data-lucide="circle-check"></i></span>' +
                  "<div><p class=\"font-bold\">Yes, we deliver to " + DG.esc(area.value.trim()) + "</p>" +
                  '<p class="text-sm" style="color:var(--dg-ink-soft)">' + DG.esc(result.zone.name) +
                  " \u00b7 " + DG.esc(result.zone.eta) + " \u00b7 " +
                  (result.zone.charge === 0 ? "free delivery" : DG.fmt.money(result.zone.charge) + " delivery") +
                  "</p></div></div>"
                : '<div class="dg-result dg-result-bad" role="alert">' +
                  '<span class="dg-icon-tile" style="background:var(--dg-danger-soft);color:var(--dg-danger)">' +
                  '<i data-lucide="map-pin"></i></span>' +
                  "<div><p class=\"font-bold\">Not available in your area yet</p>" +
                  '<p class="text-sm" style="color:var(--dg-ink-soft)">Pincode ' + DG.esc(pinVal) +
                  " is outside our current zones. Call us and we will try to help.</p></div></div>";
            box.classList.remove("is-hidden");
            DG.icons(box);
            DG.toast(result.ok ? "We deliver to your area." : "Sorry, we do not cover that pincode yet.", {
                type: result.ok ? "success" : "warning"
            });
        });
    };
})();
