import express from "express";
import webhookRoutes from "./src/routes/webhookRoutes.js";
import routes from "./src/routes/routes.js";
import mongoose from "mongoose";
import path from 'path';

const app = express();
const PORT = 3000;
const MONGO_URL = "mongodb://localhost:37017/";
// Set the view engine to Pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({extended:true}));
routes(app);

app.get("/", (req, res) => {
  res.render('home');
});
try {
  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });
} catch (error) {
  console.error(error);
}
