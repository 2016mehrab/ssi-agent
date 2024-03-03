const url = "http://127.0.0.1:8021";
const { v4: uuidv4 } = require('uuid');
const axios = require("axios");

exports.getAllIssueCredentials = async (req, res) => {
  try {
    const response = await axios.get(url + "/issue-credential-2.0/records");
    let cred_records = response.data.results;
    console.log(cred_records);

    cred_records.forEach((item) => {
      delete item.cred_ex_record.cred_offer;
      delete item.cred_ex_record.cred_proposal;
      delete item.cred_ex_record.by_format;
      delete item.indy;
      delete item.ld_proof;
    });
    res.status(200).json(cred_records);
  } catch (e) {
    console.log(e.message);
    res.status(500).json(e.message);
  }
};

// TODO : need to implement it properly
exports.postIssueCredential = async (req, res) => {
  let response;
  console.log("postIssueCredential req body->", req.body);
  const id= uuidv4();
  try {
    // response = await axios.get(my_server + "/connections");

    // TODO: fix replacement_id & connection_id
    let data = {
      auto_issue: true,
      auto_remove: false,
      comment: "string",
      connection_id: global_connection_id,
      credential_preview: {
        "@type": "issue-credential/2.0/credential-preview",
        attributes: [...req.body.attrs],
      },
      filter: {
        indy: {
          // cred_def_id: req.body.indy_field.cred_def_id,
          // issuer_did: req.body.indy_field.issuer_did,
          // schema_id: req.body.indy_field.schema_id,
          // schema_issuer_did: req.body.indy_field.schema_issuer_did,
          // schema_name: req.body.indy_field.schema_name,
          // schema_version: req.body.indy_field.schema_version,
          cred_def_id: global_cred_def.id,
          issuer_did: global_issuer_did,
          schema_id: global_schema_def.id,
          schema_issuer_did: global_schema_def.id.split(":")[0],
          schema_name: global_schema_def.name,
          schema_version: global_schema_def.version,
        },
      },
      //   replacement_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      trace: true,
    };

    console.log("postIssueCredential data", data);

    // response = await axios.post(
    //   url + "/issue-credential-2.0/send-offer",
    //   data,
    //   {
    //     headers: {
    //       accept: "application/json",
    //       "Content-Type": "application/json",
    //     },
    //   }
    // );

    // res.status(200).json(response.data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.deleteAllIssueCredentials = async (req, res) => {
  try {
    let response = await axios.get(url + "/issue-credential-2.0/records");
    let cred_ex_ids = response.data.results.map(
      (e) => e.cred_ex_record.cred_ex_id
    );
    console.log(cred_ex_ids);
    cred_ex_ids.map(async (e) => {
      response = await axios.delete(url + "/issue-credential-2.0/records/" + e);
      if (response.status !== 200) throw Error("Could not delete records");
    });
    res.status(202).send(`Method- ${req.method} Endpoint- ${req.originalUrl}`);
  } catch (error) {
    console.log(error.message);
    res.status(500).json(error.message);
  }
};
