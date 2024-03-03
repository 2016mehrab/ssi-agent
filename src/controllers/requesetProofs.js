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
  try {
    response = await axios.get(my_server + "/connections");

    // res.status(200).json(data);
  } catch (e) {
    // res.status(500).json({ message: "problem while getting connections" });
    res.status(500).json({ message: e.message });
  }
  // TODO: fix replacement_id & connection_id
  console.log("attr_val", req.body.attr_val);

  let data = {
    // connection_id: response.data.results[0].connection_id,
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
      requested_predicates: {
        // additionalProp1: {
        //   name: req.body.attr_name,
        //   value: req.body.attr_val,
        //   p_type: ">=",
        //   p_value:req.body.attr_val ,
        // restriction: [{}],
        // },
      },
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
