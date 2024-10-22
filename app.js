var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");

var indexRouter = require("./routes/index");
var authRouter = require("./routes/auth");
var waiterRouter = require("./routes/waiters");
var foodTypeRouter = require("./routes/foodTypes");
var categoriesRouter = require("./routes/categories");
var productsRouter = require("./routes/products");
var customersRouter = require("./routes/customers");
var cartRouter = require("./routes/cart");
var orderRouter = require("./routes/orders");
var tableRouter = require("./routes/tables");
var kitchenRouter = require("./routes/kitchen");
var barRouter = require("./routes/bar");

var app = express();
const dotEnv = require('dotenv');

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
// Make the 'uploads' folder publicly accessible via '/uploads' URL
app.use('/uploads', express.static('uploads'));
app.use("/auth", authRouter);
app.use("/waiters", waiterRouter);
app.use("/kitchen", kitchenRouter);
app.use("/bar", barRouter);
app.use("/foodTypes", foodTypeRouter);
app.use("/categories", categoriesRouter);
app.use("/products", productsRouter);
app.use("/customers", customersRouter);
app.use("/cart", cartRouter);
app.use("/orders", orderRouter);
app.use("/tables", tableRouter);

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
