document.getElementById("myForm").addEventListener("submit", function (e) {
  console.log("clicked");
  e.preventDefault();
  var formData = new FormData(this);

  fetch(this.action, {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      var messageDiv = document.createElement("div");
      messageDiv.classList.add("terminal-alert");
      if (data.success) {
        messageDiv.classList.add("terminal-alert-primary");
        messageDiv.innerText = "Operation Successful";
      } else {
        messageDiv.classList.add("terminal-alert-error");
        messageDiv.innerText = "Operation failed";
      }
      messageDiv.style.position = "fixed";
      messageDiv.style.bottom = "0";
      messageDiv.style.right = "0";
      messageDiv.style.width = " 20%";
      document.body.appendChild(messageDiv);
      // Add event listener for losing focus
      messageDiv.tabIndex = -1; // Make the div focusable
      messageDiv.focus(); // Focus the div
      messageDiv.addEventListener(
        "blur",
        function () {
          messageDiv.remove();
        },
        { once: true }
      ); 
    })
    .catch((error) => {
      console.error("Error:", error);
    });
});
