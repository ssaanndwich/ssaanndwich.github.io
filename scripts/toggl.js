function tdnn() {
  document.getElementsByClassName("moon")[0].classList.toggle("sun");
  document.getElementsByClassName("toggl")[0].classList.toggle("day");
  document.getElementsByTagName("body")[0].classList.toggle("light");
  localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
}

function applyTheme() {
  if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light");
    var moon = document.getElementsByClassName("moon")[0];
    var toggl = document.getElementsByClassName("toggl")[0];
    if (moon) moon.classList.add("sun");
    if (toggl) toggl.classList.add("day");
  }
}

applyTheme();

window.addEventListener("pageshow", function (e) {
  if (e.persisted) applyTheme();
});
