/* ==========================================================================
   DabbaGo — auth.js
   Front-end only sign-in / sign-up. No backend, no real credentials —
   the "account" is a JSON blob in localStorage.
   ========================================================================== */

(function () {
    "use strict";

    var DG = (window.DG = window.DG || {});

    /* ------------------------------------------------------------------
       Shared validators
       ------------------------------------------------------------------ */

    var RULES = {
        name: {
            test: function (v) { return v.trim().length >= 3 && /^[\p{L}\s.'-]+$/u.test(v.trim()); },
            msg: "Enter your full name (at least 3 letters)."
        },
        email: {
            test: function (v) { return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim()); },
            msg: "Enter a valid email address, like name@college.edu."
        },
        mobile: {
            test: function (v) { return /^[6-9]\d{9}$/.test(v.replace(/\D/g, "")); },
            msg: "Enter a valid 10-digit Indian mobile number."
        },
        password: {
            test: function (v) { return v.length >= 8 && /[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v); },
            msg: "At least 8 characters, with one uppercase, one lowercase and one number."
        },
        confirm: {
            test: function (v, form) {
                var pw = form.querySelector('[name="password"]');
                return !!pw && v === pw.value;
            },
            msg: "Passwords do not match."
        },
        address: {
            test: function (v) { return v.trim().length >= 8; },
            msg: "Enter your full delivery address including flat or room number."
        },
        area: {
            test: function (v) { return v.trim().length >= 3; },
            msg: "Enter your area or locality name."
        },
        pincode: {
            test: function (v) { return /^\d{6}$/.test(v.replace(/\D/g, "")); },
            msg: "Enter a valid 6-digit pincode."
        }
    };

    function fieldWrap(input) {
        return input ? input.closest(".dg-field") : null;
    }

    function setError(input, msg) {
        var wrap = fieldWrap(input);
        if (!wrap) return;
        var box = wrap.querySelector(".dg-error");
        if (msg) {
            wrap.classList.add("is-invalid");
            wrap.classList.remove("is-valid");
            if (box) {
                box.innerHTML = '<i data-lucide="circle-alert"></i><span></span>';
                box.querySelector("span").textContent = msg;
                box.classList.add("is-shown");
                DG.icons(box);
            }
        } else {
            wrap.classList.remove("is-invalid");
            if (input.value.trim()) wrap.classList.add("is-valid");
            if (box) box.classList.remove("is-shown");
        }
    }

    function validateInput(input, form) {
        var name = input.getAttribute("name");
        var rule = RULES[name];
        if (!rule) return true;
        if (!input.value.trim() && !input.hasAttribute("required")) {
            setError(input, null);
            return true;
        }
        var ok = rule.test(input.value, form);
        setError(input, ok ? null : rule.msg);
        return ok;
    }

    /* Password strength meter (signup) */
    function strengthOf(v) {
        var score = 0;
        if (v.length >= 8) score++;
        if (/[a-z]/.test(v) && /[A-Z]/.test(v)) score++;
        if (/\d/.test(v)) score++;
        if (/[^A-Za-z0-9]/.test(v)) score++;
        if (v.length >= 12) score++;
        return DG.clamp(score, 0, 5);
    }

    function paintStrength(wrap, value) {
        if (!wrap) return;
        var bars = wrap.querySelectorAll("[data-dg-strength-bar]");
        var label = wrap.querySelector("[data-dg-strength-label]");
        var score = strengthOf(value);
        var words = ["Too short", "Weak", "Fair", "Good", "Strong", "Excellent"];
        var colors = ["", "dg-dot-red", "dg-dot-orange", "dg-dot-orange", "dg-dot-green", "dg-dot-green"];

        Array.prototype.forEach.call(bars, function (bar, i) {
            bar.style.background = i < score
                ? "var(--dg-" + (score <= 2 ? "danger" : score <= 3 ? "brand" : "green") + ")"
                : "var(--dg-line)";
        });
        if (label) {
            label.textContent = value ? words[score] : "";
            label.className = "text-xs font-bold " + (value ? colors[score] : "");
        }
    }

    /* Show / hide password */
    function initPasswordToggles() {
        document.addEventListener("click", function (e) {
            var btn = e.target.closest("[data-dg-toggle-pass]");
            if (!btn) return;
            var input = document.getElementById(btn.dataset.dgTogglePass);
            if (!input) return;
            var show = input.type === "password";
            input.type = show ? "text" : "password";
            btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
            var icon = btn.querySelector("i");
            if (icon) {
                icon.setAttribute("data-lucide", show ? "eye-off" : "eye");
                DG.icons(btn);
            }
            input.focus();
        });
    }

    /* ------------------------------------------------------------------
       Redirect helpers
       ------------------------------------------------------------------ */

    function safeNext(defaultPage) {
        var p = new URLSearchParams(window.location.search);
        var next = p.get("next");
        if (!next) return defaultPage;
        /* only allow same-site html pages — prevents open redirect */
        if (/^(https?:)?\/\//i.test(next) || next.indexOf("..") > -1) return defaultPage;
        if (!/\.html?$/i.test(next)) return defaultPage;
        return next;
    }

    function pendingPlan() {
        var sel = DG.store.get(DG.KEYS.planSelection, null);
        if (sel && sel.planId) return sel.planId;
        return new URLSearchParams(window.location.search).get("plan");
    }

    /* ------------------------------------------------------------------
       Seed a brand new subscriber's dashboard data
       ------------------------------------------------------------------ */

    function seedNewUser(name, email) {
        var planId = pendingPlan();
        var plan = DG.data.planById ? DG.data.planById(planId) : null;
        var first = (name || "there").split(" ")[0];

        DG.store.remove(DG.KEYS.delivery);
        DG.store.remove(DG.KEYS.pauseRequests);

        DG.notify.add({
            type: "delivery",
            icon: "truck",
            title: "Welcome to DabbaGo",
            msg: "Hi " + first + "! Add a plan to get your first tiffin delivered."
        });

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
                endDate: endFor(plan).toISOString(),
                status: "Active",
                deliveryTime: "12:45 PM"
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
                msg: plan.name + " — " + DG.fmt.money(plan.price) + " recorded (demo)."
            });
            DG.notify.add({
                type: "expiry",
                icon: "timer",
                title: "Subscription ends " + DG.fmt.date(endFor(plan)),
                msg: "We will remind you two days before it expires."
            });
        }

        if (email) {
            DG.store.set(DG.KEYS.delivery, buildUpcoming());
        }
    }

    function endFor(plan) {
        return DG.fmt.addDays(new Date(), plan.id === "weekly" ? 7 : 30);
    }

    function buildUpcoming() {
        var rows = [];
        for (var i = 1; i <= 6; i++) {
            var d = DG.fmt.addDays(new Date(), i);
            rows.push({
                date: d.toISOString(),
                meal: i % 2 === 0 ? "Dinner" : "Lunch",
                time: i % 2 === 0 ? "8:00 PM" : "12:45 PM",
                status: "Scheduled",
                note: ""
            });
        }
        return rows;
    }

    /* ==================================================================
       Login page
       ================================================================== */

    function initLogin() {
        var form = document.getElementById("dg-login-form");
        if (!form) return;

        /* already signed in? */
        if (DG.auth.isLoggedIn()) {
            var notice = document.getElementById("dg-login-signed-in");
            var u = DG.auth.user();
            if (notice) {
                notice.classList.remove("is-hidden");
                var nm = document.getElementById("dg-login-name");
                if (nm) nm.textContent = u.name || u.email;
            }
        }

        form.addEventListener("input", function (e) {
            if (e.target.tagName === "INPUT" && e.target.type !== "checkbox") {
                validateInput(e.target, form);
            }
        });

        form.addEventListener("submit", function (e) {
            e.preventDefault();

            var id = form.querySelector('[name="email"]');
            var pw = form.querySelector('[name="password"]');
            var remember = form.querySelector('[name="remember"]');

            var idOk = validateInput(id, form);
            var pwOk = pw.value.length >= 6;

            if (!pwOk) {
                setError(pw, "Enter your password (at least 6 characters).");
            } else {
                setError(pw, null);
            }

            if (!idOk || !pwOk) {
                DG.toast("Please check the highlighted fields.", { type: "error" });
                var firstBad = form.querySelector(".dg-field.is-invalid .dg-input");
                if (firstBad) firstBad.focus();
                return;
            }

            var submit = form.querySelector('[type="submit"]');
            var label = submit.querySelector("span");
            var original = label ? label.textContent : "";
            if (label) label.textContent = "Signing in…";
            submit.disabled = true;

            window.setTimeout(function () {
                submit.disabled = false;
                if (label) label.textContent = original;

                var existing = DG.store.get("dabbago_demo_accounts", []) || [];
                var known = existing.filter(function (a) {
                    return a.email.toLowerCase() === id.value.trim().toLowerCase();
                })[0];

                var user = known
                    ? known
                    : {
                          name: id.value.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); }),
                          email: id.value.trim(),
                          mobile: known ? known.mobile : "9876543210",
                          address: known ? known.address : "Flat 302, Sneh Nagar Apartments, Sneh Nagar",
                          area: known ? known.area : "Andheri West",
                          pincode: known ? known.pincode : "400053",
                          mealPref: known ? known.mealPref : "Lunch"
                      };

                DG.auth.signIn({
                    name: user.name,
                    email: user.email,
                    mobile: user.mobile,
                    address: user.address,
                    area: user.area,
                    pincode: user.pincode,
                    mealPref: user.mealPref,
                    signedInAt: new Date().toISOString(),
                    demo: !remember || !remember.checked ? true : true
                });

                if (remember && remember.checked) {
                    DG.store.set("dabbago_remember", id.value.trim());
                } else {
                    DG.store.remove("dabbago_remember");
                }

                DG.toast("Welcome back, " + user.name.split(" ")[0] + "!", {
                    title: "Signed in (demo)",
                    type: "success"
                });

                var plan = pendingPlan();
                window.setTimeout(function () {
                    if (plan && DG.data.planById) {
                        var p = DG.data.planById(plan);
                        if (p) {
                            window.location.href = "plans.html#" + plan;
                            return;
                        }
                    }
                    window.location.href = safeNext("dashboard.html");
                }, 800);
            }, 650);
        });

        /* prefill remembered email */
        var remembered = DG.store.get("dabbago_remember", null);
        if (remembered) {
            var idEl = form.querySelector('[name="email"]');
            var rm = form.querySelector('[name="remember"]');
            if (idEl) idEl.value = remembered;
            if (rm) rm.checked = true;
        }

        /* forgot password — demo only */
        var forgot = document.getElementById("dg-forgot");
        if (forgot) {
            forgot.addEventListener("click", function (e) {
                e.preventDefault();
                var id = form.querySelector('[name="email"]');
                if (!id.value.trim() || !validateInput(id, form)) {
                    DG.toast("Enter your email above first, then tap Forgot password.", { type: "info" });
                    id.focus();
                    return;
                }
                DG.toast(
                    "This is a demo \u2014 no email is sent. In a live app a reset link would go to " + id.value.trim() + ".",
                    { title: "Password reset", type: "info", timeout: 6000 }
                );
            });
        }

        /* demo account quick fill */
        var demoBtn = document.getElementById("dg-demo-fill");
        if (demoBtn) {
            demoBtn.addEventListener("click", function () {
                form.querySelector('[name="email"]').value = "aarav@college.edu";
                form.querySelector('[name="password"]').value = "Dabba2024";
                setError(form.querySelector('[name="email"]'), null);
                setError(form.querySelector('[name="password"]'), null);
                DG.toast("Demo credentials filled in. Press Sign in.", { type: "info", icon: "user" });
            });
        }
    }

    /* ==================================================================
       Sign-up page
       ================================================================== */

    function initSignup() {
        var form = document.getElementById("dg-signup-form");
        if (!form) return;

        /* live pincode -> area hint */
        var pin = form.querySelector('[name="pincode"]');
        var area = form.querySelector('[name="area"]');
        var hint = document.getElementById("dg-pin-hint");

        /* offer the serviced localities as autocomplete options */
        var list = document.getElementById("dg-area-options");
        if (list && DG.data.areas) {
            list.innerHTML = DG.data.areas
                .map(function (a) { return '<option value="' + DG.esc(a.name) + '"></option>'; })
                .join("");
        }

        if (pin) {
            pin.addEventListener("input", function () {
                var v = pin.value.replace(/\D/g, "").slice(0, 6);
                if (v !== pin.value) pin.value = v;
                updatePinHint();
            });
        }

        function updatePinHint() {
            if (!hint) return;
            var v = pin.value;
            if (v.length !== 6) {
                hint.textContent = "6-digit pincode";
                return;
            }
            if (!DG.delivery || !DG.delivery.check) {
                hint.textContent = "";
                return;
            }
            var r = DG.delivery.check(v, area ? area.value : "");
            hint.textContent = r.ok
                ? r.zone.name + " \u00b7 " + r.zone.eta
                : "Not currently in our service zones";
        }

        if (area) {
            area.addEventListener("input", function () {
                if (pin && pin.value.length === 6) updatePinHint();
            });
            area.addEventListener("change", updatePinHint);
        }

        /* password strength */
        var pw = form.querySelector('[name="password"]');
        var meter = document.getElementById("dg-strength");
        if (pw) {
            pw.addEventListener("input", function () { paintStrength(meter, pw.value); });
        }

        /* live validation */
        form.addEventListener("input", function (e) {
            if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") {
                if (e.target.type !== "checkbox" && e.target.type !== "radio") {
                    validateInput(e.target, form);
                }
            }
        });
        form.addEventListener("blur", function (e) {
            if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") {
                validateInput(e.target, form);
            }
        }, true);

        form.addEventListener("submit", function (e) {
            e.preventDefault();

            var inputs = Array.prototype.slice.call(
                form.querySelectorAll("input[required], select[required], textarea[required]")
            );
            var firstBad = null;
            inputs.forEach(function (input) {
                if (!validateInput(input, form) && !firstBad) firstBad = input;
            });

            /* terms */
            var terms = form.querySelector('[name="terms"]');
            var termsWrap = terms ? terms.closest(".dg-field") : null;
            if (terms && !terms.checked) {
                if (termsWrap) termsWrap.classList.add("is-invalid");
                if (!firstBad) firstBad = terms;
            } else if (termsWrap) {
                termsWrap.classList.remove("is-invalid");
            }

            if (firstBad) {
                DG.toast("Please correct the highlighted fields before continuing.", { type: "error" });
                firstBad.focus();
                firstBad.scrollIntoView({ behavior: "smooth", block: "center" });
                return;
            }

            var data = {
                name: form.querySelector('[name="name"]').value.trim(),
                email: form.querySelector('[name="email"]').value.trim(),
                mobile: form.querySelector('[name="mobile"]').value.replace(/\D/g, ""),
                address: form.querySelector('[name="address"]').value.trim(),
                area: (form.querySelector('[name="area"]') || {}).value || "",
                pincode: ((form.querySelector('[name="pincode"]') || {}).value || "").replace(/\D/g, ""),
                mealPref: (form.querySelector('[name="mealPref"]') || {}).value || "Lunch",
                signedInAt: new Date().toISOString()
            };

            var submit = form.querySelector('[type="submit"]');
            var label = submit.querySelector("span");
            var original = label ? label.textContent : "";
            if (label) label.textContent = "Creating your account…";
            submit.disabled = true;

            window.setTimeout(function () {
                submit.disabled = false;
                if (label) label.textContent = original;

                /* store a demo account so login can find it again */
                var accounts = DG.store.get("dabbago_demo_accounts", []) || [];
                accounts = accounts.filter(function (a) {
                    return a.email.toLowerCase() !== data.email.toLowerCase();
                });
                accounts.unshift(data);
                DG.store.set("dabbago_demo_accounts", accounts.slice(0, 8));

                DG.auth.signIn(data);
                DG.store.set(DG.KEYS.mealPref, data.mealPref);
                seedNewUser(data.name, data.email);

                DG.toast("Account created. Welcome to the DabbaGo family, " + data.name.split(" ")[0] + "!", {
                    title: "Signed up (demo)",
                    type: "success",
                    timeout: 3200
                });

                window.setTimeout(function () {
                    var sub = DG.subscription.get();
                    window.location.href = sub || !pendingPlan() ? "dashboard.html" : "plans.html";
                }, 1000);
            }, 800);
        });
    }

    DG.auth.initPasswordToggles = initPasswordToggles;
    DG.auth.validateInput = validateInput;
    DG.auth.setError = setError;

    DG.pages = DG.pages || {};
    DG.pages.login = initLogin;
    DG.pages.signup = initSignup;

    document.addEventListener("DOMContentLoaded", initPasswordToggles);
})();
