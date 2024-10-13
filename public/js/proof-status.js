document.addEventListener("DOMContentLoaded", function () {
  setTimeout(executeQuery, 2000);
});

function executeQuery() {

  fetch("/revealed-cred-status")
    .then((r) => r.json())
    .then((data) => {
      // console.log("Data:", data);

      if (data.success == true) {
        window.location.href = "/service";
      }
      setTimeout(executeQuery, 5000);
    });
}
