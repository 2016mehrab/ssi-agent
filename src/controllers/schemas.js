const axios = require('axios');
const url = "http://127.0.0.1:8021";

exports.getAllSchemas = async (req, res) => {
  try {
    let response = await axios.get(url + "/schemas/created");
    let schema_ids = response.data.schema_ids;
    let schema_infos = [];

    let promises = schema_ids.map(async (id) => {
      try {
        response = await axios.get(url + "/schemas/" + id);
        schema_infos.push(response.data.schema);
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
}

exports.postSchema = async (req, res) => {
  try {
    console.log(req.body);
    let attr = req.body.attributes.split(",");
    // remove white trailing white spaces
    attr = attr.map((e) => e.trim());
    const data = {
      attributes: attr,
      schema_name: req.body.schema_name,
      schema_version: "1.0",
    };
    console.log(data);

    const response = await axios.post(url + "/schemas", data, {
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
}