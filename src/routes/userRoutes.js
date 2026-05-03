// import express from "express";
// const router = express.Router();

// import roleMiddleware from "../middleware/roleMiddleware.js";
// // import fakeAuth from "../middleware/fakeAuth.js";
// import authMiddleware from "../middleware/authMiddleware.js";
// import {
//   register,
//   login,
//   getAllUsers,
//   getUserById,
//   updateUser,
//   deleteUser,
// } from "../controllers/userController.js";

// console.log("User routes loaded");
// console.log("ADMIN ROUTE LOADED");
// // 👇 APPLY FAKE AUTH TO ALL ROUTES BELOW
// router.post("/register", register);

// router.post("/register", register);
// router.post("/login", login);

// router.get(
//   "/admin",
//   authMiddleware,
//   roleMiddleware("admin"),
//   (req, res) => {
//     res.json({ message: "Welcome Admin" });
//   }
// );

// router.get("/users", getAllUsers);
// router.get("/users/:id", getUserById);
// router.put("/users/:id", updateUser);
// router.delete("/users/:id", deleteUser);

// export default router;

const express = require("express");
const router = express.Router();
const pool = require("../db");

router.post("/users", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO users(name, email, password) VALUES($1,$2,$3) RETURNING *",
      [name, email, password]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;