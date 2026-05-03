import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import AppDataSource from "./config/data-source.js";
import authMiddleware from "./middleware/authMiddleware.js";
import roleMiddleware from "./middleware/roleMiddleware.js";

import { User } from "./entities/User.js";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// tokens
const generateAccessToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

const generateRefreshToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

// DB INIT
AppDataSource.initialize()
  .then(() => {
    console.log("DB Connected");

    const userRepo = AppDataSource.getRepository("User");

    // REGISTER
    app.post("/register", async (req, res) => {
      const { name, email, password, role } = req.body;

      const exists = await userRepo.findOneBy({ email });
      if (exists) return res.status(400).json({ message: "User exists" });

      const hashed = await bcrypt.hash(password, 10);

      const user = userRepo.create({
        name,
        email,
        password: hashed,
        role: role || "user",
      });

      await userRepo.save(user);

      res.json({ message: "User registered" });
    });

    // LOGIN
    app.post("/login", async (req, res) => {
      const { email, password } = req.body;

      const user = await userRepo.findOneBy({ email });
      if (!user) return res.status(400).json({ message: "Invalid login" });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(400).json({ message: "Invalid login" });

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      user.refreshToken = refreshToken;
      await userRepo.save(user);

      res.json({ accessToken, refreshToken });
    });

    // PROFILE (ANY LOGGED IN USER)
    app.get("/profile", authMiddleware, async (req, res) => {
      const user = await userRepo.findOneBy({ id: req.user.id });
      res.json(user);
    });

    // ADMIN ONLY
    app.get(
      "/admin",
      authMiddleware,
      roleMiddleware("admin"),
      (req, res) => {
        res.json({ message: "Welcome Admin 🔥" });
      }
    );

    app.listen(PORT, () => {
      console.log("Server running on port", PORT);
    });
  })
  .catch((err) => {
    console.log("DB Error:", err);
  });