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
    // Check if user with the same email already exists
    const existingUser = await UserService.findByEmail(connection_mail);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // If user doesn't exist, proceed with generating QR code and saving the user
    const response = await axios.post(
      `${url}/connections/create-invitation?alias=${connection_alias}`,
      data
    );
    const id = response.data["connection_id"];
    const userdata = { email: connection_mail, connectionId: id, hasCredential: false };
    const inviteURL = JSON.stringify(response.data["invitation_url"], null, 4);

    await UserService.create(userdata);
    qrcode.toDataURL(inviteURL, (err, src) => {
      if (err) {
        console.error("Error generating QR code:", err);
        return res.status(500).render("error.pug");
      }
      let qr_data = { src, id };
      res.status(200).render("mobile-agent-invitation", qr_data);
    });
  } catch (error) {
    console.error(error);
    res.status(500).render("error.pug");
  }
};

exports.reconnectWithEmail = async (req, res) => {
  const connection_mail = req.body.email;

  try {
    // Check if user with the same email already exists
    const existingUser = await UserService.findByEmail(connection_mail);
    if (!existingUser) {
      throw new Error("User with this email already exists");
    }
    req.session.user = {
      connection_id: existingUser.connectionId,
      user_name: existingUser.email.split("@")[0],
    };
    const redirectTo = req.session.returnTo || "/user-profile";
    delete req.session.returnTo;
    res.status(200).json({ success: true, redirect: redirectTo });
  } catch (error) {
    console.error(error);
    res.status(500).render("error");
  }
};
