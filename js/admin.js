/* DabbaGo standalone operations dashboard (demo data stored locally). */
(function () {
    "use strict";

    var DG = (window.DG = window.DG || {});
    var KEY = "dabbago_admin_dashboard";
    var names = ["Aarav Sharma", "Sneha Menon", "Rohan Kulkarni", "Meera Rao", "Kabir Shah", "Ananya Iyer"];
    var state = load();
    var tabNames = { overview: "Overview", orders: "Orders", customers: "Customers", menu: "Menu & dishes", deliveries: "Deliveries", reports: "Reports" };
    var orders = state.orders;
    var dishes = state.dishes;
    var statusSteps = ["Confirmed", "Preparing", "Out for delivery", "Delivered"];

    function esc(value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }

    function load() {
        var saved;
        try { saved = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { saved = null; }
        if (saved && Array.isArray(saved.orders) && Array.isArray(saved.dishes)) return saved;
        return {
            orders: [
                { id: "DG-2481", name: "Aarav Sharma", meal: "Lunch + Dinner", area: "Andheri West", amount: 3199, status: "Preparing", time: "12:45 PM" },
                { id: "DG-2480", name: "Sneha Menon", meal: "Lunch", area: "Powai", amount: 1899, status: "Out for delivery", time: "12:30 PM" },
                { id: "DG-2479", name: "Rohan Kulkarni", meal: "Weekly Tiffin", area: "Kothrud, Pune", amount: 899, status: "Confirmed", time: "1:00 PM" },
                { id: "DG-2478", name: "Meera Rao", meal: "Full Day", area: "BKC", amount: 4499, status: "Delivered", time: "11:55 AM" },
                { id: "DG-2477", name: "Kabir Shah", meal: "Dinner", area: "Chembur", amount: 1999, status: "Confirmed", time: "7:45 PM" },
                { id: "DG-2476", name: "Ananya Iyer", meal: "Student Saver", area: "Dadar", amount: 1249, status: "Delivered", time: "12:10 PM" }
            ],
            dishes: [
                { name: "Paneer Butter Masala", category: "Curries", price: 110, img: "paneer-butter-masala.jpg", available: true },
                { name: "Chicken Biryani", category: "Rice & Biryani", price: 135, img: "chicken-biryani.jpg", available: true },
                { name: "Masala Dosa with Sambar", category: "Breakfast", price: 55, img: "masala-dosa.jpg", available: true },
                { name: "Mutton Rogan Josh", category: "Curries", price: 165, img: "mutton-rogan-josh.jpg", available: false },
                { name: "Veg Biryani", category: "Rice & Biryani", price: 95, img: "veg-biryani.jpg", available: true },
                { name: "Shrikhand", category: "Desserts", price: 45, img: "shrikhand.jpg", available: true }
            ]
        };
    }

    function save() {
        try { localStorage.setItem(KEY, JSON.stringify({ orders: orders, dishes: dishes })); } catch (e) { /* private browsing */ }
    }

    function money(value) { return "₹" + Number(value || 0).toLocaleString("en-IN"); }
    function icon(name) { return '<i data-lucide="' + name + '"></i>'; }
    function setIcons(root) { if (window.DG && DG.icons) DG.icons(root || document); }
    function host(id) { return document.getElementById(id); }
    function openOrders() { return orders.filter(function (o) { return o.status !== "Delivered"; }).length; }
    function revenue() { return orders.reduce(function (sum, o) { return sum + Number(o.amount || 0); }, 0); }

    function stat(iconName, label, value, sub, tone) {
        return '<article class="ad-stat"><span class="ad-stat-icon ' + (tone || "") + '">' + icon(iconName) + '</span>' +
            '<span class="ad-stat-label">' + esc(label) + '</span><strong>' + esc(value) + '</strong><small>' + esc(sub) + '</small></article>';
    }

    function badge(status) {
        var cls = status.toLowerCase().replace(/\s+/g, "-");
        return '<span class="ad-status is-' + esc(cls) + '"><i></i>' + esc(status) + '</span>';
    }

    function orderRows(list, actionable) {
        return list.map(function (o) {
            return '<tr><td><strong>' + esc(o.id) + '</strong></td><td>' +
                '<span class="ad-customer"><span class="ad-initials">' + esc(o.name.split(" ").map(function (s) { return s[0]; }).join("")) + '</span>' + esc(o.name) + '</span></td>' +
                '<td>' + esc(o.meal) + '</td><td>' + esc(o.area) + '</td><td>' + esc(o.time) + '</td><td>' + money(o.amount) + '</td><td>' +
                (actionable ? '<button type="button" class="ad-status-action" data-order-status="' + esc(o.id) + '" aria-label="Advance order ' + esc(o.id) + ' status">' + badge(o.status) + '</button>' : badge(o.status)) + '</td></tr>';
        }).join("");
    }

    function tableHead() {
        return '<thead><tr><th>Order</th><th>Customer</th><th>Plan / meal</th><th>Area</th><th>Delivery</th><th>Amount</th><th>Status</th></tr></thead>';
    }

    function renderOverview() {
        var panel = host("ad-panel-overview");
        var max = Math.max.apply(null, [1, 36, 52, 43, 68, 58, 76, openOrders() * 10]);
        if (!panel) return;
        panel.innerHTML = '<div class="ad-page-intro"><div><p class="dg-eyebrow">Monday, service overview</p><h1>Good morning, Admin</h1><p>Here’s what’s happening across DabbaGo today.</p></div>' +
            '<button type="button" class="dg-btn dg-btn-outline" data-export-orders>' + icon("download") + 'Export orders</button></div>' +
            '<div class="ad-stats-grid">' +
            stat("receipt", "Today’s orders", orders.length, "+12% vs. yesterday", "is-orange") +
            stat("truck", "Active deliveries", openOrders(), "Across 5 delivery zones", "is-green") +
            stat("indian-rupee", "Revenue today", money(revenue()), "From confirmed orders", "is-brown") +
            stat("users", "Active customers", "1,284", "+8.4% this month", "is-purple") + '</div>' +
            '<div class="ad-overview-grid"><section class="ad-card"><div class="ad-card-heading"><div><h2>Order activity</h2><p>Orders processed this week</p></div><span class="ad-period">This week</span></div>' +
            '<div class="ad-chart" role="img" aria-label="Bar chart showing orders this week">' +
            [36, 52, 43, 68, 58, 76, Math.max(20, openOrders() * 12)].map(function (v, i) {
                return '<div class="ad-chart-col"><div class="ad-chart-track"><span style="height:' + Math.round(v / max * 100) + '%"></span></div><small>' + ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i] + '</small></div>';
            }).join("") + '</div></section>' +
            '<section class="ad-card ad-zone-card"><div class="ad-card-heading"><div><h2>Delivery performance</h2><p>Today across all zones</p></div>' + icon("map-pin") + '</div>' +
            '<div class="ad-performance"><strong>96.8%</strong><span>On-time delivery</span></div><div class="ad-progress"><span style="width:96.8%"></span></div>' +
            '<div class="ad-zone-row"><span>Zone 1 · Andheri–Khar</span><strong>98%</strong></div><div class="ad-zone-row"><span>Zone 2 · Powai–Dadar</span><strong>96%</strong></div><div class="ad-zone-row"><span>Zone 3 · Malad–Navi Mumbai</span><strong>94%</strong></div></section></div>' +
            '<section class="ad-card ad-recent"><div class="ad-card-heading"><div><h2>Recent orders</h2><p>Latest activity from your customers</p></div><button type="button" class="ad-text-button" data-admin-tab="orders">View all ' + icon("arrow-right") + '</button></div>' +
            '<div class="ad-table-wrap"><table class="ad-table">' + tableHead() + '<tbody>' + orderRows(orders.slice(0, 5), true) + '</tbody></table></div></section>';
        setIcons(panel);
    }

    function renderOrders(query) {
        var panel = host("ad-panel-orders");
        if (!panel) return;
        query = (query || "").trim().toLowerCase();
        var filtered = orders.filter(function (o) { return [o.id, o.name, o.area, o.meal, o.status].join(" ").toLowerCase().indexOf(query) > -1; });
        panel.innerHTML = '<div class="ad-page-intro"><div><p class="dg-eyebrow">Order management</p><h1>Orders <span class="ad-count-pill">' + orders.length + '</span></h1><p>Track every meal from confirmation to delivery.</p></div><button type="button" class="dg-btn dg-btn-outline" data-export-orders>' + icon("download") + 'Export CSV</button></div>' +
            '<section class="ad-card"><div class="ad-toolbar"><label class="ad-search">' + icon("search") + '<input id="ad-order-search" type="search" value="' + esc(query) + '" placeholder="Search order, customer, area…" aria-label="Search orders"></label><span class="ad-result-count">' + filtered.length + ' orders</span></div>' +
            '<div class="ad-table-wrap"><table class="ad-table">' + tableHead() + '<tbody>' + (filtered.length ? orderRows(filtered, true) : '<tr><td colspan="7" class="ad-empty-cell">No orders match your search.</td></tr>') + '</tbody></table></div></section>';
        setIcons(panel);
    }

    function renderCustomers(query) {
        var panel = host("ad-panel-customers");
        if (!panel) return;
        query = (query || "").trim().toLowerCase();
        var people = names.map(function (name, i) {
            var match = orders.filter(function (o) { return o.name === name; })[0];
            return { name: name, email: name.toLowerCase().replace(/\s/g, ".") + "@example.com", area: match ? match.area : ["Powai", "BKC", "Khar"][i % 3], plan: match ? match.meal : "Monthly Tiffin", status: i === 4 ? "Paused" : "Active" };
        }).filter(function (p) { return [p.name, p.email, p.area, p.plan].join(" ").toLowerCase().indexOf(query) > -1; });
        panel.innerHTML = '<div class="ad-page-intro"><div><p class="dg-eyebrow">Customer directory</p><h1>Customers</h1><p>Manage subscribers and see their current plan.</p></div><span class="ad-period">' + people.length + ' shown</span></div>' +
            '<section class="ad-card"><div class="ad-toolbar"><label class="ad-search">' + icon("search") + '<input id="ad-customer-search" type="search" value="' + esc(query) + '" placeholder="Search customers…" aria-label="Search customers"></label></div>' +
            '<div class="ad-table-wrap"><table class="ad-table"><thead><tr><th>Customer</th><th>Email</th><th>Area</th><th>Current plan</th><th>Status</th></tr></thead><tbody>' +
            people.map(function (p) { return '<tr><td><span class="ad-customer"><span class="ad-initials">' + esc(p.name.split(" ").map(function (s) { return s[0]; }).join("")) + '</span><strong>' + esc(p.name) + '</strong></span></td><td>' + esc(p.email) + '</td><td>' + esc(p.area) + '</td><td>' + esc(p.plan) + '</td><td>' + badge(p.status) + '</td></tr>'; }).join("") +
            '</tbody></table></div></section>';
        setIcons(panel);
    }

    function renderMenu() {
        var panel = host("ad-panel-menu");
        if (!panel) return;
        panel.innerHTML = '<div class="ad-page-intro"><div><p class="dg-eyebrow">Kitchen catalogue</p><h1>Menu &amp; dishes</h1><p>Manage the dishes currently shown to subscribers.</p></div><button type="button" class="dg-btn dg-btn-primary" data-add-dish>' + icon("plus") + 'Add a dish</button></div>' +
            '<div class="ad-dish-grid">' + dishes.map(function (d, i) { return '<article class="ad-dish-card"><img src="assets/images/' + encodeURIComponent(d.img) + '" alt="" loading="lazy"><div class="ad-dish-info"><span>' + esc(d.category) + '</span><h2>' + esc(d.name) + '</h2><p>' + money(d.price) + ' <span>per serving</span></p><button type="button" class="ad-toggle ' + (d.available ? "is-on" : "") + '" data-dish-toggle="' + i + '" aria-pressed="' + (d.available ? "true" : "false") + '"><i></i>' + (d.available ? "Available" : "Unavailable") + '</button></div></article>'; }).join("") + '</div>';
        setIcons(panel);
    }

    function renderDeliveries() {
        var panel = host("ad-panel-deliveries");
        if (!panel) return;
        var active = orders.filter(function (o) { return o.status !== "Delivered"; });
        panel.innerHTML = '<div class="ad-page-intro"><div><p class="dg-eyebrow">Dispatch &amp; routes</p><h1>Deliveries</h1><p>Keep today’s riders and meal routes on schedule.</p></div><span class="ad-live"><i></i>' + active.length + ' active routes</span></div>' +
            '<div class="ad-route-grid"><article class="ad-route-card"><span class="ad-route-icon is-orange">' + icon("bike") + '</span><div><small>Zone 1</small><h2>Andheri West · Khar</h2><p>12 riders · 34 stops</p></div><strong>98%</strong></article>' +
            '<article class="ad-route-card"><span class="ad-route-icon is-green">' + icon("map") + '</span><div><small>Zone 2</small><h2>Powai · BKC · Dadar</h2><p>8 riders · 26 stops</p></div><strong>96%</strong></article>' +
            '<article class="ad-route-card"><span class="ad-route-icon is-purple">' + icon("navigation") + '</span><div><small>Zone 3</small><h2>Malad · Thane · Navi Mumbai</h2><p>11 riders · 41 stops</p></div><strong>94%</strong></article></div>' +
            '<section class="ad-card ad-recent"><div class="ad-card-heading"><div><h2>Delivery queue</h2><p>Update a delivery as it moves through the route.</p></div></div><div class="ad-table-wrap"><table class="ad-table">' + tableHead() + '<tbody>' + orderRows(active, true) + '</tbody></table></div></section>';
        setIcons(panel);
    }

    function renderReports() {
        var panel = host("ad-panel-reports");
        if (!panel) return;
        var delivered = orders.filter(function (o) { return o.status === "Delivered"; }).length;
        var avg = orders.length ? Math.round(revenue() / orders.length) : 0;
        panel.innerHTML = '<div class="ad-page-intro"><div><p class="dg-eyebrow">Business insights</p><h1>Reports</h1><p>A quick snapshot of orders, revenue and delivery completion.</p></div><span class="ad-period">Today</span></div>' +
            '<div class="ad-stats-grid">' +
            stat("receipt", "Orders recorded", orders.length, "Across all meal plans", "is-orange") +
            stat("indian-rupee", "Gross order value", money(revenue()), "Based on listed orders", "is-green") +
            stat("circle-check", "Delivered", delivered, orders.length ? Math.round(delivered / orders.length * 100) + "% completed" : "No orders yet", "is-brown") +
            stat("wallet", "Average order", money(avg), "Per order", "is-purple") + '</div>' +
            '<section class="ad-card ad-report-card"><div class="ad-card-heading"><div><h2>Order status breakdown</h2><p>Live totals for the current demo order list</p></div></div>' +
            statusSteps.map(function (status) {
                var count = orders.filter(function (o) { return o.status === status; }).length;
                var width = orders.length ? Math.round(count / orders.length * 100) : 0;
                return '<div class="ad-report-row"><div>' + badge(status) + '<strong>' + count + '</strong></div><div class="ad-progress"><span style="width:' + width + '%"></span></div></div>';
            }).join("") + '</section>' +
            '<section class="ad-card ad-recent"><div class="ad-card-heading"><div><h2>Popular dishes</h2><p>Current catalogue and availability</p></div></div>' +
            '<div class="ad-report-dishes">' + dishes.slice(0, 4).map(function (d) { return '<div><img src="assets/images/' + encodeURIComponent(d.img) + '" alt="" loading="lazy"><span><strong>' + esc(d.name) + '</strong><small>' + (d.available ? "Available" : "Unavailable") + '</small></span></div>'; }).join("") + '</div></section>';
        setIcons(panel);
    }

    function render(tab) {
        if (tab === "overview") renderOverview();
        else if (tab === "orders") renderOrders();
        else if (tab === "customers") renderCustomers();
        else if (tab === "menu") renderMenu();
        else if (tab === "deliveries") renderDeliveries();
        else if (tab === "reports") renderReports();
    }

    function switchTab(tab) {
        if (!tabNames[tab]) tab = "overview";
        Object.keys(tabNames).forEach(function (key) {
            var panel = host("ad-panel-" + key);
            if (panel) panel.classList.toggle("is-hidden", key !== tab);
        });
        Array.prototype.forEach.call(document.querySelectorAll("[data-admin-tab]"), function (button) {
            var active = button.dataset.adminTab === tab;
            button.classList.toggle("is-active", active);
            if (button.tagName === "BUTTON") button.setAttribute("aria-current", active ? "page" : "false");
        });
        var label = host("ad-page-label");
        if (label) label.textContent = tabNames[tab];
        try { history.replaceState(null, "", "#" + tab); } catch (e) { /* ignore */ }
        render(tab);
    }

    function updateCounters() {
        var count = host("ad-open-count");
        if (count) count.textContent = openOrders();
    }

    function exportOrders() {
        var lines = [["Order", "Customer", "Plan / meal", "Area", "Time", "Amount", "Status"]];
        orders.forEach(function (o) { lines.push([o.id, o.name, o.meal, o.area, o.time, o.amount, o.status]); });
        var csv = lines.map(function (row) { return row.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(","); }).join("\r\n");
        var link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
        link.download = "dabbago-orders.csv";
        link.click();
        URL.revokeObjectURL(link.href);
    }

    function init() {
        if (!host("ad-panel-overview")) return;
        document.addEventListener("click", function (event) {
            if (event.target.closest("[data-admin-signout]")) {
                if (DG.auth && DG.auth.signOut) DG.auth.signOut();
                window.location.href = "login.html";
                return;
            }
            var button = event.target.closest("[data-admin-tab]");
            if (button && button.tagName === "BUTTON") { switchTab(button.dataset.adminTab); return; }
            button = event.target.closest("[data-order-status]");
            if (button) {
                var order = orders.filter(function (o) { return o.id === button.dataset.orderStatus; })[0];
                if (order) { order.status = statusSteps[(statusSteps.indexOf(order.status) + 1) % statusSteps.length]; save(); updateCounters(); switchTab((window.location.hash || "#overview").slice(1)); }
                return;
            }
            button = event.target.closest("[data-dish-toggle]");
            if (button) { dishes[Number(button.dataset.dishToggle)].available = !dishes[Number(button.dataset.dishToggle)].available; save(); renderMenu(); return; }
            if (event.target.closest("[data-export-orders]")) { exportOrders(); return; }
            if (event.target.closest("[data-add-dish]")) {
                var name = window.prompt("Dish name");
                if (name && name.trim()) { dishes.push({ name: name.trim(), category: "New dish", price: 0, img: "veg-thali.jpg", available: true }); save(); renderMenu(); }
            }
        });
        document.addEventListener("input", function (event) {
            if (event.target.id === "ad-order-search" || event.target.id === "ad-customer-search") {
                var id = event.target.id;
                var value = event.target.value;
                var position = event.target.selectionStart;
                if (id === "ad-order-search") renderOrders(value);
                else renderCustomers(value);
                var replacement = host(id);
                if (replacement) {
                    replacement.focus();
                    if (position != null) replacement.setSelectionRange(position, position);
                }
            }
        });
        updateCounters();
        switchTab((window.location.hash || "#overview").slice(1));
    }

    DG.pages = DG.pages || {};
    DG.pages.admin = init;
})();
