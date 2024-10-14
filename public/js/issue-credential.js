document.addEventListener("DOMContentLoaded", function () {
  setTimeout(executeQuery, 10000);
});

function executeQuery() {
  fetch("/credential-status")
    .then((r) => r.json())
    .then((data) => {
      console.log("Data:", data);

      if (data.success) {
        window.location.href = "/credential_received";
      }
      setTimeout(executeQuery, 8000);
    });
}
