function getTime() {
  const time = new Date().toLocaleTimeString();
  return time;
}

const routes = (app) => {
  app
    .route("/webhooks/*")
    .get((req, res) => {
      res.status(200).send(`${req.method} request to ${req.path} successful`);
      console.log(
        `${getTime()} - ${req.method} request to ${req.path} from ${
          req.hostname
        } successful`
      );
      const connectionStatus = req.body["rfc23_state"];
      if (connectionStatus)
        console.log(`${connectionStatus} from ${req.hostname}`);
    })
    .post((req, res) => {
      console.log(
        `${getTime()} - ${req.method} request to ${req.path} from ${
          req.hostname
        } successful`
      );
      res.status(200).send(`${req.method} request to ${req.path} successful`);
      const connectionStatus = req.body["rfc23_state"];
      if (connectionStatus)
        console.log(`${connectionStatus} from ${req.hostname}`);
    });
};
export default routes;
