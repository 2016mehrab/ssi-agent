const url = "http://127.0.0.1:8021";
const axios = require("axios");

exports.getAllCredentials = async (req, res) => {
  try {
    let response = await axios.get(url + "/credentials");
    res.status(200).json(response.data.results);
  } catch (error) {
    console.log(error.message);
    res.status(500).json(error.message);
  }
};

exports.deleteAllCredentials = async (req, res) => {
  try {
    let response = await axios.get(url + "/credentials");
    let cred_ids = response.data.results.map((e) => e.referent);
    cred_ids.map(async (e) => {
      response = await axios.delete(url + "/credential/" + e);
      if (response.status !== 200) throw Error("Could not delete connection");
    });
    res.status(202).send(`Method- ${req.method} Endpoint- ${req.originalUrl}`);
  } catch (error) {
    console.log(error.message);
    res.status(500).json(error.message);
  }
};
