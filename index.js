const express = require("express");
var cors = require("cors");
const connection = require("./connection");
const userRoute = require("./routes/user");
const categoryRoute = require("./routes/category");
const exerciseRoute = require("./routes/exercise");
const planRoute = require("./routes/exercisePlan");
const powerliftingRoute = require("./routes/powerlifting")
const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/user", userRoute);
app.use("/category", categoryRoute);
app.use("/exercise", exerciseRoute);
app.use("/plan", planRoute);
app.use("/powerlifting", powerliftingRoute)

module.exports = app;
