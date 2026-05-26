try {
  var storedTheme = localStorage.getItem("weather-compare.theme");
  var isDark = storedTheme ? storedTheme === "dark" : true;
  document.documentElement.classList.toggle("dark", isDark);
} catch {}
