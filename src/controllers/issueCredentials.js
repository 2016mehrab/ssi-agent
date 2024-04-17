const url = "http://127.0.0.1:8021";
const my_server = "http://127.0.0.1:3000";
const { v4: uuidv4 } = require("uuid");
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

exports.postIssueCredentialV1 = async (req, res) => {
  let response;
  console.log("postIssueCredentialV1 req body->", req.body);
  const id = uuidv4();
  try {
    response = await axios.get(my_server + "/set-globals");
    response = await axios.get(my_server + "/connection-info");

    if (
      !response.data.global_schema_def &&
      !response.data.global_cred_def &&
      !response.data.global_connection_id &&
      !response.data.global_issuer_did
    ) {
      throw new Error("set-globals error");
    }

    // console.log("Response data", response.data);

    let k = [...Object.keys(req.body), "Id"];
    let v = [...Object.values(req.body), id];
    let attr = Object.entries(req.body).map(([k, v]) => ({
      name: k,
      value: v,
    }));

    attr.push({ name: "Id", value: id });
    console.log("attr from postIssueCredentialV1", attr);

    let data = {
      auto_issue: true,
      auto_remove: true,
      // "connection_id": connectionStatus,
      connection_id: global_connection_id,
      // "cred_def_id":"FXd9ZjZrzGQbn2Gt2EyRLw:3:CL:114538:faber.agent.degree_schema",
      cred_def_id: global_cred_def.id,
      comment: "Offer on cred def id " + global_cred_def.id,
      credential_preview: {
        "@type": "https://didcomm.org/issue-credential/1.0/credential-preview",
        attributes: [...attr],
      },
      trace: true,
    };

    console.log("Data from postIssueCredV1", data);
    const temp = await axios.post(url + "/issue-credential/send-offer", data);
    console.log("send-offer response-");
    console.log(temp.data);
    // res.cookie("conID", req.session.conID, {
    //   maxAge: 900000,
    //   httpOnly: true,
    // });
    res.render("waiting.pug");
  } catch (err) {
    res.render("error.pug");
    console.log(err.message);
  }
};

// VERSION 2.0
// TODO : Proper redirection
exports.postIssueCredential = async (req, res) => {
  let response;
  console.log("postIssueCredential req body->", req.body);
  const id = uuidv4();
  try {
    response = await axios.get(my_server + "/set-globals");
    response = await axios.get(my_server + "/connection-info");
    if (
      !response.data.global_schema_def &&
      !response.data.global_cred_def &&
      !response.data.global_connection_id &&
      !response.data.global_issuer_did
    ) {
      throw new Error("set-globals error");
    }

    console.log("Response data", response.data);

    let k = [...Object.keys(req.body), "Id"];
    let v = [...Object.values(req.body), id];
    let attr = Object.entries(req.body).map(([k, v]) => ({
      name: k,
      value: v,
    }));

    attr.push({ name: "Id", value: id });
    console.log("attr from postIssueCredential", attr);

    // TODO: fix replacement_id & connection_id
    let data = {
      auto_issue: true,
      auto_remove: false,
      comment: "string",
      connection_id: global_connection_id,
      credential_preview: {
        "@type": "issue-credential/2.0/credential-preview",
        attributes: [...attr],
      },
      filter: {
        indy: {
          cred_def_id:"VGXTHfUFKGWbnm4jkvaWCC:3:CL:507163:VC",
          issuer_did: "VGXTHfUFKGWbnm4jkvaWCC",
          schema_id:"VGXTHfUFKGWbnm4jkvaWCC:2:FEDERATION:1.0",
          schema_issuer_did:"VGXTHfUFKGWbnm4jkvaWCC" ,
          schema_name:"FEDERATION" ,
          schema_version: "1.0",
        },
      },
      //   replacement_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      trace: true,
    };

    console.log("postIssueCredential data", data);

    response = await axios.post(
      url + "/issue-credential-2.0/send-offer",
      data,
      {
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    res.render("waiting.pug");
    // res.status(200).json(response.data);
  } catch (e) {
    // res.status(500).json({ message: e.message });
    res.render("error.pug");
    console.log(e.message);
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
