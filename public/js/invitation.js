document.getElementById("myForm").addEventListener("submit", function (e) {
  e.preventDefault();
  var formData = new FormData(this);
  var object = {};
  formData.forEach(function (value, key) {
    object[key] = value;
  });

  var jsonData = JSON.stringify(object);
//   console.log(jsonData);

  fetch(this.action, {
    method: "POST",
    body: jsonData,
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Working invitation.js");

    //   data = JSON.stringify({ Src, id });
        const qr_data = {src:data.src, id:data.id};
      console.log("QR_Data->", qr_data);
      
      const qrContainer = document.getElementById("qrContainer");
      const qr = new QRCode(qrContainer, {
        text: qr_data,
        width: 200,
        height: 200,
      });
      qrContainer.scrollIntoView({ behavior: "smooth" });
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
      console.error("Error:", error.message);
    });
});

// script.document.addEventListener("DOMContentLoaded", function () {
//   const form = document.getElementById("myForm");
//   const qrContainer = document.getElementById("qrContainer");

//   form.addEventListener("submit", function (event) {
//     event.preventDefault(); // Prevent form submission

//     // Extract form data
//     const memName = document.getElementById("memName").value;
//     const email = document.getElementById("email").value;

//     // Create data string for QR code
//     const data = JSON.stringify({ memName, email });

//     // Generate QR code
//     const qr = new QRCode(qrContainer, {
//       text: data,
//       width: 200,
//       height: 200,
//     });
//     qrContainer.scrollIntoView({ behavior: "smooth" });
//   });
// });
