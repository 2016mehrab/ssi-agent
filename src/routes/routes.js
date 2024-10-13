const express = require("express");
const router = express.Router();
require("dotenv").config();
const axios = require("axios");
const my_server = process.env.MY_SERVER;
const ReferenceService = require("../services/referenceService.js");
const {
  isAuthenticatedSP,
  isAuthenticatedForService,
  isAdmin,
} = require("../middlewares/auth-middleware.js");

const { generateHmac, verifyHmac, log } = require("../../utils/index.js");
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
      // res.status(200).render("NID-form.pug");
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

// TODO: Implement Request Proof from own website
router.route("/request_proofs").get(isAuthenticatedSP, async (req, res) => {
  let response;
  try {
    global_connection_id = req.session.user.connection_id;
    console.log("connection_id", global_connection_id);
    response = await axios.get(my_server + "/schemas");
    res
      .status(200)
      .render("request_proofs.pug", { schema_names: response.data });
  } catch (e) {
    console.log(e.message);
    res.status(500).render("error.pug");
  }
});

router.route("/issue_cred_page").get(isAdmin, (req, res) => {
  res.status(200).render("NID-form.pug");
});

router.route("/agent_info_page").get(isAdmin, async (req, res) => {
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

/*                                 BASIC IDP                                 */
router.route("/user-profile").get(isAuthenticatedSP, async (req, res) => {
  res.render("user-profile.pug");
});

/*                                 PART OF SP-IDP dance: IDP                                 */

router.route("/prove").get((req, res) => {
  res.render("prove.pug");
});

router.get("/service", isAuthenticatedForService, function (req, res) {
  res.render("service.pug", { user: req.session.user.user_name });
});

router
  .route("/signup_with_idp")
  .get(async (req, res) => {
    try {
      if (req.session.user) {
        // console.log("INSIDE SERVICE REDIRECT CONDITION");
        res.redirect("/service");
        return;
      }
      let references = await ReferenceService.getAll();
      references = references.filter((issuer) => issuer.isAdded);
      res.render("signup_with_idp.pug", { references, title: "References" });
    } catch (e) {
      res.render("error", { message: e.message, error: e });
    }
  })
  .post((req, res) => {
    // console.log("PATH", req.url, "REQUEST BODY", req.body);

    if (req.session.user) {
      // console.log("INSIDE SERVICE REDIRECT CONDITION");
      res.redirect("/service");
      return;
    }
    const domain = req.protocol + "://" + req.get("host");
    const attributes = JSON.stringify(["Email", "Id", "Name"]);
    console.info("Domain", domain, "Attrs", attributes);
    const redirectUrl = `${
      req.body.reference_domain
    }/prove?source=${domain}&attribute=${encodeURIComponent(attributes)}`;
    res.redirect(redirectUrl);
  });

router.get("/callback", (req, res) => {
  const queryString = req.query;
  let data = Object.fromEntries(new URLSearchParams(queryString));
  const receivedHmac = data.hmac;
  delete data.hmac;
  console.log("hash comparison result->", verifyHmac(data, receivedHmac));

  // TODO: compare did from fabric
  if (data.did && data.Email && verifyHmac(data, receivedHmac)) {
    req.session.user = { user_email: data.Email, user_name: data.Name };
    console.log("inside condition", req.session.user);
    res.redirect("/service");
  } else {
    res.send("Tampered data");
  }
});

router.route("/logout").get((req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect("/");
    }
    // NOTE: Clear the cookie
    res.clearCookie("connect.sid");
    global_revealed_attrs={};
    // NOTE: Redirect to the home page
    res.redirect("/");
  });
});

/*                                  User                                 */
router.route("/user-profile").get(isAuthenticatedSP, async (req, res) => {
  res.render("user-profile.pug");
});

/*                                  Admin                                 */

router
  .route("/admin-login")
  .get((req, res) => {
    res.render("admin-login.pug");
  })

  .post(async (req, res) => {
    const { name, password } = req.body;
    if (password === "admin") {
      req.session.admin = {
        name: name,
      };
      res.redirect("/references");
      return;
    }
    res.redirect("/admin-login");
  });

/*                                 PART OF SP-IDP dance: SP                                 */

/*                                  Admin                                 */

router
  .route("/admin-login")
  .get((req, res) => {
    res.render("admin-login.pug");
  })

  .post(async (req, res) => {
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
    if (connection_state === "active" && rfc23_state === "completed") {
      req.session.user = {
        connection_id: req.body["connection_id"],
        user_name: req.body["their_label"],
      };
      console.log("req.session", req.session.user);
      global_connection_id = req.body["connection_id"];
    }

    if (req.body["verified"] === "true") {
      console.log(req.body);
      console.log(
        "extracted val",
        req.body?.by_format?.pres?.indy?.requested_proof?.revealed_attrs[
          "issuer"
        ]?.raw
      );

      let x = ["name", "issuer"];
      x.forEach((attr) => {
        global_revealed_attrs[attr] =
          req.body?.by_format?.pres?.indy?.requested_proof?.revealed_attrs[
            attr
          ]?.raw;
      });
      // global_attributes?.forEach((attribute) => {
      //   global_revealed_attrs[attribute] =
      //     req.body.by_format.pres.indy.request_proof.revealed_attrs[
      //       attribute
      //     ].raw;
      // });
      // req.session.revealed_attrs = global_revealed_attrs;
    }
    // else {
    //   global_revealed_attrs = {};
    //   req.session.revealed_attrs = null;
    // }
    console.log(
      req.originalUrl,
      "global revealed attrs",
      global_revealed_attrs
    );
    // console.log("session revealed attrs", req.session.revealed_attrs);
    // console.log("hostname ->", req.hostname, "ip->", req.ip, " ->", req.body);
  });
module.exports = router;
