/* ==========================================================================
   DabbaGo — home2.js
   Renderers for the second homepage variant (home2.html).

   These deliberately do NOT reuse DG.home.* from main.js, because home2 has to
   look nothing like home1. Same underlying data (menu / plans / delivery), a
   different arrangement of it.

   Every image that home1 uses is listed in HOME1_IMAGES below and filtered
   out at render time, so home2 can never accidentally show a photo that
   already appears on the first homepage.
   ========================================================================== */
(function (window, document) {
  "use strict";

  var DG = window.DG || (window.DG = {});
  if (!DG.data) DG.data = {};

  /* Photos that already appear on home1. Banned here on purpose. */
  var HOME1_IMAGES = [
    "butter-chicken.jpg",
    "chapati.jpg",
    "chole-bhature.jpg",
    "idli-sambar.jpg",
    "masala-dosa.jpg",
    "mutton-rogan-josh.jpg",
    "paneer-butter-masala.jpg",
    "veg-biryani.jpg",
    "veg-thali.jpg",
    "avatars/aarav-patil.jpg",
    "avatars/rohan-kulkarni.jpg",
    "avatars/sneha-menon.jpg"
  ];

  function notHome1(img) {
    return HOME1_IMAGES.indexOf(img) === -1;
  }

  function byImg(a, b) {
    return String(a).localeCompare(String(b));
  }

  /* Prefer a stable, hand-picked order when a photo is given, so the bento
     layout stays art-directed instead of shifting whenever the menu data
     is reordered. Anything not listed simply lands in the remainder. */
  function ordered(list, preferred) {
    var out = [];
    preferred.forEach(function (img) {
      var hit = list.filter(function (d) { return d.img === img; })[0];
      if (hit) out.push(hit);
    });
    return out.concat(list.filter(function (d) {
      return preferred.indexOf(d.img) === -1;
    }).sort(byImg));
  }

  /* ---------------------------------------------------------------------
     Counter rail — a snap-scrolling row of what's cooking right now.

     The four dishes below are named here so they are trivial to change.
     Each is then looked up in the menu data, so the price, calories, meal
     slot, veg mark and photo all stay real rather than being hardcoded.
     Edit a name in RAIL to swap a card; a name that does not exist in the
     data is dropped with a console warning instead of rendering blank.

     RAIL_LABEL renames a card on screen without touching the menu data or
     the photo. The lookup still uses the real dish name from RAIL, so the
     link, price, calories and image all stay correct - only the visible
     name and its alt text change.

     RAIL_SLOT does the same for the slot chip in the corner of the card.
     --------------------------------------------------------------------- */
  var RAIL = [
    "Rava Upma with Peanuts",
    "Aloo Bhature (2 pc)",
    "Chicken Curry",
    "Cabbage Poriyal"
  ];

  var RAIL_LABEL = {
    "Cabbage Poriyal": "Full Meals"
  };

  /* Slot shown on the card, where it should differ from the data's own meal
     (Aloo Bhature is filed under Lunch in menu.js but is served as a snack). */
  var RAIL_SLOT = {
    "Aloo Bhature (2 pc)": "Snacks",
    "Cabbage Poriyal": "Lunch"
  };

  function renderRail() {
    var host = document.getElementById("dg2-rail");
    if (!host || !DG.data.meals) return;

    var picks = RAIL.map(function (name) {
      var hit = DG.data.meals.filter(function (m) { return m.name === name; })[0];
      if (!hit && window.console && console.warn) {
        console.warn("DabbaGo: rail dish not found in menu data -", name);
      }
      return hit;
    }).filter(function (m) { return m && notHome1(m.img); });

    if (!picks.length) return;

    var cards = picks
        .map(function (d) {
          var slot = DG.esc(RAIL_SLOT[d.name] || d.meal || "");
          var shown = RAIL_LABEL[d.name] || d.name;
          return (
            '<a class="dg2-railcard dg2-railcard--4" href="menu.html?day=' + encodeURIComponent(d.day || "") +
            "&meal=" + encodeURIComponent(d.meal || "") + '">' +
            '<div class="dg2-railcard-media">' +
            '<img src="assets/images/' + DG.esc(d.img) + '" alt="' + DG.esc(shown) +
            '" loading="lazy" width="420" height="420">' +
            '<span class="dg2-railcard-tag">' + slot + "</span>" +
            "</div>" +
            '<div class="dg2-railcard-body">' +
            '<div class="dg2-railcard-name">' + DG.esc(shown) + "</div>" +
            '<div class="dg2-railcard-foot">' +
            '<span class="dg-price">' + DG.fmt.money(d.price) + "</span>" +
            "<span>" + (d.kcal || 0) + " kcal</span>" +
            "</div></div></a>"
          );
        })
        .join("");

    host.innerHTML = cards;
    if (DG.icons) DG.icons();
  }

  /* ---------------------------------------------------------------------
     Bento wall — category tiles at deliberately uneven sizes.
     --------------------------------------------------------------------- */
  function renderBento() {
    var host = document.getElementById("dg2-bento");
    if (!host || !DG.data.meals) return;

    /* Seven tiles that fill the 4x3 desktop grid exactly (4 + 2 + 2 + 1+1+1+1).
       The area names map to grid-template-areas in home2.css. */
    var tiles = [
      { img: "greeting-thali.jpg", name: "Full Thali", sub: "Dal, sabzi, rice, roti and a sweet", area: "hero" },
      { img: "samosa.jpg", name: "Chaat & Snacks", sub: "Samosa, kachori, vada pav", area: "q1" },
      { img: "gulab-jamun.jpg", name: "Sweets", sub: "Halwa, barfi and kheer", area: "q2" },
      { img: "masala-chai.jpg", name: "Chai & Coolers", sub: "Chai, lassi, fresh lime", area: "q3" },
      { img: "spring-roll.jpg", name: "Rolls & Wraps", sub: "Spring roll, momos, papadi", area: "q4" },
      { img: "pav-bhaji.jpg", name: "Pav Bhaji & Rolls", sub: "Evening munchies, packed hot", area: "wide" },
      { img: "momos.jpg", name: "Snack Counter", sub: "Fried, packed and sealed", area: "tall" }
    ].filter(function (t) { return notHome1(t.img); });

    host.innerHTML = tiles
        .map(function (t) {
          var cls = "dg2-bento-tile dg2-bento-tile--" + t.area;
          return (
            '<a class="' + cls + '" href="menu.html">' +
            '<img src="assets/images/' + DG.esc(t.img) + '" alt="' + DG.esc(t.name) +
            '" loading="lazy" width="600" height="600">' +
            '<div class="dg2-bento-cap"><strong>' + DG.esc(t.name) + "</strong>" +
            (t.sub ? "<span>" + DG.esc(t.sub) + "</span>" : "") + "</div></a>"
          );
        })
        .join("");
  }

  DG.home2 = {
    HOME1_IMAGES: HOME1_IMAGES,
    renderRail: renderRail,
    renderBento: renderBento,
    init: function () {
      renderRail();
      renderBento();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", DG.home2.init);
  } else {
    DG.home2.init();
  }
})(window, document);
