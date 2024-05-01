const axios = require("axios");
const my_server = "http://127.0.0.1:3000";
const { generateQRcode } = require("../controllers/mobileAgentConnections.js");
const {
  createConnection,
  deleteConnections,
  getConnections,
} = require("../controllers/connections.js");
const { getAllSchemas, postSchema } = require("../controllers/schemas.js");
const {
  getAllCredentialDefinitions,
  postCredentialDefinition,
} = require("../controllers/credentialDefinitions.js");
const {
  getAllIssueCredentials,
  postIssueCredential,
  postIssueCredentialDynamic,
  postIssueCredentialV1,
  deleteAllIssueCredentials,
} = require("../controllers/issueCredentials.js");
const {
  getAllPresentProofs,
  postPresentProof,
  deleteAllPresentProofs,
} = require("../controllers/presentProofs.js");

const {
  getAllCredentials,
  deleteAllCredentials,
} = require("../controllers/credentials.js");
const {
  getProofRecords,
  requestProof,
  deleteProofRecords,
} = require("../controllers/requesetProofs.js");

const {
  setGlobals,
  getConnectionInfo,
  getConnectionStatus,
  getCredentialStatus,
  ngrok,
  sendProof,
  verify,
  publicDid,
  setConnectionId,
} = require("../controllers/misc.js");

const ConnectionModel = require("../models/Connection.js");

/* GLOBAL */
global.global_issuer_did = null;
global.global_connection_status = null;
global.global_credential_status = null;
global.global_schema_def = null;
global.global_cred_def = null;
global.global_connection_id = null;
/* GLOBAL */

const routes = (app) => {
  /*                                 api                                         */
  app
    .route("/connections")
    .get(getConnections)
    .post(createConnection)
    .delete(deleteConnections);

  app.route("/mobile-agent-connection-generation").post(generateQRcode);
  app.route("/ngrok").get(ngrok);
  // SCHEMA DEF
  app.route("/schemas").get(getAllSchemas).post(postSchema);

  // CREDENTIAL DEF
  app
    .route("/credential-definitions")
    .get(getAllCredentialDefinitions)
    .post(postCredentialDefinition);

  app
    .route("/issue-credential")
    .get(getAllIssueCredentials)
    .post(postIssueCredentialDynamic)
    .delete(deleteAllIssueCredentials);

  app
    .route("/present-proof")
    .get(getAllPresentProofs)
    .post(postPresentProof)
    .delete(deleteAllPresentProofs);
  app
    .route("/request-proof-v1")
    .get(getProofRecords)
    .post(requestProof)
    .delete(deleteProofRecords);

  app.route("/send-proof").post(sendProof);
  app.route("/verify").post(verify);
  app.route("/public-did").get(publicDid);

  app.route("/credentials").get(getAllCredentials).delete(deleteAllCredentials);
  app.route("/status").get(getConnectionStatus);
  app.route("/credential-status").get(getCredentialStatus);
  app.route("/connection-info").get(getConnectionInfo);
  app.route("/set-globals").get(setGlobals);
  app.route("/set-connectionid").get(setConnectionId);

  /*                                 page render                                 */
  app.route("/generate_invitation_page").get((req, res) => {
    try {
      res.status(200).render("generate_invitation.pug");
    } catch (e) {
      console.log(e.message);
      res.status(500).render("error.pug");
    }
  });

  app.route("/schema_def_page").get((req, res) => {
    try {
      res.status(200).render("schema.pug");
    } catch (e) {
      console.log(e.message);
      res.status(500).render("error.pug");
    }
  });

  // comes submit req from select_schema.pug
  app.route("/get-credential").post(async (req, res) => {
    try {
      let response = await axios.get(my_server + "/schemas");
      const schemas = response.data;
      let selected_schema = schemas.filter(
        (schema) => schema.id === req.body.schema_id
      )[0];
      res
        .status(200)
        .render("issue_credential.pug", {
          schema_id: selected_schema.id,
          attrs: selected_schema.attrNames,
        });
    } catch (e) {
      console.log(req.originalUrl + " -> " + e.message);
      res.status(500).render("error.pug");
    }
  });

  app.route("/select_schema").get(async (req, res) => {
    // TODO: cleanup
    try {
      let response = await axios.get(my_server + "/schemas");
      res
        .status(200)
        .render("select_schema.pug", { schema_names: response.data });
    } catch (e) {
      console.log(e.message);
      res.status(500).render("error.pug");
    }
  });


  app.route("/agent_info_page").get(async (req, res) => {
    try {
      let response = await axios.get(my_server + "/schemas");
      const schemas = response.data;
      response = await axios.get(my_server + "/credential-definitions");
      const cred_defs = response.data;
      response = await axios.get(my_server + "/issue-credential");
      const cred_records = response.data;
      response = await axios.get(my_server + "/connections");
      let connections = response.data.results;
      connections = connections.map(
        ({
          state,
          alias,
          connection_id,
          created_at,
          their_role,
          their_label,
        }) => ({
          state,
          alias,
          connection_id,
          created_at: new Date(created_at).toLocaleString(),
          their_role,
          their_label,
        })
      );

      res.status(200).render("agent_info.pug", {
        schemas: schemas,
        cred_defs: cred_defs,
        records: cred_records,
        connections: connections,
      });
    } catch (e) {
      console.log(e.message);
      res.status(500).render("error.pug");
    }
  });

  app.route("/mobile-agent-connection-invitation").get(async (req, res) => {
    res.status(200).render("invitation.pug");
  });
  app.route("/credential_received").get(async (req, res) => {
    res.status(200).render("credential_received.pug");
  });
  app.route("/mobile-agent-connection").get(async (req, res) => {
    res.status(200).render("qrcode", qr_data);
  });
  /*                                 page render                                 */

  app
    .route("/webhooks/*")
    .get((req, res) => {
      res.status(200).send(`${req.method} - TO ${req.url}`);
    })

    .post(async (req, res) => {
      console.log(
        "hostname->",
        req.hostname,
        "ip->",
        req.ip,
        "REQ BODY FROM WEBHOOK",
        req.body
      );
      global_connection_status = req.body["state"];
      if (global_connection_status === "active") {
        global_connection_id = req.body["connection_id"];
        try {
          const connection = await ConnectionModel.create({
            alias: req.body["alias"],
            connectionId: req.body["connection_id"],
          });
          res.cookie("connectionId", req.body["connection_id"]);
        } catch (error) {
          console.log(
            "Failed to create db entry for connection",
            error.message
          );
        }
        console.log("Connction status->", global_connection_status);
        console.log("Connection Complete!");
      }

      if (global_connection_id) {
        if (req.body["state"] === "done") {
          console.log("Credential Issued!");
        }
        if (req.body["state"] === "credential_acked") {
          console.log("Credential acked...");
          global_credential_status = true;
          // req.session.credStatus = true
        }

        if (req.body["verified"] === "true") {
          console.log("Credential Being Verified");

          // TODO : need to make it compatible with version 2
          var base64data = JSON.stringify(
            req.body["presentation_request_dict"][
              "request_presentations~attach"
            ][0]["data"]["base64"]
          );

          // converting to buffer string from base64
          const decodedString = Buffer.from(base64data, "base64");
          // console.log("decodedString- ",decodedString);

          // convert it to regular string
          const jsonData = JSON.parse(decodedString.toString());
          console.log("jsonData- ", jsonData);
          // proofStatus = true;
          // retrievedAttribute =
          //   jsonData["requested_attributes"]["0_role"]["value"];
          // req.session.credStatus = true
        } else {
        }
      } else {
        console.log("No connection id");
      }
    });
};
export default routes;

// TODO : cookie based session management.
