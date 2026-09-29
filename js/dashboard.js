/* ==========================================================================
   DabbaGo — dashboard.js
   Subscriber dashboard: overview, meal plan, delivery schedule (pause /
   resume / reschedule), payment history with printable receipts, profile
   and notifications. Everything is stored in localStorage.
   ========================================================================== */

(function () {
    "use strict";

    var DG = (window.DG = window.DG || {});
    var SEEDED_KEY = "dabbago_seeded_demo";

    var els = {};
    var activeTab = "overview";

    /* ------------------------------------------------------------------
       Helpers
       ------------------------------------------------------------------ */

    function statTile(o) {
        return (
            '<div class="dg-stat">' +
            '<div class="flex items-center gap-2">' +
            '<span class="dg-icon-tile ' + (o.tone === "green" ? "dg-icon-tile-green" : o.tone === "brown" ? "dg-icon-tile-brown" : o.tone === "muted" ? "dg-icon-tile-soft" : "") +
            '" style="width:2.1rem;height:2.1rem;border-radius:.6rem"><i data-lucide="' + o.icon + '"></i></span>' +
            '<p class="text-xs font-bold uppercase dg-stat-key">' + DG.esc(o.label) + "</p></div>" +
            '<p class="dg-stat-value dg-clamp-2">' + DG.esc(o.value) + "</p>" +
            (o.sub ? '<p class="dg-stat-sub dg-clamp-2">' + DG.esc(o.sub) + "</p>" : "") +
            "</div>"
        );
    }

    function daysLeftOf(sub) {
        if (!sub || !sub.endDate) return 0;
        return Math.max(0, Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / 86400000));
    }

    function nextDelivery() {
        var rows = DG.delivery.schedule().slice().sort(function (a, b) {
            return new Date(a.date) - new Date(b.date);
        });
        for (var i = 0; i < rows.length; i++) {
            if (new Date(rows[i].date).getTime() >= Date.now() - 3600000) return rows[i];
        }
        return rows[0] || null;
    }

    function mealPrefList() {
        var pref = (DG.auth.user() || {}).mealPref || "Lunch";
        if (pref === "Full Day" || pref === "Both") return ["Breakfast", "Lunch", "Dinner"];
        return [pref];
    }

    function todaysMeals() {
        if (!DG.data.meals) return [];
        var key = DG.data.todayKey();
        var prefs = mealPrefList();
        return DG.data.meals.filter(function (m) {
            return m.day === key && prefs.indexOf(m.meal) > -1;
        });
    }

    /* ------------------------------------------------------------------
       Demo data seeding (only for authenticated demo accounts)
       ------------------------------------------------------------------ */

    function seedDemo() {
        var plan = DG.data.plans ? DG.data.plans[0] : null; /* Weekly Tiffin Plan */
        var user = DG.auth.user() || {};

        if (plan) {
            var start = new Date();
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
                endDate: DG.fmt.addDays(start, 7).toISOString(),
                status: "Active",
                deliveryTime: "12:45 PM"
            });
        }

        /* four weeks of realistic past payments */
        var base = [
            { days: 4, plan: "Weekly Tiffin Plan", amount: 899, method: "UPI (demo)" },
            { days: 11, plan: "Weekly Tiffin Plan", amount: 899, method: "UPI (demo)" },
            { days: 18, plan: "Monthly Tiffin Plan", amount: 3199, method: "Card (demo)" },
            { days: 25, plan: "Monthly Tiffin Plan", amount: 3199, method: "Card (demo)" }
        ];
        DG.store.remove(DG.KEYS.payments);
        base.forEach(function (b) {
            DG.payments.add({
                plan: b.plan,
                amount: b.amount,
                method: b.method,
                status: "Paid",
                date: DG.fmt.addDays(new Date(), -b.days).toISOString(),
                ref: "DEMO" + Math.floor(Math.random() * 90000 + 10000)
            });
        });

        /* upcoming delivery schedule */
        var rows = [];
        for (var i = 0; i < 7; i++) {
            var d = DG.fmt.addDays(new Date(), i + 1);
            var lunch = d.getHours() < 12;
            rows.push({
                date: d.toISOString(),
                meal: lunch ? "Lunch" : "Dinner",
                time: lunch ? "12:45 PM" : "8:00 PM",
                status: i === 0 ? "Out for delivery" : "Scheduled",
                note: ""
            });
        }
        DG.delivery.setSchedule(rows);

        DG.store.remove(DG.KEYS.notifications);
        DG.notify.add({
            type: "delivery",
            icon: "truck",
            title: "Delivery out for delivery",
            msg: "Your " + (mealPrefList()[0] || "lunch") + " tiffin has left the kitchen and is on the way."
        });
        DG.notify.add({
            type: "expiry",
            icon: "timer",
            title: "Subscription ending soon",
            msg: "Your Weekly Tiffin Plan ends in 3 days. Renew to avoid a gap."
        });
        DG.notify.add({
            type: "payment",
            icon: "circle-check",
            title: "Payment confirmed",
            msg: "₹899 received for Weekly Tiffin Plan (demo)."
        });
        DG.notify.add({
            type: "info",
            icon: "info",
            title: "Weekly menu is live",
            msg: "Next week's menu has been published. Swap any dish before 9:00 PM."
        });

        DG.store.set(SEEDED_KEY, new Date().toISOString());
    }

    function ensureData() {
        if (!DG.auth.isLoggedIn()) return false;
        if (!DG.subscription.get() && !DG.store.get(SEEDED_KEY, null)) {
            seedDemo();
            return true;
        }
        if (!DG.delivery.schedule().length && DG.subscription.get()) {
            var rows = [];
            for (var i = 0; i < 7; i++) {
                var d = DG.fmt.addDays(new Date(), i + 1);
                rows.push({
                    date: d.toISOString(),
                    meal: i % 2 === 0 ? "Lunch" : "Dinner",
                    time: i % 2 === 0 ? "12:45 PM" : "8:00 PM",
                    status: "Scheduled",
                    note: ""
                });
            }
            DG.delivery.setSchedule(rows);
        }
        return false;
    }

    /* ==================================================================
       RENDER — gate
       ================================================================== */

    function renderGate() {
        var wrap = document.getElementById("dg-dash-body");
        if (!wrap) return;

        var pending = DG.store.get(DG.KEYS.planSelection, null);
        var plan = pending && DG.data.planById ? DG.data.planById(pending.planId) : null;

        wrap.innerHTML =
            '<div class="dg-card dg-card-pad" style="max-width:34rem;margin-inline:auto;text-align:center">' +
            '<span class="dg-icon-tile" style="width:3.4rem;height:3.4rem;margin-inline:auto">' +
            '<i data-lucide="user-round"></i></span>' +
            '<h1 class="text-2xl" style="margin-top:1rem">Your DabbaGo dashboard</h1>' +
            '<p class="dg-lede" style="margin-top:.5rem">Sign in to see your subscription, weekly meal plan, ' +
            "delivery schedule and payment history in one place.</p>" +
            (plan
                ? '<div class="dg-badge dg-badge-solid" style="margin-top:1rem"><i data-lucide="sparkles"></i>' +
                  DG.esc(plan.name) + " is waiting for you</div>"
                : "") +
            '<div class="flex flex-col sm:flex-row gap-2.5" style="margin-top:1.5rem">' +
            '<a class="dg-btn dg-btn-primary dg-btn-lg dg-btn-block" href="login.html' +
            (pending ? "?plan=" + encodeURIComponent(pending.planId) + "&next=dashboard.html" : "?next=dashboard.html") +
            '">Sign in<i data-lucide="log-in"></i></a>' +
            '<a class="dg-btn dg-btn-outline dg-btn-lg dg-btn-block" href="signup.html">Create account<i data-lucide="user-round"></i></a>' +
            "</div>" +
            '<div class="dg-demo" style="margin-top:1.5rem;text-align:start"><i data-lucide="info"></i>' +
            "<span><strong>Demo website.</strong> Accounts live only in this browser's localStorage. " +
            "No real login, no real payment.</span></div>" +
            "</div>";

        DG.icons(wrap);
    }

    /* ==================================================================
       RENDER — overview
       ================================================================== */

    function renderOverview() {
        var host = document.getElementById("dg-p-overview");
        if (!host) return;

        var sub = DG.subscription.get();
        var nd = nextDelivery();
        var days = daysLeftOf(sub);
        var today = todaysMeals();
        var pause = DG.delivery.pauseActive();

        if (!sub) {
            host.innerHTML =
                '<div class="dg-empty">' +
                '<span class="dg-icon-tile" style="margin-inline:auto"><i data-lucide="shopping-bag"></i></span>' +
                "<h3>No active subscription</h3>" +
                '<p>Pick a meal plan and your dashboard will fill up with schedules, menus and invoices.</p>' +
                '<a class="dg-btn dg-btn-primary" href="plans.html">Browse plans<i data-lucide="arrow-right"></i></a>' +
                '<button type="button" class="dg-btn dg-btn-ghost dg-btn-sm" data-dg-seed>' +
                '<i data-lucide="loader"></i>Load sample subscription</button>' +
                "</div>";
            DG.icons(host);
            return;
        }

        var statusLabel = pause ? "Paused" : sub.status === "Active" ? "On track" : sub.status;
        var statusTone = pause ? "warning" : sub.status === "Active" ? "success" : "warning";

        var todayHtml = today.length
            ? today
                  .map(function (m) {
                      return (
                          '<li class="flex items-center gap-3">' +
                          '<img src="' + m.image + '" alt="" width="48" height="48" loading="lazy" ' +
                          'style="width:3rem;height:3rem;border-radius:.7rem;object-fit:cover;flex:none">' +
                          '<div class="min-w-0 flex-1">' +
                          '<p class="text-sm font-bold dg-clamp-1">' + DG.esc(m.name) + "</p>" +
                          '<p class="text-xs" style="color:var(--dg-ink-mute)">' + m.meal + " \u00b7 " + m.kcal + " kcal</p>" +
                          "</div>" + (m.veg ? '<span class="dg-veg">Veg</span>' : '<span class="dg-nonveg">Non-veg</span>') +
                          "</li>"
                      );
                  })
                  .join("")
            : '<li class="text-sm" style="color:var(--dg-ink-soft)">No dish scheduled for your preferred meal today.</li>';

        host.innerHTML =
            /* stats */
            '<div class="dg-stat-grid">' +
            statTile({
                icon: "crown",
                label: "Active subscription",
                value: sub.planName,
                sub: DG.fmt.money(sub.price) + " / " + sub.perLabel + " \u00b7 " + sub.totalMeals + " meals",
                tone: "orange"
            }) +
            statTile({
                icon: "truck",
                label: "Next delivery",
                value: nd ? DG.fmt.dayName(nd.date) + ", " + DG.fmt.dateShort(nd.date) : "Not scheduled",
                sub: nd ? nd.meal + " at " + nd.time : "Choose a plan to get started",
                tone: "green"
            }) +
            statTile({
                icon: "timer",
                label: "Subscription expiry",
                value: DG.fmt.date(sub.endDate),
                sub: days + (days === 1 ? " day left" : " days left"),
                tone: days <= 3 ? "brown" : "muted"
            }) +
            statTile({
                icon: "package",
                label: "Delivery status",
                value: statusLabel,
                sub: pause ? "Paused until " + DG.fmt.date(pause.until) : "Delivering on schedule",
                tone: statusTone === "success" ? "green" : statusTone === "warning" ? "brown" : "muted"
            }) +
            "</div>" +

            /* today + status column */
            '<div class="grid gap-4 lg:grid-cols-5" style="margin-top:1rem">' +
            '<div class="dg-card dg-card-pad lg:col-span-3">' +
            '<div class="flex items-center justify-between gap-2 flex-wrap">' +
            "<h2 class=\"text-lg\">Today's meal</h2>" +
            '<span class="dg-badge dg-badge-orange"><i data-lucide="calendar"></i>' +
            DG.fmt.dayName(new Date()) + ", " + DG.fmt.date(new Date()) + "</span></div>" +
            '<ul class="flex flex-col divide-y mt-2" style="--tw-divide-opacity:1">' +
            todayHtml.replace(/class="flex items-center gap-3"/g,
                'class="flex items-center gap-3 py-2.5" style="border-bottom:1px solid var(--dg-line)"') +
            "</ul>" +
            '<a class="dg-btn dg-btn-outline dg-btn-sm" href="menu.html" style="margin-top:1rem">' +
            'See the full menu<i data-lucide="arrow-right"></i></a>' +
            "</div>" +

            '<div class="dg-card dg-card-pad lg:col-span-2 flex flex-col gap-3">' +
            "<h2 class=\"text-lg\">Quick actions</h2>" +
            '<button type="button" class="dg-btn dg-btn-block ' + (pause ? "dg-btn-green" : "dg-btn-outline") +
            '" data-dg-toggle-pause>' +
            '<i data-lucide="' + (pause ? "play" : "pause") + '"></i>' +
            (pause ? "Resume delivery" : "Pause delivery") + "</button>" +
            '<button type="button" class="dg-btn dg-btn-outline dg-btn-block" data-dg-tab-jump="schedule">' +
            '<i data-lucide="calendar-clock"></i>Change delivery time</button>' +
            '<button type="button" class="dg-btn dg-btn-outline dg-btn-block" data-dg-tab-jump="plan">' +
            '<i data-lucide="utensils-crossed"></i>Change meal preference</button>' +
            '<a class="dg-btn dg-btn-outline dg-btn-block" href="plans.html">' +
            '<i data-lucide="wallet"></i>Upgrade plan</a>' +
            '<div class="dg-meta-list" style="margin-top:auto">' +
            '<div><dt>Plan</dt><dd>' + DG.esc(sub.planName) + "</dd></div>" +
            '<div><dt>Meals / day</dt><dd>' + sub.mealsPerDay + "</dd></div>" +
            '<div><dt>Frequency</dt><dd>' + DG.esc(sub.frequency) + "</dd></div>" +
            "</div></div></div>";

        DG.icons(host);
    }

    /* ==================================================================
       RENDER — meal plan
       ================================================================== */

    function renderMealPlan() {
        var host = document.getElementById("dg-p-plan");
        if (!host) return;

        var sub = DG.subscription.get();
        var prefs = mealPrefList();
        var schedule = DG.delivery.schedule();

        var dayCards = (DG.data.days || []).map(function (d) {
            var isToday = d.key === (DG.data.todayKey ? DG.data.todayKey() : "");
            var meals = (DG.data.mealTypes || []).map(function (mt) {
                var dish = DG.data.meals.filter(function (m) {
                    return m.day === d.key && m.meal === mt.id;
                })[0];
                if (!dish) return "";
                var on = prefs.indexOf(mt.id) > -1;
                return (
                    '<li class="flex items-center gap-2.5 py-2" style="opacity:' + (on ? 1 : 0.55) + '">' +
                    '<img src="' + dish.image + '" alt="" width="44" height="44" loading="lazy" ' +
                    'style="width:2.6rem;height:2.6rem;border-radius:.6rem;object-fit:cover;flex:none">' +
                    '<div class="min-w-0 flex-1">' +
                    '<p class="text-xs font-bold uppercase" style="color:var(--dg-ink-mute);letter-spacing:.07em">' +
                    mt.label + "</p>" +
                    '<p class="text-sm font-semibold dg-clamp-1">' + DG.esc(dish.name) + "</p></div>" +
                    '<span class="dg-badge ' + (on ? "dg-badge-green" : "dg-badge-outline") + '">' +
                    (on ? "In plan" : "Not included") + "</span></li>"
                );
            }).join("");

            return (
                '<article class="dg-card dg-card-pad"' +
                (isToday ? ' style="border-color:var(--dg-brand)"' : "") + ">" +
                '<div class="flex items-center justify-between gap-2 flex-wrap">' +
                "<h3 class=\"text-sm\">" + DG.esc(d.label) + "</h3>" +
                (isToday ? '<span class="dg-badge dg-badge-solid">Today</span>' : "") +
                "</div>" +
                '<ul class="flex flex-col mt-1" style="--tw-divide-opacity:1">' + meals + "</ul></article>"
            );
        }).join("");

        var upcoming = schedule
            .slice()
            .sort(function (a, b) { return new Date(a.date) - new Date(b.date); })
            .slice(0, 5)
            .map(function (r) {
                return (
                    '<li class="flex items-center gap-3 py-2.5" style="border-bottom:1px solid var(--dg-line)">' +
                    '<span class="dg-icon-tile dg-icon-tile-soft" style="width:2.1rem;height:2.1rem;border-radius:.6rem">' +
                    '<i data-lucide="truck"></i></span>' +
                    '<div class="min-w-0 flex-1">' +
                    '<p class="text-sm font-bold dg-clamp-1">' + DG.esc(r.meal) + " \u00b7 " + DG.fmt.dateShort(r.date) + "</p>" +
                    '<p class="text-xs" style="color:var(--dg-ink-mute)">' + DG.esc(r.time) + "</p></div>" +
                    '<span class="dg-badge dg-badge-outline dg-clamp-1">' + DG.esc(r.status) + "</span></li>"
                );
            })
            .join("");

        host.innerHTML =
            (sub
                ? '<div class="dg-card dg-card-pad" style="margin-bottom:1rem">' +
                  '<div class="flex items-start justify-between gap-3 flex-wrap">' +
                  '<div class="min-w-0"><p class="dg-eyebrow">Current weekly plan</p>' +
                  '<h2 class="text-xl" style="margin-top:.35rem">' + DG.esc(sub.planName) + "</h2>" +
                  '<p class="text-sm" style="color:var(--dg-ink-soft)">' +
                  DG.fmt.money(sub.price) + " / " + DG.esc(sub.perLabel) + " \u00b7 " +
                  DG.esc(sub.frequency) + " \u00b7 ends " + DG.fmt.date(sub.endDate) + "</p></div>" +
                  '<span class="dg-badge ' + (sub.status === "Active" ? "dg-badge-green" : "dg-badge-orange") + '">' +
                  '<i data-lucide="badge-check"></i>' + DG.esc(sub.status) + "</span></div></div>"
                : '<div class="dg-demo" style="margin-bottom:1rem"><i data-lucide="info"></i>' +
                  "<span>You have no plan yet. Meals shown below are the standard weekly menu.</span></div>") +

            '<div class="grid gap-4 lg:grid-cols-3">' +
            '<div class="lg:col-span-2 grid gap-3 sm:grid-cols-2">' + dayCards + "</div>" +
            '<div class="flex flex-col gap-4">' +

            /* meal preference */
            '<div class="dg-card dg-card-pad" id="dg-meal-pref">' +
            '<h3 class="text-base flex items-center gap-2"><i data-lucide="utensils-crossed" class="dg-ico-sm"></i>Meal preference</h3>' +
            '<p class="text-sm dg-lede" style="margin-top:.3rem">Choose which meals you want delivered each day.</p>' +
            '<div class="flex flex-col gap-2 mt-3" role="radiogroup" aria-label="Meal preference">' +
            ["Lunch", "Dinner", "Both", "Full Day"].map(function (opt) {
                var cur = (DG.auth.user() || {}).mealPref || "Lunch";
                return (
                    '<label class="dg-check"><input type="radio" name="dgPref" value="' + opt + '"' +
                    (cur === opt ? " checked" : "") + "><span>" +
                    (opt === "Both" ? "Lunch + Dinner" : opt === "Full Day" ? "Breakfast + Lunch + Dinner" : opt + " only") +
                    "</span></label>"
                );
            }).join("") +
            "</div>" +
            '<button type="button" class="dg-btn dg-btn-primary dg-btn-block" data-dg-save-pref style="margin-top:1rem">' +
            '<i data-lucide="check"></i>Save preference</button>' +
            '<p class="text-xs" style="color:var(--dg-ink-mute);margin-top:.5rem">' +
            "Applies from your next delivery. This is a demo setting.</p>" +
            "</div>" +

            /* upcoming */
            '<div class="dg-card dg-card-pad">' +
            '<h3 class="text-base flex items-center gap-2"><i data-lucide="calendar-clock" class="dg-ico-sm"></i>Upcoming meals</h3>' +
            (upcoming
                ? '<ul class="flex flex-col mt-2">' + upcoming + "</ul>"
                : '<p class="text-sm dg-lede" style="margin-top:.6rem">No deliveries scheduled yet.</p>') +
            '<button type="button" class="dg-btn dg-btn-outline dg-btn-sm dg-btn-block" data-dg-tab-jump="schedule" style="margin-top:1rem">' +
            'Open delivery schedule<i data-lucide="arrow-right"></i></button>' +
            "</div>" +

            "</div></div>";

        DG.icons(host);
    }

    /* ==================================================================
       RENDER — delivery schedule
       ================================================================== */

    function renderSchedule() {
        var host = document.getElementById("dg-p-schedule");
        if (!host) return;

        var pause = DG.delivery.pauseActive();
        var change = DG.delivery.changeRequest();
        var rows = DG.delivery.schedule().slice().sort(function (a, b) {
            return new Date(a.date) - new Date(b.date);
        });

        var body;
        if (!rows.length) {
            body =
                '<tr><td colspan="4" style="text-align:center;padding:2rem 1rem;color:var(--dg-ink-soft)">' +
                "No deliveries scheduled. Start a plan to see your schedule here.</td></tr>";
        } else {
            body = rows
                .map(function (r) {
                    var tone =
                        r.status === "Delivered" ? "dg-badge-green" :
                        r.status === "Out for delivery" ? "dg-badge-orange" :
                        r.status === "Paused" ? "dg-badge-outline" : "dg-badge-info";
                    return (
                        "<tr>" +
                        "<td><span class=\"font-bold\" style=\"color:var(--dg-ink)\">" + DG.fmt.dateShort(r.date) + "</span><br>" +
                        '<span class="text-xs" style="color:var(--dg-ink-mute)">' + DG.fmt.dayName(r.date) + "</span></td>" +
                        "<td>" + DG.esc(r.meal) + "</td>" +
                        "<td>" + DG.esc(r.time) + "</td>" +
                        '<td><span class="dg-badge ' + tone + '">' + DG.esc(r.status) + "</span>" +
                        (r.note ? '<br><span class="text-xs" style="color:var(--dg-brand)">' + DG.esc(r.note) + "</span>" : "") +
                        "</td>" +
                        "</tr>"
                    );
                })
                .join("");
        }

        host.innerHTML =
            (pause
                ? '<div class="dg-result dg-result-ok" style="margin-bottom:1rem">' +
                  '<span class="dg-icon-tile dg-icon-tile-brown"><i data-lucide="pause"></i></span>' +
                  '<div><p class="font-bold">Deliveries are paused</p>' +
                  '<p class="text-sm" style="color:var(--dg-ink-soft)">Paused from ' + DG.fmt.date(pause.from) +
                  " until " + DG.fmt.date(pause.until) +
                  (pause.reason ? " \u00b7 " + DG.esc(pause.reason) : "") +
                  ". You will not be charged for paused days.</p></div></div>"
                : "") +
            (change
                ? '<div class="dg-demo" style="margin-bottom:1rem"><i data-lucide="clock"></i>' +
                  "<span><strong>Schedule change requested.</strong> New time " + DG.esc(change.time) +
                  " from " + DG.fmt.date(change.from) + ". Our support desk will call you to confirm.</span></div>"
                : "") +

            '<div class="grid gap-4 lg:grid-cols-3">' +

            '<div class="dg-card dg-card-pad lg:col-span-2 overflow-hidden">' +
            '<div class="flex items-center justify-between gap-2 flex-wrap">' +
            '<h2 class="text-lg">Delivery schedule</h2>' +
            '<span class="dg-badge dg-badge-outline">' + rows.length + " deliveries</span></div>" +
            '<div class="dg-table-wrap" style="margin-top:.9rem">' +
            '<table class="dg-table"><thead><tr>' +
            "<th scope=\"col\">Date</th><th scope=\"col\">Meal</th><th scope=\"col\">Time</th><th scope=\"col\">Status</th>" +
            "</tr></thead><tbody>" + body + "</tbody></table></div>" +
            '<p class="dg-table-scroll-hint" style="margin-top:.5rem">' +
            '<i data-lucide="move-right"></i>Scroll sideways to see every column</p>' +
            "</div>" +

            '<div class="flex flex-col gap-4">' +

            '<div class="dg-card dg-card-pad">' +
            "<h3 class=\"text-base\">Delivery control</h3>" +
            '<p class="text-sm dg-lede" style="margin-top:.3rem">Going away? Pause instead of cancelling \u2014 your plan stays active.</p>' +
            '<button type="button" class="dg-btn ' + (pause ? "dg-btn-green" : "dg-btn-outline") + ' dg-btn-block" ' +
            'data-dg-toggle-pause style="margin-top:1rem"><i data-lucide="' + (pause ? "play" : "pause") + '"></i>' +
            (pause ? "Resume delivery" : "Pause delivery") + "</button>" +
            "</div>" +

            '<div class="dg-card dg-card-pad">' +
            '<h3 class="text-base">Request a schedule change</h3>' +
            '<form id="dg-change-form" class="flex flex-col gap-3" style="margin-top:.8rem">' +
            '<div class="dg-field"><label class="dg-label" for="dg-ch-date">Preferred start date</label>' +
            '<input class="dg-input" type="date" id="dg-ch-date" name="from" required></div>' +
            '<div class="dg-field"><label class="dg-label" for="dg-ch-time">Preferred delivery time</label>' +
            '<select class="dg-select" id="dg-ch-time" name="time" required>' +
            ["12:00 PM", "12:30 PM", "12:45 PM", "1:00 PM", "1:30 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM"]
                .map(function (t) {
                    return '<option value="' + t + '"' + (t === "12:45 PM" ? " selected" : "") + ">" + t + "</option>";
                })
                .join("") +
            "</select></div>" +
            '<div class="dg-field"><label class="dg-label" for="dg-ch-note">Anything else?</label>' +
            '<textarea class="dg-textarea" id="dg-ch-note" name="note" rows="2" ' +
            'placeholder="e.g. please deliver to the security desk on weekends"></textarea></div>' +
            '<button type="button" class="dg-btn dg-btn-primary dg-btn-block" data-dg-change-submit>' +
            '<i data-lucide="send"></i>Send request</button>' +
            '<p class="text-xs" style="color:var(--dg-ink-mute)">Demo only \u2014 no one is actually notified.</p>' +
            "</form></div>" +

            "</div></div>";

        DG.icons(host);

        var dateInput = document.getElementById("dg-ch-date");
        if (dateInput) {
            var tomorrow = DG.fmt.addDays(new Date(), 1);
            dateInput.min = new Date().toISOString().slice(0, 10);
            if (!dateInput.value) dateInput.value = tomorrow.toISOString().slice(0, 10);
        }
    }

    /* ==================================================================
       RENDER — payments
       ================================================================== */

    function renderPayments() {
        var host = document.getElementById("dg-p-payments");
        if (!host) return;

        var rows = DG.payments.list();
        var total = DG.payments.total();

        var body = rows.length
            ? rows
                  .map(function (p) {
                      var tone =
                          p.status === "Paid" ? "dg-badge-green" :
                          p.status === "Pending" ? "dg-badge-orange" : "dg-badge-danger";
                      return (
                          "<tr>" +
                          '<td><span class="font-bold" style="color:var(--dg-ink)">' + DG.fmt.date(p.date) + "</span><br>" +
                          '<span class="text-xs" style="color:var(--dg-ink-mute)">' + DG.esc(p.id || "—") + "</span></td>" +
                          "<td>" + DG.esc(p.plan) + "</td>" +
                          '<td class="font-bold" style="color:var(--dg-ink)">' + DG.fmt.money(p.amount) + "<br>" +
                          '<span class="text-xs font-normal" style="color:var(--dg-ink-mute)">' + DG.esc(p.method) + "</span></td>" +
                          '<td><span class="dg-badge ' + tone + '">' + DG.esc(p.status) + "</span></td>" +
                          '<td class="text-right"><button type="button" class="dg-btn dg-btn-outline dg-btn-sm" ' +
                          'data-dg-invoice="' + DG.esc(p.id || "") + '"><i data-lucide="receipt"></i>Invoice</button></td>' +
                          "</tr>"
                      );
                  })
                  .join("")
            : '<tr><td colspan="5" style="text-align:center;padding:2rem 1rem;color:var(--dg-ink-soft)">' +
              "No payments recorded yet.</td></tr>";

        host.innerHTML =
            '<div class="dg-stat-grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,13rem),1fr))">' +
            statTile({
                icon: "wallet",
                label: "Total paid",
                value: DG.fmt.money(total),
                sub: rows.length + (rows.length === 1 ? " payment" : " payments") + " (demo)",
                tone: "green"
            }) +
            statTile({
                icon: "receipt",
                label: "Last payment",
                value: rows.length ? DG.fmt.money(rows[0].amount) : "—",
                sub: rows.length ? DG.fmt.date(rows[0].date) : "Nothing yet",
                tone: "muted"
            }) +
            statTile({
                icon: "calendar",
                label: "Next renewal",
                value: (function () {
                    var s = DG.subscription.get();
                    return s ? DG.fmt.date(s.startDate) : "—";
                })(),
                sub: (function () {
                    var s = DG.subscription.get();
                    return s ? "Renews " + daysLeftOf(s) + " days from now" : "No active plan";
                })(),
                tone: "orange"
            }) +
            "</div>" +

            '<div class="dg-card dg-card-pad" style="margin-top:1rem">' +
            '<div class="flex items-center justify-between gap-2 flex-wrap">' +
            '<h2 class="text-lg">Payment history</h2>' +
            '<button type="button" class="dg-btn dg-btn-outline dg-btn-sm" data-dg-print-all>' +
            '<i data-lucide="printer"></i>Print statement</button></div>' +
            '<div class="dg-table-wrap" style="margin-top:.9rem">' +
            '<table class="dg-table"><thead><tr>' +
            '<th scope="col">Date</th><th scope="col">Plan</th><th scope="col">Amount</th>' +
            '<th scope="col">Status</th><th scope="col" style="text-align:end">Receipt</th>' +
            "</tr></thead><tbody>" + body + "</tbody></table></div>" +
            '<p class="dg-table-scroll-hint" style="margin-top:.5rem">' +
            '<i data-lucide="move-right"></i>Scroll sideways to see every column</p>' +
            '<div class="dg-demo" style="margin-top:1rem"><i data-lucide="info"></i>' +
            "<span>All transactions here are simulated. No real payment gateway is connected and no money moves.</span></div>" +
            "</div>";

        DG.icons(host);
    }

    /* ==================================================================
       RENDER — profile
       ================================================================== */

    function renderProfile() {
        var host = document.getElementById("dg-p-profile");
        if (!host) return;

        var u = DG.auth.user() || {};
        var areaOptions = DG.data.areas
            ? DG.data.areas.map(function (a) { return a.name; })
            : [];

        host.innerHTML =
            '<div class="grid gap-4 lg:grid-cols-3">' +
            '<div class="dg-card dg-card-pad lg:col-span-2">' +
            '<h2 class="text-lg">Profile &amp; delivery address</h2>' +
            '<p class="text-sm dg-lede" style="margin-top:.3rem">' +
            "These details are used to deliver your tiffin. Update them any time.</p>" +
            '<form id="dg-profile-form" class="grid gap-4 sm:grid-cols-2" style="margin-top:1.2rem">' +

            field("name", "Full name", "text", u.name, true) +
            field("email", "Email", "email", u.email, true) +
            field("mobile", "Mobile number", "tel", u.mobile, true) +
            '<div class="dg-field sm:col-span-2">' +
            '<label class="dg-label" for="dg-pf-address">Delivery address <span class="req">*</span></label>' +
            '<textarea class="dg-textarea" id="dg-pf-address" name="address" rows="2" required ' +
            'placeholder="Flat / room, building, street, landmark">' + DG.esc(u.address || "") + "</textarea>" +
            '<p class="dg-error" data-dg-err><i data-lucide="circle-alert"></i><span></span></p></div>' +

            '<div class="dg-field">' +
            '<label class="dg-label" for="dg-pf-area">Area <span class="req">*</span></label>' +
            '<input class="dg-input" id="dg-pf-area" name="area" list="dg-pf-area-list" value="' + DG.esc(u.area || "") + '" required>' +
            '<datalist id="dg-pf-area-list">' +
            areaOptions.map(function (a) { return '<option value="' + DG.esc(a) + '"></option>'; }).join("") +
            "</datalist></div>" +

            field("pincode", "Pincode", "text", u.pincode, true) +

            '<div class="dg-field">' +
            '<label class="dg-label" for="dg-pf-pref">Preferred meal</label>' +
            '<select class="dg-select" id="dg-pf-pref" name="mealPref">' +
            ["Lunch", "Dinner", "Both", "Full Day"].map(function (o) {
                return '<option value="' + o + '"' + ((u.mealPref || "Lunch") === o ? " selected" : "") + ">" +
                    (o === "Both" ? "Lunch + Dinner" : o === "Full Day" ? "All three meals" : o + " only") + "</option>";
            }).join("") +
            "</select></div>" +

            '<div class="sm:col-span-2 flex flex-col gap-2 sm:flex-row">' +
            '<button type="submit" class="dg-btn dg-btn-primary"><i data-lucide="check"></i>Save changes</button>' +
            '<button type="button" class="dg-btn dg-btn-danger" data-dg-signout>' +
            '<i data-lucide="log-out"></i>Sign out</button>' +
            "</div></form></div>" +

            '<div class="dg-card dg-card-pad flex flex-col gap-3">' +
            '<div class="flex items-center gap-3">' +
            '<span style="width:3rem;height:3rem;border-radius:1rem;display:grid;place-items:center;' +
            "background:linear-gradient(140deg,var(--dg-brand),#f0913f);color:#fff;font-weight:800;font-size:1.05rem\">" +
            DG.fmt.initials(u.name) + "</span>" +
            '<div class="min-w-0"><p class="font-bold dg-clamp-1">' + DG.esc(u.name || "Subscriber") + "</p>" +
            '<p class="text-xs dg-clamp-1" style="color:var(--dg-ink-mute)">' + DG.esc(u.email || "") + "</p></div></div>" +
            '<dl class="dg-meta-list">' +
            '<div><dt>Member since</dt><dd>' + (u.signedInAt ? DG.fmt.date(u.signedInAt) : "—") + "</dd></div>" +
            '<div><dt>Meals taken</dt><dd>' + (DG.payments.list().length * 14) + "</dd></div>" +
            '<div><dt>Favourites saved</dt><dd>' + DG.favorites.count() + "</dd></div>" +
            "</dl>" +
            '<a class="dg-btn dg-btn-outline dg-btn-sm dg-btn-block" href="menu.html">' +
            '<i data-lucide="heart"></i>View my favourites</a>' +
            '<div class="dg-demo"><i data-lucide="info"></i>' +
            "<span>Profile data is stored only in this browser. Clearing site data removes the account.</span></div>" +
            "</div></div>";

        DG.icons(host);
    }

    function field(name, label, type, value, required) {
        return (
            '<div class="dg-field">' +
            '<label class="dg-label" for="dg-pf-' + name + '">' + label +
            (required ? ' <span class="req">*</span>' : "") + "</label>" +
            '<input class="dg-input" id="dg-pf-' + name + '" name="' + name + '" type="' + type + '"' +
            (type === "text" && name === "pincode" ? ' inputmode="numeric" maxlength="6"' : "") +
            ' value="' + DG.esc(value || "") + '"' + (required ? " required" : "") + ">" +
            '<p class="dg-error" data-dg-err><i data-lucide="circle-alert"></i><span></span></p></div>'
        );
    }

    /* ==================================================================
       RENDER — notifications
       ================================================================== */

    function renderNotifications() {
        var host = document.getElementById("dg-p-notifications");
        if (!host) return;

        var list = DG.notify.list();
        var unread = DG.notify.unreadCount();

        var body = list.length
            ? list
                  .map(function (n) {
                      var tone =
                          n.type === "delivery" ? "dg-icon-tile-green" :
                          n.type === "payment" ? "" : n.type === "expiry" ? "dg-icon-tile-brown" : "dg-icon-tile-soft";
                      return (
                          '<li class="flex items-start gap-3 p-3.5" style="border-bottom:1px solid var(--dg-line);' +
                          (n.read ? "opacity:.72" : "background:var(--dg-brand-soft)") + '">' +
                          '<span class="dg-icon-tile ' + tone + '" style="width:2.2rem;height:2.2rem;border-radius:.65rem">' +
                          '<i data-lucide="' + (n.icon || "bell") + '"></i></span>' +
                          '<div class="min-w-0 flex-1">' +
                          '<p class="text-sm font-bold dg-clamp-2">' + DG.esc(n.title) + "</p>" +
                          '<p class="text-sm dg-clamp-2" style="color:var(--dg-ink-soft)">' + DG.esc(n.msg) + "</p>" +
                          '<p class="text-xs" style="color:var(--dg-ink-mute);margin-top:.2rem">' +
                          DG.fmt.timeAgo(n.time) + "</p></div>" +
                          (n.read ? "" : '<span class="dg-dot dg-dot-orange" style="margin-top:.5rem" title="Unread"></span>') +
                          "</li>"
                      );
                  })
                  .join("")
            : '<li class="p-6 text-center" style="color:var(--dg-ink-soft)">No notifications yet.</li>';

        host.innerHTML =
            '<div class="dg-card dg-card-pad flex items-center justify-between gap-2 flex-wrap">' +
            "<div><h2 class=\"text-lg\">Notifications</h2>" +
            '<p class="text-sm" style="color:var(--dg-ink-soft)">Delivery updates, renewals and payment confirmations.</p></div>' +
            '<div class="flex gap-2 flex-wrap">' +
            (unread ? '<span class="dg-badge dg-badge-orange">' + unread + " unread</span>" : '<span class="dg-badge dg-badge-green">All read</span>') +
            '<button type="button" class="dg-btn dg-btn-outline dg-btn-sm" data-dg-readall>' +
            '<i data-lucide="check-check"></i>Mark all read</button>' +
            '<button type="button" class="dg-btn dg-btn-ghost dg-btn-sm" data-dg-clear-notify>' +
            '<i data-lucide="trash-2"></i>Clear</button></div></div>' +
            '<div class="dg-card" style="margin-top:1rem;overflow:hidden">' +
            '<ul class="flex flex-col">' + body + "</ul></div>";

        DG.icons(host);
    }

    /* ==================================================================
       Tabs
       ================================================================== */

    var TABS = [
        { id: "overview", label: "Overview", icon: "gauge" },
        { id: "plan", label: "Meal Plan", icon: "utensils-crossed" },
        { id: "schedule", label: "Delivery Schedule", icon: "truck" },
        { id: "payments", label: "Payment History", icon: "receipt" },
        { id: "profile", label: "Profile", icon: "user-round" },
        { id: "notifications", label: "Notifications", icon: "bell" }
    ];

    function renderTabs() {
        var host = document.getElementById("dg-dash-tabs");
        if (!host) return;
        var unread = DG.notify.unreadCount();
        host.innerHTML = TABS.map(function (t) {
            var badge = t.id === "notifications" && unread
                ? '<span class="dg-badge dg-badge-solid" style="padding:.1rem .4rem;font-size:.62rem">' + unread + "</span>"
                : "";
            return (
                '<button type="button" class="dg-dash-tab" data-dg-tab="' + t.id + '" aria-current="false">' +
                '<i data-lucide="' + t.icon + '"></i><span>' + t.label + "</span>" + badge +
                "</button>"
            );
        }).join("");
        DG.icons(host);
    }

    function showTab(id, opts) {
        if (!TABS.some(function (t) { return t.id === id; })) id = "overview";
        activeTab = id;

        TABS.forEach(function (t) {
            var panel = document.getElementById("dg-p-" + t.id);
            if (panel) panel.classList.toggle("is-hidden", t.id !== id);
        });
        Array.prototype.forEach.call(document.querySelectorAll("[data-dg-tab]"), function (b) {
            var on = b.dataset.dgTab === id;
            b.classList.toggle("is-active", on);
            b.setAttribute("aria-current", on ? "page" : "false");
        });

        if (!opts || !opts.silent) {
            try {
                history.replaceState(null, "", "#" + id);
            } catch (e) {
                /* ignore */
            }
        }

        var tabs = document.getElementById("dg-dash-tabs");
        if (tabs) {
            var activeBtn = tabs.querySelector('[data-dg-tab="' + id + '"]');
            if (activeBtn && window.innerWidth < 1024) {
                tabs.scrollTo({ left: activeBtn.offsetLeft - 8, behavior: "smooth" });
            }
        }
    }

    /* ==================================================================
       Receipt / invoice modal
       ================================================================== */

    function openInvoice(id) {
        var payment = DG.payments.list().filter(function (p) { return p.id === id; })[0];
        if (!payment) {
            DG.toast("We could not find that receipt.", { type: "error" });
            return;
        }
        var u = DG.auth.user() || {};

        var html =
            '<div class="dg-modal" id="dg-modal" role="dialog" aria-modal="true" aria-label="Invoice">' +
            '<div class="dg-modal-scrim" data-dg-close-modal></div>' +
            '<div class="dg-modal-panel">' +
            '<div class="dg-modal-head">' +
            '<h2 class="text-lg">Invoice</h2>' +
            '<button type="button" class="dg-iconbtn" data-dg-close-modal aria-label="Close invoice">' +
            '<i data-lucide="x"></i></button></div>' +
            '<div class="dg-modal-body" id="dg-receipt">' +
            '<div class="dg-receipt">' +
            '<div class="dg-receipt-head">' +
            '<p class="dg-logo" style="font-size:1.15rem"><span class="dg-logo-mark">' +
            '<i data-lucide="cooking-pot"></i></span><span>Dabba<em>Go</em></span></p>' +
            '<p class="text-xs" style="color:var(--dg-ink-mute)">DabbaGo Foods Pvt. Ltd.<br>' +
            "Sneh Nagar, Mumbai 400004<br>GSTIN 27AABCD1234E1Z5</p></div>" +
            '<div class="dg-receipt-grid">' +
            "<div><span>Invoice no.</span><strong>" + DG.esc(payment.id) + "</strong></div>" +
            "<div><span>Date</span><strong>" + DG.fmt.date(payment.date) + "</strong></div>" +
            "<div><span>Customer</span><strong>" + DG.esc(u.name || "Subscriber") + "</strong></div>" +
            "<div><span>Mobile</span><strong>" + DG.esc(u.mobile || "—") + "</strong></div>" +
            "<div><span>Address</span><strong>" + DG.esc(u.address || "—") + "</strong></div>" +
            "<div><span>Payment</span><strong>" + DG.esc(payment.method || "UPI") + "</strong></div>" +
            "</div>" +
            '<table class="dg-receipt-table"><thead><tr><th>Description</th><th>Amount</th></tr></thead><tbody>' +
            "<tr><td>" + DG.esc(payment.plan) + " \u00b7 " + (payment.meals || "Subscription") + "</td>" +
            "<td>" + DG.fmt.money(payment.amount) + "</td></tr>" +
            '<tr class="dg-receipt-total"><td>Total paid</td><td>' + DG.fmt.money(payment.amount) + "</td></tr>" +
            "</tbody></table>" +
            '<p class="dg-badge ' + (payment.status === "Paid" ? "dg-badge-green" : "dg-badge-orange") + '">' +
            DG.esc(payment.status) + "</p>" +
            '<p class="text-xs" style="color:var(--dg-ink-mute);margin-top:1rem">' +
            "This is a computer-generated demonstration invoice. No real payment was processed.</p>" +
            "</div></div>" +
            '<div class="dg-modal-foot">' +
            '<button type="button" class="dg-btn dg-btn-outline" data-dg-close-modal>Close</button>' +
            '<button type="button" class="dg-btn dg-btn-primary" data-dg-print-receipt>' +
            '<i data-lucide="printer"></i>Print / Save as PDF</button></div>' +
            "</div></div>";

        var host = document.getElementById("dg-modal-root");
        host.innerHTML = html;
        DG.icons(host);
        document.body.classList.add("dg-no-scroll");
    }

    function closeModal() {
        var host = document.getElementById("dg-modal-root");
        if (host) host.innerHTML = "";
        document.body.classList.remove("dg-no-scroll");
        document.body.classList.remove("dg-printing");
    }

    /* ==================================================================
       Interactions
       ================================================================== */

    function togglePause() {
        var existing = DG.delivery.pauseActive();
        var sub = DG.subscription.get();

        if (existing) {
            DG.delivery.setPause(null);
            DG.notify.add({
                type: "delivery",
                icon: "play",
                title: "Deliveries resumed",
                msg: "Your " + (sub ? sub.planName.toLowerCase() : "plan") + " deliveries are back on schedule."
            });
            DG.toast("Deliveries resumed. Next tiffin arrives as scheduled.", {
                title: "Delivery resumed",
                type: "success"
            });
        } else {
            var until = DG.fmt.addDays(new Date(), 3);
            DG.delivery.setPause({
                type: "pause",
                from: new Date().toISOString(),
                until: until.toISOString(),
                reason: "Paused by subscriber",
                status: "Active"
            });
            DG.notify.add({
                type: "pause",
                icon: "pause",
                title: "Deliveries paused",
                msg: "Paused until " + DG.fmt.date(until) + ". You can resume any time."
            });
            DG.toast("Deliveries paused until " + DG.fmt.date(until) + ".", {
                title: "Delivery paused",
                type: "warning"
            });
        }
        refresh();
    }

    function submitChangeRequest() {
        var from = document.getElementById("dg-ch-date");
        var time = document.getElementById("dg-ch-time");
        var note = document.getElementById("dg-ch-note");
        if (!from || !time) return;

        if (!from.value) {
            DG.toast("Pick a start date for the new schedule.", { type: "error" });
            from.focus();
            return;
        }

        DG.delivery.setChange({
            type: "schedule-change",
            from: from.value,
            time: time.value,
            note: note ? note.value.trim() : "",
            status: "Pending"
        });

        DG.notify.add({
            type: "delivery",
            icon: "calendar-clock",
            title: "Schedule change requested",
            msg: "New delivery time " + time.value + " from " + DG.fmt.date(from.value) + "."
        });

        DG.toast("Request saved. Our support desk would confirm by phone within 2 hours (demo).", {
            title: "Request submitted",
            type: "success"
        });
        refresh();
    }

    function savePreference() {
        var picked = document.querySelector('input[name="dgPref"]:checked');
        if (!picked) {
            DG.toast("Choose one option first.", { type: "error" });
            return;
        }
        DG.auth.update({ mealPref: picked.value });
        DG.store.set(DG.KEYS.mealPref, picked.value);
        DG.notify.add({
            type: "info",
            icon: "utensils-crossed",
            title: "Meal preference updated",
            msg: "You now receive " + picked.value + ". This applies from your next delivery."
        });
        DG.toast("Meal preference saved as " + picked.value.toLowerCase() + ".", {
            title: "Preference updated",
            type: "success"
        });
        refresh();
    }

    function saveProfile(form) {
        var data = {
            name: form.querySelector('[name="name"]').value.trim(),
            email: form.querySelector('[name="email"]').value.trim(),
            mobile: form.querySelector('[name="mobile"]').value.replace(/\D/g, ""),
            address: form.querySelector('[name="address"]').value.trim(),
            area: form.querySelector('[name="area"]').value.trim(),
            pincode: form.querySelector('[name="pincode"]').value.replace(/\D/g, ""),
            mealPref: form.querySelector('[name="mealPref"]').value
        };

        /* reuse the signup validators */
        var ok = true;
        ["name", "email", "mobile", "address", "area", "pincode"].forEach(function (n) {
            var input = form.querySelector('[name="' + n + '"]');
            if (!input) return;
            if (DG.auth.validateInput && !DG.auth.validateInput(input, form)) ok = false;
        });
        if (!ok) {
            DG.toast("Please correct the highlighted fields.", { type: "error" });
            return;
        }

        DG.auth.update(data);
        DG.store.set(DG.KEYS.mealPref, data.mealPref);
        DG.toast("Your profile has been updated.", { title: "Saved", type: "success" });
        refresh();
    }

    /* ==================================================================
       Init
       ================================================================== */

    function refresh() {
        if (!DG.auth.isLoggedIn()) {
            renderGate();
            return;
        }
        renderTabs();
        renderOverview();
        renderMealPlan();
        renderSchedule();
        renderPayments();
        renderProfile();
        renderNotifications();
        showTab(activeTab, { silent: true });
    }

    function init() {
        if (!document.getElementById("dg-dash-body")) return;

        var demoDashboard = document.body.getAttribute("data-demo-dashboard") === "true";
        if (demoDashboard && !DG.auth.isLoggedIn()) {
            DG.auth.signIn({ name: "DabbaGo Member", email: "member@dabbago.in", mobile: "9876543210", mealPref: "Lunch" });
        }
        var fresh = ensureData();
        if (!DG.auth.isLoggedIn()) {
            renderGate();
        } else {
            activeTab = (window.location.hash || "").replace("#", "") || "overview";
            refresh();
        }

        /* greet */
        var hello = document.getElementById("dg-hello");
        if (hello) {
            var u = DG.auth.user();
            if (u && u.name) {
                hello.textContent = "Namaste, " + u.name.split(" ")[0] + "!";
            } else {
                hello.textContent = "Your DabbaGo dashboard";
            }
        }

        if (fresh) {
            var banner = document.getElementById("dg-demo-banner");
            if (banner) banner.classList.remove("is-hidden");
        }

        /* ---------------- delegated events ---------------- */

        document.addEventListener("click", function (e) {
            var t;

            if (e.target.closest("[data-dg-signout]")) {
                DG.auth.signOut();
                window.location.href = "login.html";
                return;
            }
            if ((t = e.target.closest("[data-dg-tab]"))) {
                showTab(t.dataset.dgTab);
                return;
            }
            if (e.target.closest("[data-dg-tab-jump]")) {
                showTab(e.target.closest("[data-dg-tab-jump]").dataset.dgTabJump);
                return;
            }
            if (e.target.closest("[data-dg-toggle-pause]")) {
                togglePause();
                return;
            }
            if (e.target.closest("[data-dg-change-submit]")) {
                submitChangeRequest();
                return;
            }
            if (e.target.closest("[data-dg-save-pref]")) {
                savePreference();
                return;
            }
            if (e.target.closest("[data-dg-seed]")) {
                seedDemo();
                DG.toast("Sample subscription loaded so you can explore the dashboard.", {
                    title: "Sample data",
                    type: "success"
                });
                refresh();
                return;
            }
            if ((t = e.target.closest("[data-dg-invoice]"))) {
                openInvoice(t.dataset.dgInvoice);
                return;
            }
            if (e.target.closest("[data-dg-print-receipt]")) {
                document.body.classList.add("dg-printing");
                window.setTimeout(function () {
                    window.print();
                    window.setTimeout(function () {
                        document.body.classList.remove("dg-printing");
                    }, 400);
                }, 60);
                return;
            }
            if (e.target.closest("[data-dg-print-all]")) {
                DG.toast("Use your browser print dialog and choose “Save as PDF”.", {
                    title: "Print statement",
                    type: "info"
                });
                return;
            }
            if (e.target.closest("[data-dg-close-modal]")) {
                closeModal();
                return;
            }
            if (e.target.closest("[data-dg-readall]")) {
                DG.notify.markAllRead();
                renderTabs();
                renderNotifications();
                DG.toast("All notifications marked as read.", { type: "success", timeout: 2000 });
                return;
            }
            if (e.target.closest("[data-dg-clear-notify]")) {
                DG.notify.clear();
                renderTabs();
                renderNotifications();
                DG.toast("Notifications cleared.", { type: "info", timeout: 2000 });
                return;
            }
            if (e.target.closest("[data-dg-dismiss-banner]")) {
                var b = document.getElementById("dg-demo-banner");
                if (b) b.classList.add("is-hidden");
            }
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") closeModal();
        });

        document.addEventListener("submit", function (e) {
            if (e.target.id === "dg-profile-form") {
                e.preventDefault();
                saveProfile(e.target);
            }
        });

        /* pref radio -> immediate visual update of the labels */
        document.addEventListener("change", function (e) {
            if (e.target.name === "dgPref") {
                Array.prototype.forEach.call(
                    document.querySelectorAll('input[name="dgPref"]'),
                    function (r) {
                        r.closest(".dg-check").classList.toggle("is-active", r.checked);
                    }
                );
            }
        });

        /* breadcrumb/tab links coming from the footer (#dg-pay, #dg-profile) */
        var h = (window.location.hash || "").replace("#", "");
        if (h === "dg-pay") showTab("payments");
        else if (h === "dg-profile") showTab("profile");
        else if (h === "dg-plan") showTab("plan");
        else if (h === "dg-notifications") showTab("notifications");
    }

    DG.pages = DG.pages || {};
    DG.pages.dashboard = init;
    DG.dashboard = { refresh: refresh, showTab: showTab };
})();
