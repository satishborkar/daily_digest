const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({
  path: "./config.env",
});

const app = require("./app");

/*************
 * DB CONNECTIONS
 * ***************/

const DB = process.env.DB_STRING.replace("<PASSWORD>", process.env.DB_PWD);

mongoose
  .connect(DB)
  .then(() => console.log("Connected to DB successfully."))
  .catch((err) => console.log("Unable to connect to DB", err));

const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, () => {
  console.log(`App is running on ${PORT}`);
});
