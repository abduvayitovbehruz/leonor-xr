// ==========================================================
// KUN / TUN REJIMI - faqat tugma orqali almashadi
// ==========================================================
(function () {
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("theme", theme); } catch (e) { /* xatolik e'tiborsiz qoldiriladi */ }
    var icon = document.getElementById("theme-toggle-icon");
    if (icon) {
      icon.className = "ti " + (theme === "dark" ? "ti-sun" : "ti-moon");
    }
  }

  // Sahifa yuklanganda: avval saqlangan tanlov, bo'lmasa kunduzgi rejim
  var current = document.documentElement.getAttribute("data-theme") || "light";
  applyTheme(current);

  var btn = document.getElementById("theme-toggle-btn");
  if (btn) {
    btn.addEventListener("click", function () {
      var now = document.documentElement.getAttribute("data-theme");
      applyTheme(now === "dark" ? "light" : "dark");
    });
  }
})();
