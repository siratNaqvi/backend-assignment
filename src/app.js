// import express from "express";
// import userRoutes from "./routes/userRoutes.js";
// import resultRoutes from "./routes/resultRoutes.js";
// import AppDataSource from "./config/data-source.js";

// const resultRepository = AppDataSource.getRepository("Result");

// const app = express();
// app.listen(3000, () => {
//   console.log("Server running on port 3000");
// });
// app.use(express.json());

// app.use("/users", userRoutes);
// app.use("/results", resultRoutes);

// app.get("/results", async (req, res) => {
//   try {
//     const results = await resultRepository.find();
//     res.json(results);
//   } catch (error) {
//     res.status(500).json({
//       message: "Error fetching results",
//       error: error.message
//     });
//   }
// });

// app.get("/results/:name", async (req, res) => {
//   try {
//     const results = await resultRepository.find({
//       where: { student_name: req.params.name }
//     });

//     res.json(results);
//   } catch (error) {
//     res.status(500).json({
//       message: "Error fetching student results",
//       error: error.message
//     });
//   }
// });

// export default app;
const express = require("express");
const app = express();

const userRoutes = require("./routes/userRoutes");

app.use(express.json());
app.use(userRoutes);

module.exports = app;