require("dotenv").config();
const express = require("express");
const path = require("path");
const routes = require("./src/routes/routes.js");

const mongoose = require("mongoose");
const app = express();
const PORT = process.env.PORT;
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const config = require("./config/index.js");
// Set the view engine to Pug
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: config.mongodb.url}),
  })
);

routes(app);

app.get("/", (req, res) => {
  console.log("visits", req.session.visits);
  res.render("home");
});

async function connectToMongoose() {
  return mongoose.connect(config.mongodb.url);
}
connectToMongoose()
  .then(() => {
    console.info(`Successfully connected to the DB`);
    app.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
    });
  })
  .catch((e) => {
    console.error(e);
  });
