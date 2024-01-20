import express from "express";
import routes from "./src/routes/routes.js";
import path from 'path';

const app = express();
const PORT = 3000;
// Set the view engine to Pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

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
