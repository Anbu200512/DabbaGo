(function () {
    "use strict";
    document.querySelectorAll("[data-social-login]").forEach(function (button) {
        button.addEventListener("click", function () {
            var provider = button.getAttribute("data-social-login");
            var account = {
                name: "DabbaGo Member",
                email: "member@" + provider.toLowerCase() + ".demo",
                mobile: "9876543210",
                address: "Flat 302, Sneh Nagar Apartments, Sneh Nagar",
                area: "Andheri West",
                pincode: "400053",
                mealPref: "Lunch",
                signedInAt: new Date().toISOString(),
                demo: true,
                provider: provider
            };
            if (window.DG && DG.auth) DG.auth.signIn(account);
            window.location.href = "dashboard.html";
        });
    });
})();
