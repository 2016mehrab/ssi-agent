const express = require("express");
const router = express.Router();
require("dotenv").config();
const axios = require("axios");
const my_server = process.env.MY_SERVER;
const ReferenceService = require("../services/referenceService.js");
const {
  isAuthenticatedSP,
  isAdmin
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
} = require("../controllers/misc.js");

/* GLOBAL */
global.global_issuer_did = null;
global.global_connection_status = null;
global.global_credential_status = null;
global.global_schema_def = null;
global.global_cred_def = null;
global.global_connection_id = null;
/* GLOBAL */

/*                                 api                                         */
router
  .route("/connections")
  .get(getConnections)
  .post(createConnection)
  .delete(deleteConnections);


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
  .post(requestProof)
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
router.route("/credential-status").get(getCredentialStatus);
router.route("/connection-info").get(getConnectionInfo);
router.route("/set-globals").get(setGlobals);
router.route("/set-connectionid").get(setConnectionId);


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
      await ReferenceService.updateIsAdded(req.body.refr);
      res.status(201).json({ success: true });
    }
  } catch (e) {
    console.error(e.message);
    res.status(400).json({ success: false, error: e.message });
  }
});

router
  .route("/references")
  .get(isAdmin, async (req, res) => {
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
      await ReferenceService.create({
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

router.route("/form").get(isAdmin, async (req, res) => {
  try {
    res.render("reference-form.pug", { title: "Reference Form" });
  } catch (e) {
    res.render("error", { message: e.message, error: e });
  }
});
/*                                 PART OF SP-IDP dance: SP                                 */

// router.get("/service-index", isAuthenticatedSP, function (req, res) {
//   res.render("service-index.pug", { user: req.session.user.user_email });
// });

router.get("/service", isAuthenticatedSP, function(req, res) {
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
      references = references.filter(issuer => issuer.isAdded);
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
    const redirectUrl = `${req.body.reference_domain
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

router
  .route("/webhooks/*")
  .get((req, res) => {
    res.status(200).send(`${req.method} - TO ${req.url}`);
  })

  .post(async (req, res) => {
    // const connection_state = req.body["state"];
    // const { rfc23_state } = req.body;
    // console.log("RFC23_state", rfc23_state);
    // console.log("Connection state", connection_state);
    // if (connection_state === "active" && rfc23_state === "completed") {
    //   req.session.connection_id = req.body["connection_id"];
    //   global_connection_id = req.body["connection_id"];
    // }
    // console.info("Session->", req.session.connection_id);
    console.log("hostname ->", req.hostname, "ip->", req.ip, " ->", req.body);
  });
module.exports = router;
