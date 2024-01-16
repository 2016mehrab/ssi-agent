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
          res.status(200).send("Successfully established connection!");
        } else {
          res.status(503).send("failed to established connection.");
        }
      }, 3000);


    } catch (error) {
      console.log(error);
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

      // let response = await axios.post(url+"/connections/create-invitation?auto_accept=true&alias=" + req.body.alias, req.body, {
      //   headers: {
      //     accept: "application/json",
      //     "Content-Type": "application/json",
      //   },
      // });
      res.status(202).send(`${req.method} - ${req.url}`);
    } catch (error) {
      console.log(error.message);
    }
  });
};
export default routes;
