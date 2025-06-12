const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const productRoutes = require("./routes/products");
app.use("/api/products", productRoutes);

app.listen(5000, () => {
  console.log("Server running at http://localhost:5000");
});
