const crypto = require("crypto");
exports.generateHmac = function (data) {
  const secret = "IDP's Reference secret";
  const hmac = crypto.createHmac("sha256", secret);
  console.log("Stringified data", JSON.stringify(data));
  const hmacData = hmac.update(JSON.stringify(data)).digest("hex");
  return hmacData;
};

exports.verifyHmac = function (data, receivedHmac) {
  const secret = "IDP's Reference secret";
  console.log("Received hmac", receivedHmac);
  console.log("data",JSON.stringify(data));
  const hmac = crypto.createHmac("sha256", secret);

  const calculatedHmac = hmac.update(JSON.stringify(data)).digest("hex");
  // const calculatedHmac = hmac.update(JSON.stringify(constructed_data)).digest("hex");
  console.log("Sent hmac", calculatedHmac);
  return calculatedHmac === receivedHmac;
};
exports.log = function (p, data) {
  console.log();
  console.log("*******log********");
  console.log();
  console.info(p+" "+"data"+" "+data);
  console.log();
  console.log("*******log********");
  console.log();
};
