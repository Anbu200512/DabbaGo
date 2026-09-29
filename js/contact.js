/* ==========================================================================
   DabbaGo - contact.js
   Contact page: the enquiry form is a demo, so submitting it only fakes a
   round trip and shows a toast. Nothing is sent or stored anywhere.
   ========================================================================== */

(function () {
    "use strict";

    var DG = (window.DG = window.DG || {});

    function initContact() {
        var form = document.getElementById("dg-contact-form");
        if (!form) return;

        /* `message` has no rule in DG.auth's table, so check it by hand */
        function validate() {
            var ok = true;
            var fields = form.querySelectorAll("input[required], select[required], textarea[required]");
            for (var i = 0; i < fields.length; i++) {
                var input = fields[i];
                if (input.name === "message") {
                    var short = input.value.trim().length < 10;
                    if (DG.auth.setError) DG.auth.setError(input, short ? "Please write at least 10 characters so we can help." : null);
                    if (short) ok = false;
                    continue;
                }
                if (DG.auth.validateInput && !DG.auth.validateInput(input, form)) ok = false;
            }
            return ok;
        }

        form.addEventListener("input", function (e) {
            if (e.target.type === "checkbox") return;
            if (e.target.name === "message") {
                if (e.target.value.trim().length >= 10 && DG.auth.setError) DG.auth.setError(e.target, null);
                return;
            }
            if (DG.auth.validateInput) DG.auth.validateInput(e.target, form);
        });

        form.addEventListener("submit", function (e) {
            e.preventDefault();

            if (!validate()) {
                DG.toast("Please correct the highlighted fields before sending.", { type: "error" });
                var bad = form.querySelector(".dg-field.is-invalid .dg-input, .dg-field.is-invalid .dg-textarea");
                if (bad) {
                    bad.focus();
                    bad.scrollIntoView({ behavior: "smooth", block: "center" });
                }
                return;
            }

            var submit = form.querySelector('[type="submit"]');
            var label = submit ? submit.querySelector("span") : null;
            var original = label ? label.textContent : "";
            if (submit) submit.disabled = true;
            if (label) label.textContent = "Sending…";

            window.setTimeout(function () {
                if (submit) submit.disabled = false;
                if (label) label.textContent = original;
                form.reset();
                Array.prototype.forEach.call(form.querySelectorAll(".dg-field"), function (f) {
                    f.classList.remove("is-valid", "is-invalid");
                });
                DG.toast("Thanks! In the real site our team would reply within an hour.", {
                    title: "Message sent",
                    type: "success",
                    timeout: 4000
                });
            }, 700);
        });
    }

    DG.pages = DG.pages || {};
    DG.pages.contact = initContact;
})();
