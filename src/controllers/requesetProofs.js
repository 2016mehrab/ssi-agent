require("dotenv").config();

const { generateHmac, log,verifyHmac } = require("../../utils/index.js");
const axios = require("axios");
const url = "http://127.0.0.1:8021";
const my_server = process.env.MY_SERVER;

exports.getProofRecords = async (req, res) => {
  try {
    const response = await axios.get(url + "/present-proof/records");
    let proof_records = response.data.results;
    proof_records.forEach((item) => {
      delete item.pres_ex_proposal;
      delete item.verified_msgs;
      delete item.auto_present;
      delete item.auto_remove;
      delete item.by_format;
      delete item.error_msg;
      delete item.thread_id;
      delete item.pres_request;
      delete item.pres;
    });
    res.status(200).json(proof_records);
  } catch (e) {
    console.log(e.message);
    res.status(500).json(e.message);
  }
};

exports.requestProof = async (req, res) => {
  let response;
  // response = await axios.get(my_server + "/set-connectionid");
  let attrs = req.body.attributes.split(",");
  // if(!req.session.connection_id){
  //   res.redirect("/login");
  // }

  // const hmac = generateHmac(data);
  // const queryString = Object.entries({ ...data, hmac })
  //   .map(([key, value]) => `${key}=${value}`)
  //   .join("&");

  // console.log("queryString",queryString);

  attrs = attrs.map((e) => e.trim());
  // console.info("REQUEST BODY", req.body);
  const schema_id = process.env.SCHEMA_ID;
  const attributes = JSON.parse(req.body.attributes);
  // console.log("attributes after PARSE", attributes);
  // Step 2: Split the attributes string into an array
  // const attributesArray = attributes.split(", ").map((attr) => attr.trim());
  // console.log("attributesArray", attributesArray);

  // Step 3: Create an object for each attribute
  let requestedAttributes = {};
  // attributesArray.forEach((attribute) => {
  attributes.forEach((attribute) => {
    requestedAttributes[attribute] = {
      name: attribute,
      restrictions: [
        {
          schema_id: schema_id,
        },
      ],
    };
  });

  // console.log("requested Attributes", JSON.stringify(requestedAttributes));

  let data = {
    connection_id: req.session.connection_id,
    trace: true,
    auto_remove:true,
    proof_request: {
      name: "Prove to IDP",
      version: "1.0",

      requested_attributes: requestedAttributes,
      requested_predicates: {},
    },
  };

  // console.log("sent data will be", JSON.stringify(data));
  try {
    response = await axios.post(url + "/present-proof/send-request", data, {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const maxAttempts = 20; // Number of attempts (1.5 per second)
    let success = false;
    for (let i = 0; i < maxAttempts; i++) {
      const statusResponse = await axios.get(my_server+ "/revealed-cred-status", {
        headers: {
          accept: "application/json",
        },
      });
      // console.log("status response", statusResponse.data);
      if (statusResponse.data.success === true) {
        success = true;
        // console.log("Inside condition" );
        break;
      }
      // process.stdout.write("^");
      await new Promise((resolve) => setTimeout(resolve, 2500)); 
    }

    if (!success) {
      throw new Error("Server error");
    }

    // console.log("current request session-1", req.session.attributes);
    // console.log("current request session-2", req.session.connection_id);
    // console.log("current request session-3", req.session.revealed_attrs);
    
    log(req.originalUrl,req.session.revealed_attrs);
    global_revealed_attrs.did=process.env.IDP_DID;
    const hmac = generateHmac(global_revealed_attrs);
    const queryString = Object.entries({ ...global_revealed_attrs, hmac })
      .map(([key, value]) => `${key}=${value}`)
      .join("&");

    let redirectURL=req.body.source + "/callback" + "?" + queryString;
    console.info("Redirect Query String", redirectURL);
      
    res.redirect(redirectURL);
    // res.status(200).render("waiting.pug");
  } catch (e) {
    console.log();
    console.log();
    console.log();
    // console.error("from",req.originalUrl,"error",e.message);
    log(req.originalUrl,e.message)
    // res.redirect("http://localhost:3003");
    res.status(500).render("error");
    // res.status(500).json({ message: e.message });
  }
};

//  TODO: Set connection id
//  TODO: check if schema_id properly works
//  TODO: consider adding deleting v2 proof records
//  TODO: consider setting global schema def
//  TODO: Send the request

exports.requestProofV2 = async (req, res) => {
  let response;
  response = await axios.get(my_server + "/set-connectionid");
  let attrs = req.body.attributes.split(",");
  // remove white trailing white spaces
  attrs = attrs.map((e) => e.trim());

  console.info("REQUEST BODY", req.body);
  let data = {
    connection_id: global_connection_id,
    trace: true,
    presentation_request: {
      indy: {
        name: "Prove Your Age",
        version: "1.0",
        requested_attributes: {
          Info: {
            names: [...attrs],
            restrictions: [
              {
                schema_id: req.body.schema_id,
              },
            ],
          },
        },
        requested_predicates: {
          Above: {
            name: "Age",
            p_type: ">=",
            p_value: parseInt(req.body.age),
            restrictions: [
              {
                schema_id: req.body.schema_id,
              },
            ],
          },
        },
      },
    },
  };

  console.log("REQ BODY", req.body);
  console.log("Attrs", attrs);
  console.log("CONSTR DATA", JSON.stringify(data));
  try {
    response = await axios.post(url + "/present-proof-2.0/send-request", data, {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
    });


    response = await axios.post(my_server + "/revealed-cred-status");
    if (!response.data.success) throw new Error("Fail to get attributes");
    console.log("attrs from response", response.data.attrs);
    const hmac = generateHmac(data);
    const queryString = Object.entries({ ...data, hmac })
      .map(([key, value]) => `${key}=${value}`)
      .join("&");

    console.log(queryString);
    res.redirect(req.body.source + "/callback" + "?" + queryString);
    // res.status(200).render("waiting.pug");
  } catch (e) {
    res.status(400).render("error.pug");
    // res.status(500).json({ message: e.message });
  }
};

exports.deleteProofRecords = async (req, res) => {
  try {
    let response = await axios.get(url + "/present-proof/records");
    let pres_ex_ids = response.data.results.map(
      (e) => e.presentation_exchange_id
    );
    pres_ex_ids.map(async (e) => {
      response = await axios.delete(url + "/present-proof/records/" + e);
      if (response.status !== 200) throw Error("Could not delete record");
    });
    res.status(202).send(`Method- ${req.method} Endpoint- ${req.originalUrl}`);
  } catch (error) {
    console.log(error.message);
    res.status(500).json(error.message);
  }
};
