const axios = require('axios');
const url = "http://127.0.0.1:8021";

exports.getAllCredentialDefinitions = async (req, res) => {
  try {
    let response = await axios.get(url + "/credential-definitions/created");
    let cred_ids = response.data.credential_definition_ids;
    let cred_infos = [];
    // console.log(cred_ids);

    let promises = cred_ids.map(async (id) => {
      try {
        response = await axios.get(url + "/credential-definitions/" + id);
        delete response.data.credential_definition.value;
        cred_infos.push(response.data.credential_definition);
      } catch (e) {
        console.log("Error while fetching schema info", e.message);
      }
    });
    await Promise.all(promises);
    res.status(200).json(cred_infos);
  } catch (e) {
    res.status(200).json(e.message);
  }
}

exports.postCredentialDefinition = async (req, res) => {
  try {
    console.log(req.body);
    const data = {
      schema_id: req.body.schema_id,
      tag: req.body.tag,
    };
    const response = await axios.post(
      url + "/credential-definitions",
      data,
      {
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
    res.status(200).json({ success: true });
  } catch (e) {
    console.log(e.message);
    res.status(500).json({ success: false });
  }
}