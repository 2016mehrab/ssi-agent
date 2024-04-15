const axios = require("axios");
const url = "http://127.0.0.1:8021";
const my_server = "http://127.0.0.1:3000";
const ngrok_url = "http://127.0.0.1:4040/api/tunnels";

async function getConnections(req, res) {
  try {
    let response = await axios.get(url + "/connections");
    res.status(202).json(response.data);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
}

async function deleteConnections(req, res) {
  try {
    let response = await axios.get(url + "/connections");
    let connection_ids = response.data.results.map((e) => e.connection_id);

    // delete all connections
    connection_ids.map(async (e) => {
      response = await axios.delete(url + "/connections/" + e);
      if (response.status !== 200) throw Error("Could not delete connection");
    });
    global_connection_id = null;
    global_connection_status = null;
    res.status(202).json({ message: "Connections deleted" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
}

async function createConnection(req, res) {
  const { my_label, alias, agent_controller } = req.body;

  try {
    // getting my agent's endpoint
    let response = await axios.get(ngrok_url);
    const tunnels = response.data.tunnels;
    const endpoint_info = tunnels.find(
      (tunnel) => tunnel.name === "controller"
    );
    const myendpoint = endpoint_info.public_url;
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
    response = await axios.post(agent_controller + "/webhooks", decodedString, {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    // waiting for sometime for the `state` to be active
    setTimeout(async () => {
      response = await axios.get(my_server + "/connections");

      // TODO: need to be dynamic
      if (response.data.results[0].state === "active") {
        res.status(202).json({ success: true });
      } else {
        res.status(500).json({ success: false });
      }
    }, 10000);
  } catch (error) {
    console.log(error.message);
    res.status(503).json({ success: false });
  }
}

module.exports = {
  createConnection,
  getConnections,
  deleteConnections,
};
