var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");
const { io } = require('./bin/www');


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
var billRouter = require("./routes/bill");

var app = express();
app.set('socketio', io);

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
app.use("/bill", billRouter);

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

const escPosEncoder = require('esc-pos-encoder');
const net = require('net');



const printerIp = '192.168.1.1';  // Replace with your printer's IP
const printerPort = 9100;           // Default port for many POS printers

// Sample data to print
const orderData = {
  orderId: 12345,
  table: 1,
  customer: 'John Doe',
  items: [
    { name: 'Pizza', quantity: 2, price: 10 },
    { name: 'Pasta', quantity: 1, price: 8 },
  ],
  total: 28,
};

const printer = new escPosEncoder();

// Initialize TCP/IP connection to the printer
const client = new net.Socket();
client.connect(printerPort, printerIp, () => {
  const buffer = printer.initialize();  // Initialize the printer
  buffer.push(...printer.text(`Order #${orderData.orderId}\n`));
  buffer.push(...printer.text(`Table ${orderData.table}\n`));
  buffer.push(...printer.text(`Customer: ${orderData.customer}\n`));
  buffer.push(...printer.text('Items:\n'));

  orderData.items.forEach(item => {
    buffer.push(...printer.text(`${item.name} x ${item.quantity} - $${item.price}\n`));
  });

  buffer.push(...printer.text(`Total: $${orderData.total}\n`));
  buffer.push(...printer.cut());

  // Send the buffer to the printer
  client.write(Buffer.from(buffer));

  // Listen for the printer's response to confirm success or failure
  client.on('data', (data) => {
    console.log('Printer response:', data.toString());
    // Here you can check the response to determine whether it was successful
    // or if there was an error (e.g., printer busy, out of paper, etc.)
    if (data.includes('Success')) {
      console.log('Print job successful');
    } else {
      console.log('Print job failed');
    }
  });

  // Close the connection after sending the print job
  client.end();
});

client.on('error', (err) => {
  console.log('Connection error:', err);
});
