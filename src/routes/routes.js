// res.status(200).send(`${req.method} - ${req.originalUrl}`);
const url = "http://127.0.0.1:8021";
const my_server = "http://127.0.0.1:3000";
const ngrok_url = "http://127.0.0.1:4040/api/tunnels";

// const controller_url = "https://a32a-103-67-67-222.ngrok-free.app";

const axios = require("axios");
const routes = (app) => {
  app.route("/create-connection").post(async (req, res) => {
    console.log(`Method- ${req.method} Endpoint- ${req.originalUrl}`);
    console.log(`Request Body-`, req.body);
    const { my_label, alias, agent_controller } = req.body;

    try {
      // getting my agent's endpoint
      let response = await axios.get(ngrok_url);
      const tunnels = response.data.tunnels;
      const endpoint_info = tunnels.find((tunnel) => tunnel.name === "third");
      const myendpoint = endpoint_info.public_url;
      console.log(`My Service Endpoint`, myendpoint);

      const data = {
        my_label: my_label,
        service_endpoint: myendpoint,
      };

      // creating an invitation
      response = await axios.post(
        url + "/connections/create-invitation?auto_accept=true&alias=" + alias,
        data,
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      // decoding invitation url
      let base64String = response.data.invitation_url.split("c_i=")[1];
      let decodedString = atob(base64String);

      // sending the invitation url to other agent
      response = await axios.post(
        agent_controller + "/webhook",
        decodedString,
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      // waiting for sometime for the `state` to be active
      setTimeout(async () => {
        response = await axios.get(my_server + "/connections");

        // TODO: need to be dynamic
        if (response.data.results[0].state === "active") {
          res.status(200).json({ success: true });
        } else {
          res.status(503).json({ success: false });
        }
      }, 3000);
    } catch (error) {
      console.log(error);
      res.status(503).json({ success: false });
    }
  });

  app.route("/ngrok").get(async (req, res) => {
    const response = await axios.get(ngrok_url);
    console.log(response.data);

    const tunnels = response.data.tunnels;
    const endpoint = tunnels.find((tunnel) => tunnel.name === "third");
    if (endpoint) {
      res.send(endpoint.public_url);
    } else {
      res.send('No tunnel named "third" found');
    }
  });

  app
    .route("/connections")
    .get(async (req, res) => {
      try {
        let response = await axios.get(url + "/connections");
        // let connection_ids = response.data.results.map((e) => e.connection_id);

        // res.status(202).send(connection_ids);
        res.status(202).send(response.data);
      } catch (error) {
        console.log(error.message);
        res.status(500).json(error.message);
      }
    })
    .delete(async (req, res) => {
      try {
        let response = await axios.get(url + "/connections");
        let connection_ids = response.data.results.map((e) => e.connection_id);
        console.log(connection_ids);

        // delete all connections
        connection_ids.map(async (e) => {
          response = await axios.delete(url + "/connections/" + e);
          if (response.status !== 200)
            throw Error("Could not delete connection");
        });
        res
          .status(202)
          .send(`Method- ${req.method} Endpoint- ${req.originalUrl}`);
      } catch (error) {
        console.log(error.message);
        res.status(500).json(error.message);
      }
    });

  /*                                 page render                                 */
  // schema webpage
  app.route("/schema_def_page").get((req, res) => {
    try {
      res.status(200).render("schema.pug");
    } catch (e) {
      console.log(e.message);
      res.status(500).render("error.pug");
    }
  });

  app.route("/cred_def_page").get(async (req, res) => {
    // TODO: cleanup
    try {
      let response = await axios.get(my_server + "/schemas");
      res
        .status(200)
        .render("credential_definition.pug", { schema_names: response.data });
    } catch (e) {
      console.log(e.message);
      res.status(500).render("error.pug");
    }
  });

  app.route("/issue_cred_page").get((req, res) => {
    try {
      res.status(200).render("issue_credential.pug");
    } catch (e) {
      console.log(e.message);
      res.status(500).render("error.pug");
    }
  });

  app.route("/agent_info").get(async (req, res) => {
    try {
      let response = await axios.get(my_server + "/schemas");
      const schemas = response.data;
      response = await axios.get(my_server + "/credential-definitions");
      const cred_defs = response.data;
      response = await axios.get(my_server + "/issue-credential");
      const cred_records =response.data;
      res
        .status(200)
        .render("agent_info.pug", { schemas: schemas, cred_defs: cred_defs, records:cred_records });
    } catch (e) {
      console.log(e.message);
      res.status(500).render("error.pug");
    }
  });

  app
    .route("/test")
    .get(async (req, res) => {
      res.status(200).render("test.pug");
    })
    .post((req, res) => {
      res.status(200).json({ success: true });
    });

  /*                                 page render                                 */

  /*                                 api                                         */
  // SCHEMA
  app
    .route("/schemas")
    //get all schema ids
    .get(async (req, res) => {
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
    })
    .post(async (req, res) => {
      try {
        console.log(req.body);
        let attr = req.body.attributes.split(",");
        // remove white trailing white spaces
        attr = attr.map((e) => e.trim());
        // console.log(attr);
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
        // console.log(response.data.sent.schema_id);
        // res.status(202).json({ schema_id: response.data.sent.schema_id });
        res.status(200).json({ success: true });
      } catch (e) {
        // res.status(500).send(e);
        res.status(500).json({ success: false });
        console.log(e.message);
      }
    });
  // CREDENTIAL DEF

  app
    .route("/credential-definitions")
    //get all schema ids
    .get(async (req, res) => {
      try {
        let response = await axios.get(url + "/credential-definitions/created");
        let cred_ids = response.data.credential_definition_ids;
        let cred_infos = [];
        console.log(cred_ids);

        let promises = cred_ids.map(async (id) => {
          try {
            response = await axios.get(url + "/credential-definitions/" + id);

            // response.data['credential_definition'].pop('value',None)
            delete response.data.credential_definition.value;
            cred_infos.push(response.data.credential_definition);
          } catch (e) {
            console.log("Error while fetching schema info", e.message);
          }
        });
        await Promise.all(promises);
        res.status(200).json(cred_infos);
      } catch (e) {
        res.status(200).json(e.message);
      }
    })
    .post(async (req, res) => {
      try {
        console.log(req.body);
        const data = {
          schema_id: req.body.schema_id,
          tag: req.body.tag,
        };
        const response = await axios.post(
          url + "/credential-definitions",
          data,
          {
            headers: {
              accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );
        // console.log(response.data);
        res.status(200).json({ success: true });
      } catch (e) {
        console.log(e.message);
        res.status(500).json({ success: false });
      }
    });

  app.route("/issue-credential").get(async (req, res) => {
    try {
      const response = await axios.get(url + "/issue-credential-2.0/records");
      let cred_records = response.data.results;
      cred_records.forEach((item) => {
        delete item.cred_ex_record.cred_offer;
        delete item.cred_ex_record.cred_proposal;
        delete item.cred_ex_record.by_format;
        delete item.indy;
        delete item.ld_proof;
      });
      // console.log(cred_records);
      res.status(200).json(cred_records);
    } catch (e) {
      console.log(e.message);
      res.status(500).json(e.message);
    }
  });

  app.route("/webhook").post(async (req, res) => {
    try {
      let url_string =
        url +
        "/connections/receive-invitation?auto_accept=true&alias=" +
        req.body.label;
      console.log(`Request Body`, req.body);
      console.log();
      console.log("url string", url_string);

      res.status(202).send(`${req.method} - ${req.url}`);
    } catch (error) {
      console.log(error.message);
    }
  });
};
export default routes;
