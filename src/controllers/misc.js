require("dotenv").config();
const url = "http://127.0.0.1:8021";
const my_server = process.env.MY_SERVER;
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

exports.resolvePublicDid = async (req, res) => {
  let response;
  try {
    const did_param = encodeURIComponent("did:sov:" + req.query.did);
    let constructed_url = url + "/resolver/resolve/" + did_param;
    console.log(constructed_url);
    response = await axios.get(constructed_url);

    if (response.status === 200) {
      res.status(200).json({ success: true });
    } else {
      throw new Error("DID does not exist!");
    }
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ success: false });
  }
};

exports.getConnectionStatus = async (req, res) => {
  if (global_connection_id === null) {
    res.status(200).json(null);
  } else {
    req.session.connection_id = global_connection_id;
    res.status(200).json(global_connection_id);
  }
};

exports.getRevealedCredStatus = async (req, res) => {
  if (global_revealed_attrs === null) {
    res.status(400).json({success:false});
  } else {
    req.session.attributes = global_revealed_attrs;
    res.status(200).json({success:true,attrs:global_revealed_attrs});
  }
};

exports.getCredentialStatus = async (req, res) => {
  if (global_credential_status === null) {
    res.status(200).json(null);
  } else {
    res.status(200).json(global_credential_status);
  }
};
exports.getConnectionInfo = async (req, res) => {
  if (global_connection_status === null) {
    res.status(200).json(null);
  } else {
    res.status(200).json({
      id: global_connection_id,
      status: global_connection_status,
      global_schema_def,
      global_cred_def,
      issuer_did: global_issuer_did,
    });
  }
};

exports.setConnectionId = async (req, res) => {
  try {
    global_connection_id = req.session.connection_id;
    console.log("Global ConnectionId set", global_connection_id);
    console.log("session connectionId set", req.session.connection_id);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error.message, "-> ", req.originalUrl);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.setGlobals = async (req, res) => {
  try {
    // Make requests in parallel
    const [
      schemasResponse,
      connectionsResponse,
      credDefinitionsResponse,
      publicDidResponse,
    ] = await Promise.all([
      axios.get(`${my_server}/schemas`),
      axios.get(`${my_server}/connections`),
      axios.get(`${my_server}/credential-definitions`),
      axios.get(`${my_server}/public-did`),
    ]);

    // Extract data from responses
    const schemasData = schemasResponse.data;
    const connectionsData = connectionsResponse.data;
    const credDefinitionsData = credDefinitionsResponse.data;
    const didResponseData = publicDidResponse.data;

    // Set global variables if data is available
    if (connectionsData?.results?.length > 0) {
      global_connection_id = connectionsData.results[0].connection_id;
      global_connection_status = connectionsData.results[0].state;
    }
    if (schemasData?.length > 0) {
      global_schema_def = schemasData[0];
    }

    if (didResponseData) {
      global_issuer_did = didResponseData.did;
    }

    if (credDefinitionsData?.length > 0) {
      global_cred_def = credDefinitionsData[0];
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error setting globals:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
