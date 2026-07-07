// ==========================================================
// KUN / TUN REJIMI
// ==========================================================
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  const icon = document.getElementById("theme-toggle-icon");
  if (icon) {
    icon.className = "ti " + (theme === "dark" ? "ti-sun" : "ti-moon");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  applyTheme(document.documentElement.getAttribute("data-theme") || "light");
  const btn = document.getElementById("theme-toggle-btn");
  if (btn) {
    btn.addEventListener("click", function () {
      const current = document.documentElement.getAttribute("data-theme");
      applyTheme(current === "dark" ? "light" : "dark");
    });
  }
});
