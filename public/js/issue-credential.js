document.addEventListener("DOMContentLoaded", function () {
  setTimeout(executeQuery, 2000);
});

function executeQuery() {
  fetch("/credential-status")
    .then((r) => r.json())
    .then((data) => {
      console.log("Data:", data);

      if (data == true) {
        window.location.href = "/agent_info_page";
      }
      setTimeout(executeQuery, 5000);
    });
}
