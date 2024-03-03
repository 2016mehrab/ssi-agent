const axios = require("axios");
const qrcode = require("qrcode");
const url = "http://127.0.0.1:8021";

exports.generateQRcode = async (req, res) => {
  const connection_alias = req.body.connection_alias;
  console.log("Connecting with mobile-agent with :", connection_alias);
  const data = {
    my_label: connection_alias,
  };

  axios
    .post(
      url + "/connections/create-invitation?alias=" + connection_alias,
      data
    )
    .then((resp) => {
      const id = resp.data["connection_id"];
    //   console.log("create-invitation response", resp.data);
      if (resp) {
        const inviteURL = JSON.stringify(resp.data["invitation_url"], null, 4);
        console.log("Invitation URL: ", inviteURL);
        qrcode.toDataURL(inviteURL, (err, src) => {
          let qr_data = { src, id };
          res.status(200).render("mobile-agent-invitation", qr_data);
        });
      }
    })
    .catch((err) => {
      console.error(err);
    });
};
