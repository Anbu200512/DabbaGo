/* ==========================================================================
   DabbaGo — menu.js
   Weekly tiffin menu data + all Menu page behaviour
   (day / meal / category filters, search, favourites).
   ========================================================================== */

(function () {
    "use strict";

    var DG = (window.DG = window.DG || {});
    DG.data = DG.data || {};

    /* ------------------------------------------------------------------
       Categories
       ------------------------------------------------------------------ */

    var CATEGORIES = [
        { id: "breakfast", label: "Breakfast", icon: "coffee" },
        { id: "thali", label: "Thali & Combo", icon: "hand-platter" },
        { id: "curry", label: "Curries", icon: "soup" },
        { id: "rice", label: "Rice & Biryani", icon: "wheat" },
        { id: "bread", label: "Roti & Paratha", icon: "layers" },
        { id: "snack", label: "Snacks & Chaat", icon: "cookie" },
        { id: "dessert", label: "Sweets", icon: "cake-slice" },
        { id: "beverage", label: "Drinks", icon: "cup-soda" }
    ];

    var MEAL_TYPES = [
        { id: "Breakfast", label: "Breakfast", icon: "coffee", time: "7:00 – 8:00 AM" },
        { id: "Lunch", label: "Lunch", icon: "hand-platter", time: "12:30 – 1:30 PM" },
        { id: "Dinner", label: "Dinner", icon: "soup", time: "7:30 – 8:30 PM" }
    ];

    /* ------------------------------------------------------------------
       Week definition
       ------------------------------------------------------------------ */

    var DAYS = [
        { key: "Mon", label: "Monday", short: "Mon" },
        { key: "Tue", label: "Tuesday", short: "Tue" },
        { key: "Wed", label: "Wednesday", short: "Wed" },
        { key: "Thu", label: "Thursday", short: "Thu" },
        { key: "Fri", label: "Friday", short: "Fri" },
        { key: "Sat", label: "Saturday", short: "Sat" },
        { key: "Sun", label: "Sunday", short: "Sun" }
    ];

    /* DAYS is ordered Mon..Sun, while Date#getDay() is 0=Sun..6=Sat, so shift
       the index by one to land on the right entry */
    function todayKey() {
        return DAYS[(new Date().getDay() + 6) % 7].key;
    }

    /* ------------------------------------------------------------------
       Weekly menu
       Fields:  n = name, d = description, p = price (INR),
                v = 1 veg / 0 non-veg, c = category, k = kcal, img = file
       ------------------------------------------------------------------ */

    var MENUS = {
        Mon: {
            Breakfast: [
                { n: "Masala Dosa with Sambar", d: "Crisp dosa folded over a spiced potato masala, with hot sambar and coconut chutney.", p: 55, v: 1, c: "breakfast", k: 450, img: "masala-dosa.jpg" },
                { n: "Rava Upma with Peanuts", d: "Semolina upma tempered with mustard and curry leaves, garnished with roasted peanuts.", p: 40, v: 1, c: "breakfast", k: 300, img: "rava-upma.jpg" }
            ],
            Lunch: [
                { n: "Aloo Bhature (2 pc)", d: "Crisp fried bread served with spiced potato and tangy chutney.", p: 65, v: 1, c: "snack", k: 560, img: "pav-bhaji.jpg" }
            ],
            Dinner: [
                { n: "Paneer Butter Masala", d: "Soft paneer cubes in a silky tomato and cashew gravy, finished with white butter.", p: 110, v: 1, c: "curry", k: 520, img: "paneer-butter-masala.jpg" },
                { n: "Tandoori Roti (3 pc)", d: "Hand-rolled whole wheat rotis brushed with ghee.", p: 25, v: 1, c: "bread", k: 290, img: "chapati.jpg" },
                { n: "Cabbage Poriyal", d: "Shredded cabbage tossed with mustard, curry leaves and grated coconut.", p: 60, v: 1, c: "curry", k: 160, img: "cabbage-poriyal.jpg" },
                { n: "Chicken Curry", d: "Bone-less chicken slow-cooked in a light onion, tomato and ginger gravy.", p: 125, v: 0, c: "curry", k: 480, img: "chicken-curry.jpg" },
                { n: "Kachumber Salad", d: "Cucumber, tomato and onion with lemon, a cool finish to the meal.", p: 35, v: 1, c: "thali", k: 90, img: "fresh-salad.jpg" },
                { n: "Shrikhand", d: "Creamy strained yoghurt delicately flavoured with cardamom and saffron.", p: 45, v: 1, c: "dessert", k: 240, img: "shrikhand.jpg" },
                { n: "Chicken Biryani", d: "Fragrant basmati layered with spiced chicken, herbs and golden fried onions.", p: 135, v: 0, c: "rice", k: 640, img: "chicken-biryani.jpg" },
                { n: "Mutton Rogan Josh", d: "Tender mutton slow-cooked in a rich Kashmiri chilli and yoghurt gravy.", p: 165, v: 0, c: "curry", k: 610, img: "mutton-rogan-josh.jpg" },
                { n: "Vegetable Biryani", d: "Aromatic basmati layered with seasonal vegetables, mint and warm spices.", p: 95, v: 1, c: "rice", k: 560, img: "veg-biryani.jpg" }
            ]
        },

        Tue: {
            Breakfast: [
                { n: "Idli & Sambar (3 pc)", d: "Steamed rice-lentil cakes with sambar and a small bowl of coconut chutney.", p: 45, v: 1, c: "breakfast", k: 260, img: "idli-sambar.jpg" },
                { n: "Paneer Paratha (2 pc)", d: "Stuffed whole wheat paratha with mint chutney and curd.", p: 55, v: 1, c: "breakfast", k: 430, img: "paneer-paratha.jpg" },
                { n: "Egg Bhurji with Paratha", d: "Scrambled eggs with onion, green chilli and coriander, paired with two parathas.", p: 65, v: 0, c: "breakfast", k: 480, img: "egg-bhurji.jpg" },
                { n: "Masala Chai", d: "Ginger and cardamom tea boiled with milk.", p: 15, v: 1, c: "beverage", k: 90, img: "masala-chai.jpg" }
            ],
            Lunch: [
                { n: "Rajma Masala", d: "Kidney beans slow-cooked in a thick onion-tomato masala.", p: 80, v: 1, c: "curry", k: 450, img: "rajma.jpg" },
                { n: "Steamed Rice", d: "Plain steamed basmati rice.", p: 50, v: 1, c: "rice", k: 400, img: "plain-rice.jpg" },
                { n: "Chana Masala", d: "Chickpeas in a tangy onion and ginger gravy with amchur.", p: 70, v: 1, c: "curry", k: 340, img: "chana-masala.jpg" },
                { n: "Dahi / Chaas", d: "Set curd served chilled, whisked on request.", p: 25, v: 1, c: "thali", k: 110, img: "dahi.jpg" },
                { n: "Egg Curry", d: "Boiled eggs simmered in a mild onion-tomato masala.", p: 85, v: 0, c: "curry", k: 390, img: "egg-curry.jpg" }
            ],
            Dinner: [
                { n: "Chole Bhature", d: "Classic chickpeas with a fluffy fried bread, served with pickles and onion.", p: 95, v: 1, c: "thali", k: 620, img: "chole-bhature.jpg" },
                { n: "Kachori (2 pc) & Chutney", d: "Crisp flaky kachori with tamarind and mint chutney.", p: 35, v: 1, c: "snack", k: 380, img: "kachori.jpg" },
                { n: "Fresh Buttermilk", d: "Chilled chaas with a pinch of jeera and curry leaf.", p: 20, v: 1, c: "beverage", k: 60, img: "buttermilk.jpg" },
                { n: "Mutton Rogan Josh", d: "Slow-cooked mutton in a Kashmiri chilli and yoghurt gravy.", p: 165, v: 0, c: "curry", k: 610, img: "mutton-rogan-josh.jpg" },
                { n: "Beetroot & Cucumber Salad", d: "Shredded beetroot with cucumber, lemon and chaat masala.", p: 40, v: 1, c: "thali", k: 110, img: "beetroot-salad.jpg" },
                { n: "Rice Kheer", d: "Slow-simmered rice pudding finished with cardamom and nuts.", p: 40, v: 1, c: "dessert", k: 260, img: "rice-kheer.jpg" }
            ]
        },

        Wed: {
            Breakfast: [
                { n: "Aloo Paratha with Curd", d: "Two stuffed parathas with whisked curd and pickle.", p: 55, v: 1, c: "breakfast", k: 440, img: "aloo-paratha.jpg" },
                { n: "Bajra Khichdi", d: "Pearl millet cooked soft with dal, tempered with ghee and jeera.", p: 50, v: 1, c: "breakfast", k: 350, img: "bajra-khichdi.jpg" },
                { n: "Puri Bhaji (3 pc)", d: "Fluffy puris with spiced potato bhaji and a coriander chutney.", p: 60, v: 1, c: "breakfast", k: 520, img: "puri-bhaji.jpg" },
                { n: "Filter Coffee", d: "Traditional South Indian decoction blended with hot milk.", p: 20, v: 1, c: "beverage", k: 120, img: "filter-coffee.jpg" }
            ],
            Lunch: [
                { n: "Aloo Gobi Curry", d: "Potato and cauliflower in a light mustard and tomato masala.", p: 75, v: 1, c: "curry", k: 300, img: "aloo-gobi.jpg" },
                { n: "Chawal (Plain)", d: "Plain steamed rice served with dal.", p: 50, v: 1, c: "rice", k: 400, img: "plain-rice.jpg" },
                { n: "Kadhi Pakora", d: "Gram-flour dumplings in a tangy kadhi with a curry leaf temper.", p: 65, v: 1, c: "curry", k: 280, img: "kadhi-pakora.jpg" },
                { n: "Papad & Pickle", d: "Roasted papad with a house mango and amla pickle.", p: 30, v: 1, c: "snack", k: 140, img: "papad.jpg" },
                { n: "Mixed Veg Curry", d: "A seasonal mix of five vegetables in a homestyle masala.", p: 85, v: 1, c: "curry", k: 320, img: "mixed-veg-curry.jpg" }
            ],
            Dinner: [
                { n: "Palak Paneer", d: "Cottage cheese in a smooth spinach and fenugreek gravy.", p: 105, v: 1, c: "curry", k: 460, img: "palak-paneer.jpg" },
                { n: "Tandoori Roti (3 pc)", d: "Hand-rolled rotis brushed with ghee.", p: 25, v: 1, c: "bread", k: 290, img: "chapati.jpg" },
                { n: "Mushroom Masala", d: "Button mushrooms with onion, garlic and a peppery masala.", p: 90, v: 1, c: "curry", k: 260, img: "mushroom-masala.jpg" },
                { n: "Gulab Jamun (1 pc)", d: "Warm milk dumplings soaked in cardamom syrup.", p: 30, v: 1, c: "dessert", k: 220, img: "gulab-jamun.jpg" },
                { n: "Tandoori Chicken", d: "Yoghurt-marinated chicken roasted in the tandoor, served with onion.", p: 155, v: 0, c: "curry", k: 430, img: "tandoori-chicken.jpg" },
                { n: "Samosa (2 pc)", d: "Crisp pastry filled with spiced potato and peas, served with chutney.", p: 35, v: 1, c: "snack", k: 320, img: "samosa.jpg" }
            ]
        },

        Thu: {
            Breakfast: [
                { n: "Poha with Sev & Lemon", d: "Flattened rice with peanuts, sev and a squeeze of lemon.", p: 40, v: 1, c: "breakfast", k: 320, img: "poha.jpg" },
                { n: "Idli & Sambar (3 pc)", d: "Steamed idli with sambar and coconut chutney.", p: 45, v: 1, c: "breakfast", k: 260, img: "idli-sambar.jpg" },
                { n: "Masala Chai", d: "Ginger and cardamom tea boiled with milk.", p: 15, v: 1, c: "beverage", k: 90, img: "masala-chai.jpg" },
                { n: "Bread Omelette (2 slices)", d: "Two slices with a soft masala omelette and ketchup.", p: 50, v: 0, c: "breakfast", k: 390, img: "bread-omelette.jpg" }
            ],
            Lunch: [
                { n: "Dal Tadka", d: "Yellow lentils with a jeera, garlic and tomato temper.", p: 70, v: 1, c: "curry", k: 380, img: "dal-tadka.jpg" },
                { n: "Jeera Rice", d: "Basmati tempered with cumin and a little ghee.", p: 55, v: 1, c: "rice", k: 420, img: "jeera-rice.jpg" },
                { n: "Matar Paneer", d: "Green peas and paneer in a light ginger gravy.", p: 95, v: 1, c: "curry", k: 400, img: "matar-paneer.jpg" },
                { n: "Boondi Raita", d: "Chilled curd with boondi, mint and roasted cumin.", p: 40, v: 1, c: "thali", k: 130, img: "boondi-raita.jpg" },
                { n: "Paneer Bhurji", d: "Crumbled paneer tossed with tomato, onion and coriander.", p: 100, v: 1, c: "curry", k: 420, img: "paneer-bhurji.jpg" }
            ],
            Dinner: [
                { n: "Paneer Tikka Masala", d: "Charred paneer in a smoky onion-tomato masala gravy.", p: 110, v: 1, c: "curry", k: 540, img: "paneer-tikka-masala.jpg" },
                { n: "Tandoori Roti (3 pc)", d: "Hand-rolled rotis brushed with ghee.", p: 25, v: 1, c: "bread", k: 290, img: "chapati.jpg" },
                { n: "Baingan Bharta", d: "Roasted aubergine mashed with tomato, onion and green chilli.", p: 70, v: 1, c: "curry", k: 190, img: "baingan-bharta.jpg" },
                { n: "Chicken Biryani", d: "Fragrant basmati layered with spiced chicken and fried onion.", p: 135, v: 0, c: "rice", k: 640, img: "chicken-biryani.jpg" },
                { n: "Kachumber Salad", d: "Cucumber, tomato and onion dressed with lemon.", p: 35, v: 1, c: "thali", k: 90, img: "fresh-salad.jpg" },
                { n: "Coconut Barfi", d: "Soft coconut fudge lightly scented with cardamom.", p: 35, v: 1, c: "dessert", k: 210, img: "coconut-barfi.jpg" }
            ]
        },

        Fri: {
            Breakfast: [
                { n: "Masala Dosa with Sambar", d: "Crisp dosa with spiced potato, sambar and chutney.", p: 55, v: 1, c: "breakfast", k: 450, img: "masala-dosa.jpg" },
                { n: "Rava Upma with Peanuts", d: "Semolina upma tempered with mustard and curry leaves.", p: 40, v: 1, c: "breakfast", k: 300, img: "rava-upma.jpg" },
                { n: "Filter Coffee", d: "South Indian decoction blended with hot milk.", p: 20, v: 1, c: "beverage", k: 120, img: "filter-coffee.jpg" },
                { n: "Egg Bhurji with Paratha", d: "Masala scrambled eggs served with two parathas.", p: 65, v: 0, c: "breakfast", k: 480, img: "egg-bhurji.jpg" }
            ],
            Lunch: [
                { n: "Chole Bhature", d: "Chickpeas with fluffy bhature, pickles and onion.", p: 95, v: 1, c: "thali", k: 620, img: "chole-bhature.jpg" },
                { n: "Steamed Rice", d: "Plain steamed basmati rice.", p: 50, v: 1, c: "rice", k: 400, img: "plain-rice.jpg" },
                { n: "Bhindi Masala", d: "Bitter gourd with onion, tomato and garam masala.", p: 75, v: 1, c: "curry", k: 210, img: "bhindi-masala.jpg" },
                { n: "Dahi / Chaas", d: "Set curd served chilled.", p: 25, v: 1, c: "thali", k: 110, img: "dahi.jpg" },
                { n: "Butter Chicken", d: "Tandoori chicken in a rich tomato and butter gravy.", p: 140, v: 0, c: "curry", k: 620, img: "butter-chicken.jpg" }
            ],
            Dinner: [
                { n: "Palak Paneer", d: "Paneer cubes in a smooth spinach and fenugreek gravy.", p: 105, v: 1, c: "curry", k: 460, img: "palak-paneer.jpg" },
                { n: "Tandoori Roti (3 pc)", d: "Hand-rolled rotis brushed with ghee.", p: 25, v: 1, c: "bread", k: 290, img: "chapati.jpg" },
                { n: "Cabbage Poriyal", d: "Shredded cabbage tempered with mustard and coconut.", p: 60, v: 1, c: "curry", k: 160, img: "cabbage-poriyal.jpg" },
                { n: "Goan Fish Curry", d: "Kingfish in a coconut, kokum and red chilli gravy.", p: 145, v: 0, c: "curry", k: 470, img: "goan-fish-curry.jpg" },
                { n: "Papad & Pickle", d: "Roasted papad with a house mango pickle.", p: 30, v: 1, c: "snack", k: 140, img: "papad.jpg" },
                { n: "Rasmalai", d: "Soft cottage-cheese dumplings served in fragrant saffron milk.", p: 50, v: 1, c: "dessert", k: 280, img: "rasmalai.jpg" }
            ]
        },

        Sat: {
            Breakfast: [
                { n: "Puri Bhaji (3 pc)", d: "Fluffy puris with spiced potato bhaji.", p: 60, v: 1, c: "breakfast", k: 520, img: "puri-bhaji.jpg" },
                { n: "Aloo Paratha with Curd", d: "Two stuffed parathas with whisked curd.", p: 55, v: 1, c: "breakfast", k: 440, img: "aloo-paratha.jpg" },
                { n: "Besan Chilla & Green Chutney", d: "Gram flour rolls with onion and coriander chutney.", p: 45, v: 1, c: "breakfast", k: 280, img: "besan-chilla.jpg" },
                { n: "Masala Chai", d: "Ginger and cardamom tea boiled with milk.", p: 15, v: 1, c: "beverage", k: 90, img: "masala-chai.jpg" }
            ],
            Lunch: [
                { n: "Veg Biryani", d: "Fragrant basmati with seasonal vegetables, mint and fried onion.", p: 95, v: 1, c: "rice", k: 560, img: "veg-biryani.jpg" },
                { n: "Boondi Raita", d: "Chilled curd with boondi and roasted cumin.", p: 40, v: 1, c: "thali", k: 130, img: "boondi-raita.jpg" },
                { n: "Papad & Pickle", d: "Roasted papad with a house mango and amla pickle.", p: 30, v: 1, c: "snack", k: 140, img: "papad.jpg" },
                { n: "Kachumber Salad", d: "Cucumber, tomato and onion with lemon.", p: 35, v: 1, c: "thali", k: 90, img: "fresh-salad.jpg" },
                { n: "Dal Tadka", d: "Yellow lentils with a jeera and tomato temper.", p: 70, v: 1, c: "curry", k: 380, img: "dal-tadka.jpg" }
            ],
            Dinner: [
                { n: "Mixed Veg Curry", d: "A seasonal mix of five vegetables in a homestyle masala.", p: 85, v: 1, c: "curry", k: 320, img: "mixed-veg-curry.jpg" },
                { n: "Chapati (3 pc)", d: "Hand-rolled whole wheat rotis.", p: 25, v: 1, c: "bread", k: 290, img: "chapati.jpg" },
                { n: "Momos (6 pc) with Sauce", d: "Steamed vegetable momos with a fiery red chutney.", p: 70, v: 1, c: "snack", k: 340, img: "momos.jpg" },
                { n: "Sheera Halwa", d: "Semolina halwa with cardamom, nuts and ghee.", p: 45, v: 1, c: "dessert", k: 330, img: "sheera-halwa.jpg" },
                { n: "Fresh Lime Soda", d: "Chilled lime with soda and a pinch of salt.", p: 25, v: 1, c: "beverage", k: 90, img: "lime-soda.jpg" },
                { n: "Pani Puri (6 pc)", d: "Crisp puris with tangy, spiced water and potato filling.", p: 45, v: 1, c: "snack", k: 250, img: "pani-puri.jpg" }
            ]
        },

        Sun: {
            Breakfast: [
                { n: "Idli & Sambar (3 pc)", d: "Steamed idli with sambar and coconut chutney.", p: 45, v: 1, c: "breakfast", k: 260, img: "idli-sambar.jpg" },
                { n: "Poha with Sev & Lemon", d: "Flattened rice with peanuts, sev and lemon.", p: 40, v: 1, c: "breakfast", k: 320, img: "poha.jpg" },
                { n: "Bajra Khichdi", d: "Pearl millet cooked soft with dal and ghee.", p: 50, v: 1, c: "breakfast", k: 350, img: "bajra-khichdi.jpg" },
                { n: "Filter Coffee", d: "South Indian decoction blended with hot milk.", p: 20, v: 1, c: "beverage", k: 120, img: "filter-coffee.jpg" }
            ],
            Lunch: [
                { n: "Goan Fish Curry", d: "Kingfish in a coconut, kokum and red chilli gravy.", p: 145, v: 0, c: "curry", k: 470, img: "goan-fish-curry.jpg" },
                { n: "Steamed Rice", d: "Plain steamed basmati rice.", p: 50, v: 1, c: "rice", k: 400, img: "plain-rice.jpg" },
                { n: "Chana Masala", d: "Chickpeas in a tangy onion and ginger gravy.", p: 70, v: 1, c: "curry", k: 340, img: "chana-masala.jpg" },
                { n: "Boondi Raita", d: "Chilled curd with boondi and mint.", p: 40, v: 1, c: "thali", k: 130, img: "boondi-raita.jpg" },
                { n: "Fresh Salad", d: "Cucumber, tomato, onion and lemon.", p: 35, v: 1, c: "thali", k: 90, img: "fresh-salad.jpg" }
            ],
            Dinner: [
                { n: "Paneer Butter Masala", d: "Paneer cubes in a silky tomato and cashew gravy.", p: 110, v: 1, c: "curry", k: 520, img: "paneer-butter-masala.jpg" },
                { n: "Chapati (3 pc)", d: "Hand-rolled whole wheat rotis.", p: 25, v: 1, c: "bread", k: 290, img: "chapati.jpg" },
                { n: "Aloo Gobi Curry", d: "Potato and cauliflower in a mustard-tomato masala.", p: 75, v: 1, c: "curry", k: 300, img: "aloo-gobi.jpg" },
                { n: "Gajar Ka Halwa", d: "Carrot halwa cooked in milk with cardamom and nuts.", p: 50, v: 1, c: "dessert", k: 300, img: "gajar-halwa.jpg" },
                { n: "Basundi", d: "Thickened sweet milk served chilled in a clay cup.", p: 40, v: 1, c: "dessert", k: 260, img: "basundi.jpg" },
                { n: "Papadi Chaat", d: "Crisp papadi topped with yoghurt, chutneys and chaat masala.", p: 50, v: 1, c: "snack", k: 290, img: "papadi-chaat.jpg" }
            ]
        }
    };

    /* ------------------------------------------------------------------
       Flatten into a single searchable list
       ------------------------------------------------------------------ */

    var MEALS = [];
    DAYS.forEach(function (day) {
        var byMeal = MENUS[day.key] || {};
        MEAL_TYPES.forEach(function (mt) {
            (byMeal[mt.id] || []).forEach(function (item, i) {
                MEALS.push({
                    id: (day.key + "-" + mt.id + "-" + i).toLowerCase(),
                    day: day.key,
                    dayLabel: day.label,
                    meal: mt.id,
                    name: item.n,
                    desc: item.d,
                    price: item.p,
                    veg: !!item.v,
                    cat: item.c,
                    kcal: item.k,
                    img: item.img,
                    image: "assets/images/" + item.img
                });
            });
        });
    });

    DG.data.days = DAYS;
    DG.data.mealTypes = MEAL_TYPES;
    DG.data.categories = CATEGORIES;
    DG.data.meals = MEALS;
    DG.data.todayKey = todayKey;
    DG.data.byDay = function (key) {
        return MEALS.filter(function (m) { return m.day === key; });
    };
    DG.data.byId = function (id) {
        for (var i = 0; i < MEALS.length; i++) if (MEALS[i].id === id) return MEALS[i];
        return null;
    };
    DG.data.catLabel = function (id) {
        for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i].id === id) return CATEGORIES[i].label;
        return id;
    };

    /* ==================================================================
       Menu page
       ================================================================== */

    var state = {
        day: "today",
        meal: "all",
        cat: "all",
        veg: "all",
        q: "",
        favOnly: false,
        sort: "default"
    };

    var els = {};

    function readUrl() {
        var p = new URLSearchParams(window.location.search);
        var day = p.get("day");
        var meal = p.get("meal");
        if (day) state.day = day.toLowerCase() === "today" ? "today" : day;
        if (meal) state.meal = meal;
    }

    function writeUrl() {
        var p = new URLSearchParams();
        if (state.day && state.day !== "today") p.set("day", state.day);
        if (state.meal && state.meal !== "all") p.set("meal", state.meal);
        var q = p.toString();
        window.history.replaceState(null, "", q ? "?" + q : window.location.pathname);
    }

    function effectiveDay() {
        return state.day === "today" ? todayKey() : state.day;
    }

    /* ---- filter chips ---- */

    function buildDayChips() {
        if (!els.dayChips) return;
        var today = todayKey();
        var html = ['<button type="button" class="dg-chip" data-day="today">' +
            '<i data-lucide="sun"></i>Today</button>'];
        html = html.concat(
            DAYS.map(function (d) {
                var isToday = d.key === today;
                return (
                    '<button type="button" class="dg-chip" data-day="' + d.key + '"' +
                    (isToday ? ' title="Today"' : "") + ">" +
                    (isToday
                        ? '<span aria-hidden="true" style="width:.4rem;height:.4rem;border-radius:50%;background:currentColor"></span>'
                        : "") +
                    d.short + "</button>"
                );
            })
        );
        els.dayChips.innerHTML = html.join("");
    }

    function buildMealChips() {
        if (!els.mealChips) return;
        els.mealChips.innerHTML = ['<button type="button" class="dg-chip" data-meal="all">' +
            '<i data-lucide="layers"></i>All meals</button>']
            .concat(
                MEAL_TYPES.map(function (m) {
                    return (
                        '<button type="button" class="dg-chip" data-meal="' + m.id + '">' +
                        '<i data-lucide="' + m.icon + '"></i>' + m.label +
                        '<span class="dg-chip-sub">' + m.time + "</span></button>"
                    );
                })
            )
            .join("");
    }

    function buildCatChips() {
        if (!els.catChips) return;
        els.catChips.innerHTML = ['<button type="button" class="dg-chip" data-cat="all">' +
            '<i data-lucide="utensils-crossed"></i>All categories</button>']
            .concat(
                CATEGORIES.map(function (c) {
                    return (
                        '<button type="button" class="dg-chip" data-cat="' + c.id + '">' +
                        '<i data-lucide="' + c.icon + '"></i>' + c.label + "</button>"
                    );
                })
            )
            .concat(['<button type="button" class="dg-chip" data-cat="__fav">' +
                '<i data-lucide="heart"></i>Favourites</button>'])
            .join("");
    }

    function syncChips() {
        if (els.dayChips) {
            Array.prototype.forEach.call(els.dayChips.querySelectorAll("[data-day]"), function (b) {
                b.setAttribute("aria-pressed", b.dataset.day === state.day ? "true" : "false");
            });
        }
        if (els.mealChips) {
            Array.prototype.forEach.call(els.mealChips.querySelectorAll("[data-meal]"), function (b) {
                b.setAttribute("aria-pressed", b.dataset.meal === state.meal ? "true" : "false");
            });
        }
        if (els.catChips) {
            Array.prototype.forEach.call(els.catChips.querySelectorAll("[data-cat]"), function (b) {
                b.setAttribute("aria-pressed", b.dataset.cat === state.cat ? "true" : "false");
            });
        }
        if (els.vegGroup) {
            Array.prototype.forEach.call(els.vegGroup.querySelectorAll("[data-veg]"), function (b) {
                b.setAttribute("aria-pressed", b.dataset.veg === state.veg ? "true" : "false");
            });
        }
    }

    /* ---- filtering ---- */

    function visibleMeals() {
        var day = effectiveDay();
        var q = state.q.trim().toLowerCase();

        var rows = MEALS.filter(function (m) {
            if (state.day !== "all" && m.day !== day) return false;
            if (state.meal !== "all" && m.meal !== state.meal) return false;

            if (state.cat === "__fav") {
                if (!DG.favorites.has(m.id)) return false;
            } else if (state.cat !== "all" && m.cat !== state.cat) {
                return false;
            }

            if (state.veg === "veg" && !m.veg) return false;
            if (state.veg === "nonveg" && m.veg) return false;

            if (q) {
                var hay = (m.name + " " + m.desc + " " + m.cat + " " + m.meal + " " + m.dayLabel).toLowerCase();
                if (hay.indexOf(q) === -1) return false;
            }
            return true;
        });

        if (state.sort === "price-asc") rows.sort(function (a, b) { return a.price - b.price; });
        else if (state.sort === "price-desc") rows.sort(function (a, b) { return b.price - a.price; });
        else if (state.sort === "name") rows.sort(function (a, b) { return a.name.localeCompare(b.name); });
        else if (state.sort === "calorie") rows.sort(function (a, b) { return a.kcal - b.kcal; });

        return rows;
    }

    function vegMark(veg) {
        return veg ? '<span class="dg-veg">Veg</span>' : '<span class="dg-nonveg">Non-veg</span>';
    }

    function card(m) {
        var fav = DG.favorites.has(m.id);
        return (
            '<article class="dg-card dg-card-hover overflow-hidden flex flex-col" data-id="' + m.id + '">' +
            '<div class="dg-media dg-media-4x3" style="border-radius:0">' +
            '<img src="' + m.image + '" alt="' + DG.esc(m.name) + '" loading="lazy" width="520" height="390">' +
            '<span class="dg-badge dg-badge-solid" style="position:absolute;top:.6rem;left:.6rem">' +
            '<i data-lucide="clock"></i>' + m.meal + "</span>" +
            '<button type="button" class="dg-fav" data-fav="' + m.id + '" aria-pressed="' + fav + '" ' +
            'aria-label="' + (fav ? "Remove from favourites" : "Add to favourites") + '">' +
            '<i data-lucide="heart"></i></button>' +
            "</div>" +
            '<div class="p-3.5 sm:p-4 flex flex-col gap-2 flex-1">' +
            '<div class="flex items-center gap-2 flex-wrap">' + vegMark(m.veg) +
            '<span class="dg-badge dg-badge-outline">' + DG.esc(DG.data.catLabel(m.cat)) + "</span>" +
            "</div>" +
            '<h3 class="text-base leading-snug">' + DG.esc(m.name) + "</h3>" +
            '<p class="text-sm dg-lede dg-clamp-2">' + DG.esc(m.desc) + "</p>" +
            '<div class="flex items-center gap-3 flex-wrap text-xs" style="color:var(--dg-ink-mute)">' +
            '<span class="flex items-center gap-1"><i data-lucide="flame"></i>' + m.kcal + " kcal</span>" +
            '<span class="flex items-center gap-1"><i data-lucide="calendar"></i>' + DG.esc(m.dayLabel) + "</span>" +
            "</div>" +
            '<div class="flex items-center justify-between gap-2 mt-auto pt-1">' +
            '<span class="dg-price">' + DG.fmt.money(m.price) + "</span>" +
            '<span class="dg-badge dg-badge-brown"><i data-lucide="shopping-bag"></i>Add to plan</span>' +
            "</div>" +
            "</div></article>"
        );
    }

    function render() {
        if (!els.grid) return;
        var rows = visibleMeals();

        if (els.count) {
            els.count.textContent = rows.length === 1 ? "1 dish" : rows.length + " dishes";
        }

        if (els.summary) {
            var dLabel = effectiveDay() === todayKey() ? "Today, " + DG.esc(dayLabel(effectiveDay())) : DG.esc(dayLabel(effectiveDay()));
            var parts = [dLabel];
            if (state.meal !== "all") parts.push(state.meal);
            if (state.cat !== "all") parts.push(state.cat === "__fav" ? "Favourites" : DG.data.catLabel(state.cat));
            if (state.veg !== "all") parts.push(state.veg === "veg" ? "Vegetarian only" : "Non-vegetarian");
            if (state.q) parts.push('matching "' + DG.esc(state.q) + '"');
            els.summary.textContent = parts.join(" \u00b7 ");
        }

        if (!rows.length) {
            els.grid.innerHTML =
                '<div class="dg-card dg-card-pad" style="grid-column:1/-1;text-align:center">' +
                '<span class="dg-icon-tile dg-icon-tile-soft" style="margin-inline:auto"><i data-lucide="search"></i></span>' +
                '<h3 class="text-lg" style="margin-top:.75rem">No dishes match your filters</h3>' +
                '<p class="dg-lede text-sm" style="margin-top:.35rem">Try a different day, clear the search box or browse all categories.</p>' +
                '<button type="button" class="dg-btn dg-btn-outline" data-reset style="margin-top:1rem">' +
                '<i data-lucide="rotate-ccw"></i>Reset all filters</button></div>';
        } else {
            els.grid.innerHTML = rows.map(card).join("");
        }

        DG.icons(els.grid);
        updateFavCount();
    }

    function dayLabel(key) {
        for (var i = 0; i < DAYS.length; i++) if (DAYS[i].key === key) return DAYS[i].label;
        return key;
    }

    function updateFavCount() {
        var n = DG.favorites.count();
        Array.prototype.forEach.call(document.querySelectorAll("[data-fav-count]"), function (el) {
            el.textContent = n;
        });
        Array.prototype.forEach.call(document.querySelectorAll("[data-fav-count-wrap]"), function (el) {
            el.style.display = n > 0 ? "" : "none";
        });
    }

    function resetFilters() {
        state.day = "today";
        state.meal = "all";
        state.cat = "all";
        state.veg = "all";
        state.q = "";
        if (els.search) els.search.value = "";
        syncChips();
        writeUrl();
        render();
        DG.toast("Filters cleared. Showing the full weekly menu.", { type: "info", icon: "rotate-ccw" });
    }

    /* ---- wiring ---- */

    function init() {
        els.dayChips = document.getElementById("dg-day-chips");
        els.mealChips = document.getElementById("dg-meal-chips");
        els.catChips = document.getElementById("dg-cat-chips");
        els.vegGroup = document.getElementById("dg-veg-group");
        els.grid = document.getElementById("dg-menu-grid");
        els.count = document.getElementById("dg-result-count");
        els.summary = document.getElementById("dg-result-summary");
        els.search = document.getElementById("dg-menu-search");
        els.sort = document.getElementById("dg-menu-sort");

        if (!els.grid) return;

        readUrl();
        buildDayChips();
        buildMealChips();
        buildCatChips();
        DG.icons(els.dayChips);
        DG.icons(els.mealChips);
        DG.icons(els.catChips);
        if (els.search) els.search.value = state.q;
        if (els.sort) els.sort.value = state.sort;

        /* chips (delegated) */
        document.addEventListener("click", function (e) {
            var dayBtn = e.target.closest("[data-day]");
            if (dayBtn && els.dayChips && els.dayChips.contains(dayBtn)) {
                state.day = dayBtn.dataset.day;
                afterFilterChange();
                return;
            }
            var mealBtn = e.target.closest("[data-meal]");
            if (mealBtn && els.mealChips && els.mealChips.contains(mealBtn)) {
                state.meal = mealBtn.dataset.meal;
                afterFilterChange();
                return;
            }
            var catBtn = e.target.closest("[data-cat]");
            if (catBtn && els.catChips && els.catChips.contains(catBtn)) {
                state.cat = catBtn.dataset.cat;
                afterFilterChange();
                return;
            }
            var vegBtn = e.target.closest("[data-veg]");
            if (vegBtn && els.vegGroup && els.vegGroup.contains(vegBtn)) {
                state.veg = vegBtn.dataset.veg;
                afterFilterChange();
                return;
            }
            if (e.target.closest("[data-reset]")) {
                resetFilters();
                return;
            }
            var favBtn = e.target.closest("[data-fav]");
            if (favBtn) {
                e.preventDefault();
                var added = DG.favorites.toggle(favBtn.dataset.fav);
                favBtn.setAttribute("aria-pressed", added ? "true" : "false");
                favBtn.setAttribute("aria-label", added ? "Remove from favourites" : "Add to favourites");
                favBtn.classList.toggle("is-on", added);
                var m = DG.data.byId(favBtn.dataset.fav);
                DG.toast(
                    added
                        ? (m ? m.name : "Dish") + " saved to your favourites."
                        : (m ? m.name : "Dish") + " removed from favourites.",
                    { title: added ? "Added to favourites" : "Removed", type: added ? "success" : "info", timeout: 2400 }
                );
                updateFavCount();
                if (state.cat === "__fav") render();
                return;
            }
        });

        /* search */
        if (els.search) {
            var run = DG.debounce(function () {
                state.q = els.search.value;
                render();
            }, 220);
            els.search.addEventListener("input", run);
            els.search.addEventListener("keydown", function (e) {
                if (e.key === "Escape") {
                    els.search.value = "";
                    state.q = "";
                    render();
                }
            });
            var clear = document.getElementById("dg-search-clear");
            if (clear) {
                clear.addEventListener("click", function () {
                    els.search.value = "";
                    state.q = "";
                    render();
                    els.search.focus();
                });
            }
        }

        /* sort */
        if (els.sort) {
            els.sort.addEventListener("change", function () {
                state.sort = els.sort.value;
                render();
            });
        }

        syncChips();
        render();
        updateFavCount();
    }

    function afterFilterChange() {
        syncChips();
        writeUrl();
        render();
    }

    /* keep the favourite counter fresh when returning from another page */
    document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "visible" && els.grid) {
            render();
        }
    });

    DG.pages = DG.pages || {};
    DG.pages.menu = init;
})();
