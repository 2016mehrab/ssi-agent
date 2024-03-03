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
  getConnectionInfo,
  getConnectionStatus,
  ngrok,
  sendProof,
  verify,
  publicDid,
} = require("../controllers/misc.js");
global.connection_status = null;
global.connection_id = null;

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
    .post(postIssueCredential)
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
  app.route("/connection-info").get(getConnectionInfo);

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

  app.route("/cred_def_page").get(async (req, res) => {
    // TODO: cleanup
    try {
      let response = await axios.get(my_server + "/schemas");
      res
        .status(200)
        .render("credential_definition.pug", { schema_names: response.data });
    } catch (e) {
      console.log(e.message);
      res.status(500).render("error.pug");
    }
  });

  app.route("/issue_cred_page").get((req, res) => {
    try {
      res.status(200).render("issue_credential.pug");
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
      // console.log("REQ BODY FROM WEBHOOK",req.body);
      connection_status = req.body["state"];
      if (connection_status === "completed" || connection_status === "active") {
        connection_id = req.body["connection_id"];
        console.log("Connction status->", connection_status);
        console.log("Connection Complete!");
      }
      if (connection_id) {
        if (req.body["state"] === "credential_acked") {
          console.log("Credential acked...");
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
      // const connection_status = req.body["rfc23_state"];
      // console.log("connection id->", connection_id);
      // console.log("connection status->", connection_status);
      // if (connection_id) {
      // TODO : make connection_id and status a global variable when newly established
    });
};
export default routes;
