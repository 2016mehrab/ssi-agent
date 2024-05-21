const express = require("express");
const router = express.Router();
require("dotenv").config();
const axios = require("axios");
const my_server = process.env.MY_SERVER;
const ReferenceService = require("../services/referenceService.js");
const UserService = require("../services/UserService.js");
const {
  isAuthenticated,
  isAdmin,
} = require("../middlewares/auth-middleware.js");

const { log, generateHmac, verifyHmac } = require("../../utils/index.js");
const {
  generateQRcode,
  reconnectWithEmail,
} = require("../controllers/mobileAgentConnections.js");
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
  requestProofV2,
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
  resolvePublicDid,
  getRevealedCredStatus,
} = require("../controllers/misc.js");

const User = require("../models/User.js");

/* GLOBAL */
global.global_issuer_did = null;
global.global_connection_status = null;
global.global_credential_status = null;
global.global_schema_def = null;
global.global_cred_def = null;
global.global_connection_id = null;
global.global_attributes = null;
global.global_revealed_attrs = {};
/* GLOBAL */

/*                                 api                                         */
router
  .route("/connections")
  .get(getConnections)
  .post(createConnection)
  .delete(deleteConnections);

router.route("/mobile-agent-connection-generation").post(generateQRcode);
router
  .route("/login")
  .get(async (req, res) => {
    try {
      res.status(200).render("reconnect.pug");
    } catch (e) {
      console.log(e.message);
      res.status(500).render("error.pug");
    }
  })
  .post(reconnectWithEmail);

router.route("/ngrok").get(ngrok);
// SCHEMA DEF
router.route("/schemas").get(getAllSchemas).post(postSchema);

// CREDENTIAL DEF
router
  .route("/credential-definitions")
  .get(getAllCredentialDefinitions)
  .post(postCredentialDefinition);

router
  .route("/issue-credential")
  .get(getAllIssueCredentials)
  .post(postIssueCredentialDynamic)
  .delete(deleteAllIssueCredentials);

router
  .route("/present-proof")
  .get(getAllPresentProofs)
  .post(postPresentProof)
  .delete(deleteAllPresentProofs);
router
  .route("/request-proof-v1")
  .get(getProofRecords)
  .post(isAuthenticated, requestProof)
  .delete(deleteProofRecords);
router
  .route("/request-proof-v2")
  .get(getProofRecords)
  .post(requestProofV2)
  .delete(deleteAllPresentProofs);

router.route("/send-proof").post(sendProof);
router.route("/verify").post(verify);
router.route("/public-did").get(publicDid);
router.route("/resolve-did").get(resolvePublicDid);

router
  .route("/credentials")
  .get(getAllCredentials)
  .delete(deleteAllCredentials);
router.route("/connection-status").get(getConnectionStatus);
router.route("/revealed-cred-status").get(getRevealedCredStatus);
router.route("/credential-status").get(getCredentialStatus);
router.route("/connection-info").get(getConnectionInfo);
router.route("/set-globals").get(setGlobals);
router.route("/set-connectionid").get(setConnectionId);

/*                                 page render                                 */
router.route("/generate_invitation_page").get((req, res) => {
  try {
    res.status(200).render("generate_invitation.pug");
  } catch (e) {
    console.log(e.message);
    res.status(500).render("error.pug");
  }
});

router.route("/schema_def_page").get(isAdmin,(req, res) => {
  try {
    res.status(200).render("schema.pug");
  } catch (e) {
    console.log(e.message);
    res.status(500).render("error.pug");
  }
});

// comes submit req from select_schema.pug
router.route("/get-credential").post(isAuthenticated,async (req, res) => {
  try {
    let response = await axios.get(my_server + "/schemas");
    const schemas = response.data;
    let selected_schema = schemas.filter(
      (schema) => schema.id === req.body.schema_id
    )[0];
    global_schema_def = selected_schema.id;
    res.status(200).render("issue_credential.pug", {
      schema_id: selected_schema.id,
      attrs: selected_schema.attrNames,
    });
  } catch (e) {
    console.log(req.originalUrl + " -> " + e.message);
    res.status(500).render("error.pug");
  }
});

router.route("/select_schema").get(isAuthenticated,async (req, res) => {
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

router.route("/request_proofs").get(async (req, res) => {
  let response;
  try {
    if (!req.session.connection_id) {
      res.redirect("/login-page");
    } else {
      global_connection_id = req.session.connection_id;

      response = await axios.get(my_server + "/schemas");
      res
        .status(200)
        .render("request_proofs.pug", { schema_names: response.data });
    }
  } catch (e) {
    console.log(e.message);
    res.status(500).render("error.pug");
  }
});

router.route("/agent_info_page").get(isAdmin,async (req, res) => {
  try {
    let response = await axios.get(my_server + "/schemas");
    const schemas = response.data;
    // response = await axios.get(my_server + "/credential-definitions");
    // const cred_defs = response.data;
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
      // cred_defs: cred_defs,
      records: cred_records,
      connections: connections,
    });
  } catch (e) {
    console.log(e.message);
    res.status(500).render("error.pug");
  }
});

router.route("/mobile-agent-connection-invitation").get(async (req, res) => {
  res.status(200).render("invitation.pug");
});
router.route("/credential_received").get(async (req, res) => {
  res.status(200).render("credential_received.pug");
});
router.route("/mobile-agent-connection").get(async (req, res) => {
  res.status(200).render("qrcode", qr_data);
});
/*                                 page render                                 */

/*                                 BASIC SP                                 */

/*                                 BASIC SP                                 */

/*                                 BASIC IDP                                 */
router.route("/user-profile").get(isAuthenticated, async (req, res) => {
    res.render("user-profile.pug");
});

router
  .route("/references")
  .get(isAdmin,async (req, res) => {
    try {
      const references = await ReferenceService.getAll();
      res.render("reference-list.pug", { references, title: "References" });
    } catch (e) {
      res.render("error", { message: e.message, error: e });
    }
  })
  .post(async (req, res) => {
    try {
      console.log("REQ BODY", req.body);

      const reference = await ReferenceService.create({
        reference: req.body.refr,
        isAdded: false,
        domain: req.body.domain,
        organization: req.body.org,
      });
      res.status(201).json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(400).json({ success: false });
    }
  });

router.route("/form").get(isAdmin,async (req, res) => {
  try {
    res.render("reference-form.pug", { title: "Reference Form" });
  } catch (e) {
    res.render("error", { message: e.message, error: e });
  }
});

router.route("/add-org").get(async (req, res) => {
  try {
    res.render("reference-check.pug", { title: "Add To Registry" });
  } catch (e) {
    res.render("error", { message: e.message, error: e });
  }
});

router.route("/add-org").post(async (req, res) => {
  try {
    // Check if the provided reference exists in my database
    const doc = await ReferenceService.getModelByReference(req.body.refr);
    console.info("DOC->", doc);
    if (!doc) throw new Error("Reference doesn't exist!");
    // reference exists now time to see if it resolves from blockchain
    const constructed_url =
      process.env.MY_SERVER + "/resolve-did?did=" + req.body.did;
    let response = await axios.get(constructed_url);
    let data = {
      refr: process.env.MYREFRENCE_PREVIOUSLY_SHARED_WITH_OTHER,
      did: process.env.DID,
    };
    // did exists in the block chain now basically tell other party to add me
    response = await axios.post(
      doc.domain + "/federation-entry-acknowledgement",
      data
    );
    if (!response.success) throw new Error("Failed to get acknowledgement!");
    // Acknowledement received that other party added me to their registry
    data = {
      domain: doc.domain,
      org: doc.organization,
      did: req.body.did,
    };

    // Finally i'll add to my registry
    response = await axios.post(process.env.FABRIC, data);
    res.status(201).json({ success: true });
  } catch (e) {
    console.error(e.message);
    res.status(400).json({ success: false, error: e.message });
  }
});

// no frontend
router.route("/federation-entry-acknowledgement").post(async (req, res) => {
  try {
    const doc = await ReferenceService.getModelByReference(req.body.refr);
    if (!doc) throw new Error("Reference doesn't exist!");
    // if the party is already added to registry then just send acknowledement
    if (doc.isAdded) {
      res.status(201).json({ success: true });
    } else {
      // otherwise resolving DID
      const constructed_url =
        process.env.MY_SERVER + "/resolve-did?did=" + req.body.did;
      let response = await axios.get(constructed_url);
      let data = {
        domain: doc.domain,
        org: doc.domain,
        did: req.body.did,
      };
      // add to registry
      response = await axios.post(process.env.FABRIC, data);
      updateIsAdded = await ReferenceService.updateIsAdded(req.body.refr);
      res.status(201).json({ success: true });
    }
  } catch (e) {
    console.error(e.message);
    res.status(400).json({ success: false, error: e.message });
  }
});

/*                                 BASIC IDP                                 */

/*                                 PART OF SP-IDP dance: IDP                                 */

router
  .route("/prove")
  .get(isAuthenticated, (req, res) => {
    const source = req.query.source || "unknown";
    const attributes = req.query.attribute
      ? JSON.parse(decodeURIComponent(req.query.attribute))
      : [];

    console.log("Source", source);
    console.log("Attributes", attributes);
    global_attributes = attributes;
    req.session.attributes = attributes;
    console.log("Session Attributes", req.session.attributes);
    res.render("prove.pug", { source, attributes });
  })
  .post(isAuthenticated, (req, res) => {
    console.log("PROOF REQUEST BODY FROM SP", req.body);
    // if (req.body.name === "eshan") {
    //   const id = "20101498";
    //   const did = "X2J134AM41TX2";
    //   const email = "2016mehrab@gmail.com";
    //   const gender = "Male";
    //   const country = "Bangladesh";
    //   const name = "Mehrab";
    //   const data = {
    //     email,
    //     gender,
    //     name,
    //     country,
    //     did,
    //     id,
    //   };
    //   const hmac = generateHmac(data);
    //   const queryString = Object.entries({ ...data, hmac })
    //     .map(([key, value]) => `${key}=${value}`)
    //     .join("&");

    //   console.log(queryString);
    //   res.redirect(req.body.source + "/callback" + "?" + queryString);
    // }
    // const hmac = generateHmac(data);
    // const queryString = Object.entries({ ...data, hmac })
    //   .map(([key, value]) => `${key}=${value}`)
    //   .join("&");

    // console.log(queryString);
    // res.redirect(req.body.source + "/callback" + "?" + queryString);
  });

/*                                 PART OF SP-IDP dance: IDP                                 */

/*                                  Admin                                 */

router
  .route("/admin-login")
  .get((req, res) => {
    res.render("admin-login.pug");
  })

  .post( async (req, res) => {
    const { name, password } = req.body;
    if (password === "admin") {
      req.session.admin = {
        name: name,
      };
      res.redirect("/agent_info_page");
      return;
    }
    res.redirect("/admin-login");
  });


router.route("/logout").get((req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect("/");
    }
    res.clearCookie("connect.sid"); // Clear the cookie
    res.redirect("/"); // Redirect to the home page
  });
});

router
  .route("/webhooks/*")
  .get((req, res) => {
    res.status(200).send(`${req.method} - TO ${req.url}`);
  })

  .post(async (req, res) => {
    const connection_state = req.body["state"];
    const { rfc23_state } = req.body;
    // console.log("RFC23_state", rfc23_state);
    console.log("label state", req.body["their_label"]);
    if (connection_state === "active" && rfc23_state === "completed") {
      // req.session.user = {
      //   connection_id: req.body["connection_id"],
      //   user_name: req.body["their_label"],
      // };
      // console.log("req.session",req.session.user );
      global_connection_id = req.body["connection_id"];
    }

    if (req.body["verified"] === "true") {
      global_attributes?.forEach((attribute) => {
        global_revealed_attrs[attribute] =
          req.body.presentation.requested_proof.revealed_attrs[attribute].raw;
      });
      req.session.revealed_attrs = global_revealed_attrs;
    } else {
      global_revealed_attrs = {};
      req.session.revealed_attrs = null;
    }
    console.log("Global revealed attrs", global_revealed_attrs);
    console.log("session revealed attrs", req.session.revealed_attrs);
    // console.log("hostname ->", req.hostname, "ip->", req.ip, " ->", req.body);
  });
module.exports = router;
