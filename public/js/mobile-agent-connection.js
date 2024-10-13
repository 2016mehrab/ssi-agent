document.addEventListener("DOMContentLoaded", function () {
  setTimeout(executeQuery, 2000);
});

function executeQuery() {
  // var id = document.getElementById("connection_id").textContent.trim();
  // id += "";
  fetch("/connection-status")
    // .then((r) => r.text())
    .then((data) => {
      console.log("returned ", data);
      // console.log("ID: " + id);
      // console.log("Data:", data);

      // // if (id === data) {
      // if ('"' + id + '"' === data) {
      //   console.log("condition inside");
      //   window.location.href = "/login";
      // }
      setTimeout(executeQuery, 5000);
    });
}
