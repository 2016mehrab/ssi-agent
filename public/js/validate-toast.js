document.getElementById("myForm").addEventListener("submit", function (e) {
  e.preventDefault();
  var formData = new FormData(this);
  var object = {};
  formData.forEach(function (value, key) {
    object[key] = value;
  });

  var jsonData = JSON.stringify(object);
  console.log(jsonData);

  fetch(this.action, {
    method: "POST",
    body: jsonData,
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      var messageDiv = document.createElement("div");
      messageDiv.classList.add("terminal-alert");
      if (data.success) {
        messageDiv.classList.add("terminal-alert-primary");
        messageDiv.innerText = "Added to Registry";
      } else {
        messageDiv.classList.add("terminal-alert-error");
        messageDiv.innerText = "Failed to Add organization";
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
      document.getElementById("myForm").reset();
    })
    .catch((error) => {
      console.error("Error:", error.message);
      var messageDiv = document.createElement("div");
      messageDiv.classList.add("terminal-alert");
      messageDiv.classList.add("terminal-alert-error");
      messageDiv.innerText = "Operation failed";
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
      document.getElementById("myForm").reset();
    });
});
