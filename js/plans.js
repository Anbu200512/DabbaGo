/* ==========================================================================
   DabbaGo — plans.js
   Subscription plan data + plan selection / subscribe flow.
   All payment steps are a front-end simulation stored in localStorage.
   ========================================================================== */

(function () {
    "use strict";

    var DG = (window.DG = window.DG || {});
    DG.data = DG.data || {};

    /* ------------------------------------------------------------------
       Plan catalogue
       ------------------------------------------------------------------ */

    var PLANS = [
        {
            id: "weekly",
            name: "Weekly Tiffin Plan",
            tagline: "Try us for a week",
            price: 899,
            wasPrice: 1050,
            perLabel: "week",
            mealsPerDay: 2,
            totalMeals: 14,
            frequency: "Lunch + Dinner, every day",
            duration: "7 days",
            popular: false,
            badge: "",
            icon: "calendar",
            tone: "brown",
            bestFor: "Hostel / PG trial",
            features: [
                "14 meals \u2014 lunch and dinner for 7 days",
                "Cancel or pause before the 4th day",
                "Free delivery in Zone 1",
                "Menus shared 2 days in advance"
            ]
        },
        {
            id: "monthly",
            name: "Monthly Tiffin Plan",
            tagline: "Our most popular plan",
            price: 3199,
            wasPrice: 3990,
            perLabel: "month",
            mealsPerDay: 2,
            totalMeals: 60,
            frequency: "Lunch + Dinner, every day",
            duration: "30 days",
            popular: true,
            badge: "Most popular",
            icon: "crown",
            tone: "orange",
            bestFor: "Everyone",
            features: [
                "60 meals a month, lunch and dinner daily",
                "Save 20% against à la carte",
                "Free delivery in all zones",
                "Pause or change meals any time"
            ]
        },
        {
            id: "lunch",
            name: "Lunch Only Plan",
            tagline: "Mid-day meals, done",
            price: 1899,
            wasPrice: 2400,
            perLabel: "month",
            mealsPerDay: 1,
            totalMeals: 30,
            frequency: "Lunch only, every day",
            duration: "30 days",
            popular: false,
            badge: "Best value",
            icon: "hand-platter",
            tone: "green",
            bestFor: "Office goers",
            features: [
                "30 lunches delivered between 12:30 \u2013 1:30 PM",
                "Lowest monthly commitment",
                "Free delivery in Zone 1 and 2",
                "Weekly menu preview every Sunday"
            ]
        },
        {
            id: "dinner",
            name: "Dinner Only Plan",
            tagline: "Homely supper, daily",
            price: 1799,
            wasPrice: 2200,
            perLabel: "month",
            mealsPerDay: 1,
            totalMeals: 30,
            frequency: "Dinner only, every day",
            duration: "30 days",
            popular: false,
            badge: "",
            icon: "soup",
            tone: "brown",
            bestFor: "Night-shift students",
            features: [
                "30 dinners delivered between 7:30 \u2013 8:30 PM",
                "Flexible pause for exam season",
                "Free delivery in Zone 1 and 2",
                "One free meal swap every week"
            ]
        },
        {
            id: "fullday",
            name: "Full-Day Plan",
            tagline: "All three meals, covered",
            price: 4499,
            wasPrice: 5600,
            perLabel: "month",
            mealsPerDay: 3,
            totalMeals: 90,
            frequency: "Breakfast + Lunch + Dinner, every day",
            duration: "30 days",
            popular: false,
            badge: "Best savings",
            icon: "hand-platter",
            tone: "orange",
            bestFor: "Hostel students living away from home",
            features: [
                "90 meals \u2014 breakfast, lunch and dinner daily",
                "Save roughly \u20b91,100 every month",
                "Free delivery in all zones",
                "Free weekly dessert or drink upgrade"
            ]
        },
        {
            id: "student",
            name: "Student Saver Plan",
            tagline: "Built for a tight budget",
            price: 1249,
            wasPrice: 1499,
            perLabel: "month",
            mealsPerDay: 1,
            totalMeals: 26,
            frequency: "Lunch on alternate days",
            duration: "30 days",
            popular: false,
            badge: "Student only",
            icon: "graduation-cap",
            tone: "green",
            bestFor: "College students",
            features: [
                "26 weekday lunches across the month",
                "Designed for hostel and PG budgets",
                "Free delivery in Zone 1",
                "Pause free of charge for exam weeks"
            ]
        }
    ];

    DG.data.plans = PLANS;
    DG.data.planById = function (id) {
        for (var i = 0; i < PLANS.length; i++) if (PLANS[i].id === id) return PLANS[i];
        return null;
    };

    var COMPARE = [
        { label: "Meals per day", key: "mealsPerDay", fmt: function (v) { return v + (v === 1 ? " meal" : " meals"); } },
        { label: "Meals included", key: "totalMeals", fmt: function (v) { return v + " meals"; } },
        { label: "Delivery frequency", key: "frequency" },
        { label: "Plan duration", key: "duration" },
        { label: "Best for", key: "bestFor" }
    ];

    /* ------------------------------------------------------------------
       Shared: activate a plan for the signed-in user
       ------------------------------------------------------------------ */

    function activatePlan(planId) {
        var plan = DG.data.planById(planId);
        if (!plan) return;

        var user = DG.auth.user() || {};
        var start = new Date();
        var end = DG.fmt.addDays(start, plan.id === "weekly" ? 7 : 30);

        DG.subscription.set({
            planId: plan.id,
            planName: plan.name,
            price: plan.price,
            wasPrice: plan.wasPrice,
            perLabel: plan.perLabel,
            mealsPerDay: plan.mealsPerDay,
            totalMeals: plan.totalMeals,
            duration: plan.duration,
            frequency: plan.frequency,
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            status: "Active",
            deliveryTime: user.mealPref || (plan.mealsPerDay === 1 ? "1:00 PM" : "12:45 PM")
        });

        DG.payments.add({
            plan: plan.name,
            amount: plan.price,
            status: "Paid",
            method: "UPI (demo)",
            ref: "DEMO-" + Date.now().toString().slice(-6)
        });

        DG.notify.add({
            type: "payment",
            icon: "circle-check",
            title: "Payment confirmed",
            msg: plan.name + " \u2014 " + DG.fmt.money(plan.price) + " recorded (demo)."
        });
        DG.notify.add({
            type: "delivery",
            icon: "truck",
            title: "First delivery scheduled",
            msg: "Your first tiffin arrives tomorrow at " + (user.mealPref || "12:45 PM") + "."
        });

        DG.store.remove(DG.KEYS.planSelection);
        return plan;
    }

    DG.plans = {
        PLANS: PLANS,
        activate: activatePlan
    };

    /* ==================================================================
       Plans page
       ================================================================== */

    function planCard(p, i) {
        return (
            '<article class="dg-card dg-card-pad flex flex-col gap-4 relative' +
            (p.popular ? " dg-plan-featured" : "") + '" id="' + p.id + '" data-dg-reveal data-dg-delay="' + (i % 3) + '">' +
            (p.badge ? '<span class="dg-badge dg-badge-solid absolute -top-2.5 left-4">' +
                '<i data-lucide="sparkles"></i>' + DG.esc(p.badge) + "</span>" : "") +
            '<div class="flex items-start gap-3">' +
            '<span class="dg-icon-tile ' + (p.tone === "green" ? "dg-icon-tile-green" : p.tone === "brown" ? "dg-icon-tile-brown" : "") + '">' +
            '<i data-lucide="' + p.icon + '"></i></span>' +
            '<div class="min-w-0 flex-1">' +
            '<h3 class="text-lg leading-tight">' + DG.esc(p.name) + "</h3>" +
            '<p class="text-sm" style="color:var(--dg-ink-soft)">' + DG.esc(p.tagline) + "</p>" +
            "</div></div>" +
            '<div class="flex items-end gap-2 flex-wrap">' +
            '<span class="dg-price text-3xl">' + DG.fmt.money(p.price) + "</span>" +
            '<span class="text-sm font-semibold" style="color:var(--dg-ink-mute)">per ' + DG.esc(p.perLabel) + "</span>" +
            (p.wasPrice ? '<span class="dg-price-strike" style="margin-inline-start:auto">' + DG.fmt.money(p.wasPrice) + "</span>" : "") +
            "</div>" +
            '<div class="dg-badge dg-badge-green self-start"><i data-lucide="percent"></i>Save ' +
            Math.round(((p.wasPrice - p.price) / p.wasPrice) * 100) + "%</div>" +
            '<ul class="flex flex-col gap-2 text-sm" style="color:var(--dg-ink-soft)">' +
            p.features.map(function (f) {
                return '<li class="flex items-start gap-2"><i data-lucide="check" class="dg-tick"></i><span>' + DG.esc(f) + "</span></li>";
            }).join("") +
            "</ul>" +
            '<dl class="dg-meta-list">' +
            '<div><dt>Meals / day</dt><dd>' + p.mealsPerDay + "</dd></div>" +
            '<div><dt>Frequency</dt><dd>' + DG.esc(p.frequency) + "</dd></div>" +
            '<div><dt>Duration</dt><dd>' + DG.esc(p.duration) + "</dd></div>" +
            "</dl>" +
            '<button type="button" class="dg-btn ' + (p.popular ? "dg-btn-primary" : "dg-btn-outline") +
            ' dg-btn-block mt-auto" data-subscribe="' + p.id + '">Subscribe now<i data-lucide="arrow-right"></i></button>' +
            '<p class="text-xs text-center" style="color:var(--dg-ink-mute)">Front-end demo \u2014 no payment is processed</p>' +
            "</article>"
        );
    }

    function renderPlans() {
        var host = document.getElementById("dg-plans-grid");
        if (!host) return;
        host.innerHTML = PLANS.map(planCard).join("");
        DG.icons(host);
        DG.reveal.scan(host);
    }

    function renderCompare() {
        var host = document.getElementById("dg-compare-body");
        if (!host) return;

        var head =
            '<tr><th scope="col">Plan</th>' +
            PLANS.map(function (p) {
                return '<th scope="col" class="text-center">' +
                    '<span class="block font-bold" style="color:var(--dg-ink)">' + DG.esc(p.name) + "</span>" +
                    '<span class="block dg-price text-base mt-1">' + DG.fmt.money(p.price) + "</span>" +
                    '<span class="block text-xs font-normal" style="color:var(--dg-ink-mute)">per ' + DG.esc(p.perLabel) + "</span>" +
                    "</th>";
            }).join("") +
            "</tr>";

        var body = COMPARE.map(function (row) {
            return (
                '<tr><th scope="row" style="font-weight:700;color:var(--dg-ink)">' + DG.esc(row.label) + "</th>" +
                PLANS.map(function (p) {
                    var v = p[row.key];
                    return '<td class="text-center">' + DG.esc(row.fmt ? row.fmt(v) : v) + "</td>";
                }).join("") +
                "</tr>"
            );
        }).join("");

        var priceRow =
            '<tr><th scope="row" style="font-weight:700;color:var(--dg-ink)">Price</th>' +
            PLANS.map(function (p) {
                return '<td class="text-center"><span class="dg-price text-base">' + DG.fmt.money(p.price) + "</span>" +
                    (p.wasPrice ? '<br><span class="dg-price-strike">' + DG.fmt.money(p.wasPrice) + "</span>" : "") +
                    "</td>";
            }).join("") +
            "</tr>";

        var ctaRow =
            '<tr><th scope="row" style="font-weight:700;color:var(--dg-ink)">&nbsp;</th>' +
            PLANS.map(function (p) {
                return '<td class="text-center"><button type="button" class="dg-btn ' +
                    (p.popular ? "dg-btn-primary" : "dg-btn-outline") + ' dg-btn-sm" data-subscribe="' + p.id + '">Select</button></td>';
            }).join("") +
            "</tr>";

        host.innerHTML = '<caption class="sr-only">Comparison of all DabbaGo subscription plans</caption>' +
            "<thead>" + head + "</thead><tbody>" + priceRow + body + ctaRow + "</tbody>";
        DG.icons(host);
    }

    function renderCurrent() {
        var host = document.getElementById("dg-current-plan");
        if (!host) return;

        var sub = DG.subscription.get();
        if (!sub) {
            host.innerHTML =
                '<div class="dg-card dg-card-pad flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">' +
                '<div class="flex items-start gap-3 min-w-0">' +
                '<span class="dg-icon-tile dg-icon-tile-soft"><i data-lucide="shopping-bag"></i></span>' +
                '<div class="min-w-0"><h3 class="text-base">You are not subscribed yet</h3>' +
                '<p class="text-sm" style="color:var(--dg-ink-soft)">Pick a plan below and it will show up in your dashboard.</p></div></div>' +
                '<a class="dg-btn dg-btn-outline" href="signup.html">Create an account<i data-lucide="arrow-right"></i></a>' +
                "</div>";
            DG.icons(host);
            return;
        }

        var daysLeft = Math.max(
            0,
            Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / 86400000)
        );

        host.innerHTML =
            '<div class="dg-card dg-card-pad flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">' +
            '<div class="flex items-start gap-3 min-w-0">' +
            '<span class="dg-icon-tile"><i data-lucide="crown"></i></span>' +
            '<div class="min-w-0">' +
            '<div class="flex items-center gap-2 flex-wrap">' +
            '<h3 class="text-base">' + DG.esc(sub.planName) + "</h3>" +
            '<span class="dg-badge ' + (sub.status === "Active" ? "dg-badge-green" : "dg-badge-orange") + '">' +
            DG.esc(sub.status) + "</span></div>" +
            '<p class="text-sm" style="color:var(--dg-ink-soft)">' +
            DG.fmt.money(sub.price) + " / " + DG.esc(sub.perLabel) + " \u00b7 " +
            sub.totalMeals + " meals \u00b7 " + daysLeft + " days left</p></div></div>" +
            '<a class="dg-btn dg-btn-primary" href="dashboard.html">Open dashboard<i data-lucide="arrow-right"></i></a>' +
            "</div>";
        DG.icons(host);
    }

    function handleSubscribe(id) {
        var plan = DG.data.planById(id);
        if (!plan) return;

        DG.store.set(DG.KEYS.planSelection, { planId: id, at: new Date().toISOString() });

        if (!DG.auth.isLoggedIn()) {
            DG.toast(
                "Great choice \u2014 " + plan.name + " at " + DG.fmt.money(plan.price) + ". Please sign in to continue.",
                { title: "Sign in to subscribe", type: "info" }
            );
            window.setTimeout(function () {
                window.location.href =
                    "login.html?plan=" + encodeURIComponent(id) + "&next=" + encodeURIComponent("plans.html");
            }, 800);
            return;
        }

        /* signed in — simulate checkout confirmation */
        var confirmBox = document.getElementById("dg-plan-confirm");
        if (confirmBox) {
            confirmBox.classList.remove("is-hidden");
            var nameEl = document.getElementById("dg-plan-confirm-name");
            var priceEl = document.getElementById("dg-plan-confirm-price");
            if (nameEl) nameEl.textContent = plan.name;
            if (priceEl) priceEl.textContent = DG.fmt.money(plan.price) + " / " + plan.perLabel;
            confirmBox.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        DG.toast(plan.name + " selected. Confirm below to activate (demo).", {
            title: "Plan selected",
            type: "success"
        });
    }

    function init() {
        if (!document.getElementById("dg-plans-grid")) return;

        renderPlans();
        renderCompare();
        renderCurrent();

        document.addEventListener("click", function (e) {
            var btn = e.target.closest("[data-subscribe]");
            if (btn) {
                handleSubscribe(btn.dataset.subscribe);
                return;
            }
            if (e.target.closest("[data-confirm-plan]")) {
                var sel = DG.store.get(DG.KEYS.planSelection, null);
                if (!sel || !sel.planId) {
                    DG.toast("Please choose a plan first.", { type: "warning" });
                    return;
                }
                var plan = activatePlan(sel.planId);
                DG.toast(
                    plan.name + " is now active. Open your dashboard to see the delivery schedule.",
                    { title: "Subscription activated (demo)", type: "success" }
                );
                var box = document.getElementById("dg-plan-confirm");
                if (box) box.classList.add("is-hidden");
                renderCurrent();
                window.setTimeout(function () {
                    window.location.href = "dashboard.html";
                }, 1400);
            }
        });

        /* deep link: plans.html#monthly */
        if (window.location.hash) {
            var target = document.querySelector(window.location.hash);
            if (target) {
                window.setTimeout(function () {
                    target.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 350);
            }
        }
    }

    DG.pages = DG.pages || {};
    DG.pages.plans = init;
})();
