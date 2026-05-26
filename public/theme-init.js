try {
  var storedTheme = localStorage.getItem("weather-compare.theme");
  var isDark = storedTheme
    ? storedTheme === "dark"
    : matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", isDark);
} catch {}
