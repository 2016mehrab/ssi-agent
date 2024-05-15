require('dotenv').config()
const axios = require("axios");
const url = "http://127.0.0.1:8021";
const my_server = process.env.MY_SERVER;

exports.getAllSchemas = async (req, res) => {
  try {
    let response = await axios.get(url + "/schemas/created");
    let schema_ids = response.data.schema_ids;
    let schema_infos = [];

    let promises = schema_ids.map(async (id) => {
      try {
        response = await axios.get(url + "/schemas/" + id);
        if (response.data.schema) {
          schema_infos.push(response.data.schema);
        }
      } catch (e) {
        console.log("Error while fetching schema info", e.message);
      }
    });
    await Promise.all(promises);
    res.status(200).json(schema_infos);
  } catch (e) {
    res.status(500).send(e);
    console.log(e.message);
  }
};

exports.postSchema = async (req, res) => {
  try {
    console.log(req.body);
    let attr = req.body.attributes.split(",");
    // remove white trailing white spaces
    attr = attr.map((e) => e.trim());
    let data = {
      attributes: attr,
      schema_name: req.body.schema_name,
      schema_version: "1.0",
    };

    let response = await axios.post(url + "/schemas", data, {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    response = await axios.get(my_server + "/schemas");
    // Filtering out the credential definition ID with the same tag as schema name
    const filteredSchemaId = response.data.find((schema) => {
    return schema.name === req.body.schema_name 
    });
    data = {
      schema_id: filteredSchemaId.id,
      tag: req.body.schema_name,
    };
    response = await axios.post(url + "/credential-definitions", data, {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false });
    console.log(e.message);
  }
};
