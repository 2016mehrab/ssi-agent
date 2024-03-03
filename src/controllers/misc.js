const url = "http://127.0.0.1:8021";
const my_server = "http://127.0.0.1:3000";
const ngrok_url = "http://127.0.0.1:4040/api/tunnels";
const axios = require("axios");

exports.verify = async (req, res) => {
  let response;
  let pres_ex_id;
  try {
    response = await axios.get(my_server + "/present-proof");
    pres_ex_id = response.data[0].pres_ex_id;
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
  try {
    response = await axios.post(
      url + `/present-proof-2.0/records/${pres_ex_id}/verify-presentation`,
      {
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json(response.data.verified);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.sendProof = async (req, res) => {
  let response;
  try {
    response = await axios.get(my_server + "/connections");

    // res.status(200).json(data);
  } catch (e) {
    // res.status(500).json({ message: "problem while getting connections" });
    res.status(500).json({ message: e.message });
  }
  // TODO: fix replacement_id & connection_id
  let proof = {
    auto_remove: true,
    dif: {
      reveal_doc: {
        "@context": [
          "https://www.w3.org/2018/credentials/v1",
          "https://w3id.org/security/bbs/v1",
        ],
        "@explicit": true,
        "@requireAll": true,
        credentialSubject: {
          "@explicit": true,
          "@requireAll": true,
          Observation: [
            {
              effectiveDateTime: {},
              "@explicit": true,
              "@requireAll": true,
            },
          ],
        },
        issuanceDate: {},
        issuer: {},
        type: ["VerifiableCredential", "LabReport"],
      },
    },
    indy: {
      requested_attributes: {
        additionalProp1: {
          cred_id: req.body.cred_id,
          revealed: true,
        },
      },
      requested_predicates: {},

      self_attested_attributes: {},
      trace: true,
    },
    trace: true,
  };

  try {
    response = await axios.post(
      url +
        `/present-proof-2.0/records/${req.body.pres_ex_id}/send-presentation`,
      proof,
      {
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json(response.data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// TODO : NEED TO RENAME TUNNEL
exports.ngrok = async (req, res) => {
  const response = await axios.get(ngrok_url);
  console.log(response.data);

  const tunnels = response.data.tunnels;
  const endpoint = tunnels.find((tunnel) => tunnel.name === "controller");
  if (endpoint) {
    res.send(endpoint.public_url);
  } else {
    res.send('No tunnel named "controller" found');
  }
};

exports.publicDid = async (req, res) => {
  let response;
  try {
    response = await axios.get(url + "/wallet/did/public");
    res.status(200).json(response.data.result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getConnectionStatus = async (req, res) => {
  if (connection_status === null) {
    res.status(200).json(null);
  } else {
    res.status(200).json(connection_id);
  }
};

exports.getConnectionInfo = async (req, res) => {
  if (connection_status === null) {
    res.status(200).json(null);
  } else {
    res.status(200).json({ id: connection_id, status: connection_status });
  }
};
