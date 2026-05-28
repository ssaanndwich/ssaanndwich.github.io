function tdnn() {
  document.getElementsByClassName("moon")[0].classList.toggle("sun");
  document.getElementsByClassName("toggl")[0].classList.toggle("day");
  document.getElementsByTagName("body")[0].classList.toggle("light");
  localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
}

(function () {
  if (localStorage.getItem("theme") === "light") {
    document.getElementsByClassName("moon")[0].classList.add("sun");
    document.getElementsByClassName("toggl")[0].classList.add("day");
    document.body.classList.add("light");
  }
})();
