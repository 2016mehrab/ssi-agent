const url = "http://127.0.0.1:8021";
const axios = require("axios");

exports.getAllPresentProofs = async (req, res) => {
  try {
    const response = await axios.get(url + "/present-proof-2.0/records");
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

exports.postPresentProof = async (req, res) => {
  let response;
  try {
    response = await axios.get(my_server + "/connections");

    let data = {
      auto_verify: true,
      auto_remove: false,
      // connection_id: response.data.results[0].connection_id,
      connection_id: global_connection_id,
      presentation_request: {
        indy: {
          non_revoked: {},
          name: "Proof Grade",
          requested_attributes: {
            additionalProp1: {
              name: req.body.attr_name,
              restriction: [{}],
            },
          },
          requested_predicates: {},
          version: "1.0",
        },
      },
      trace: true,
    };

    response = await axios.post(url + "/present-proof-2.0/send-request", data, {
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

exports.deleteAllPresentProofs = async (req, res) => {
  try {
    let response = await axios.get(url + "/present-proof-2.0/records");
    let pres_ex_ids = response.data.results.map((e) => e.pres_ex_id);
    pres_ex_ids.map(async (e) => {
      response = await axios.delete(url + "/present-proof-2.0/records/" + e);
      if (response.status !== 200) throw Error("Could not delete record");
    });
    res.status(202).send(`Method- ${req.method} Endpoint- ${req.originalUrl}`);
  } catch (error) {
    console.log(error.message);
    res.status(500).json(error.message);
  }
};
