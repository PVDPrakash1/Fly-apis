var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");

var indexRouter = require("./routes/index");
var foodTypeRouter = require("./routes/foodTypes");
var categoriesRouter = require("./routes/categories")

var app = express();
const dotEnv = require('dotenv');
const Category = require("./models/category");

// Define the path to the .env file
console.log(__dirname)
console.log(process.env.NODE_ENV);
const configFile = path.resolve(__dirname, `.env.${process.env.NODE_ENV}`);
const config = dotEnv.config({ path: configFile }).parsed;

app.use(
  cors({
    origin: "*",
  })
);

console.log(config);

// Connect to MongoDB
mongoose
  .connect(config.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/foodTypes", foodTypeRouter);
app.use("/categories", categoriesRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
