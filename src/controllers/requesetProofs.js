const axios = require("axios");
const url = "http://127.0.0.1:8021";
const my_server = "http://127.0.0.1:3000";

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
  console.log("attr_val", req.body.attr_val);

  let data = {
    connection_id: global_connection_id,
    trace: true,
    proof_request: {
      name: "Prove to IDP",
      version: "1.0",
      requested_attributes: {
        additionalProp1: {
          name: req.body.attr_name,
          value: req.body.attr_val,
          restriction: [
            {
              schema_name: req.body.schema_name,
            },
          ],
        },
      },
      requested_predicates: {},
    },
  };

  try {
    response = await axios.post(url + "/present-proof/send-request", data, {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    res.status(200).json(response.data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

//  TODO: Set connection id
//  TODO: check if schema_id properly works
//  TODO: consider adding deleting v2 proof records
//  TODO: consider setting global schema def
//  TODO: Send the request

exports.requestProofV2 = async (req, res) => {
  let response;
  let attrs = req.body.attributes.split(",");
  // remove white trailing white spaces
  attrs = attrs.map((e) => e.trim());

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

    res.status(200).render("waiting.pug");
  } catch (e) {
    res.status(500).json({ message: e.message });
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
