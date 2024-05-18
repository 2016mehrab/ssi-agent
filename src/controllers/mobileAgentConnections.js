const axios = require("axios");
const qrcode = require("qrcode");
const url = "http://127.0.0.1:8021";
const UserService = require("../services/UserService");

exports.generateQRcode = async (req, res) => {
  const connection_mail = req.body.email;
  const connection_alias = req.body.alias;
  const data = {
    my_label: connection_alias,
  };

  try {
    const response = await axios.post(
      url + "/connections/create-invitation?alias=" + connection_alias,
      data
    );
    const id = response.data["connection_id"];
    if (response) {
      const userdata = { email: connection_mail, connectionId: id };
      const inviteURL = JSON.stringify(response.data["invitation_url"], null, 4);
      await UserService.create(userdata);
      qrcode.toDataURL(inviteURL, (err, src) => {
        let qr_data = { src, id };
        res.status(200).render("mobile-agent-invitation", qr_data);
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).render("error.pug");
  }
};
