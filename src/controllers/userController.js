import AppDataSource from "../config/data-source.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


import User from "../entities/User.js";
const userRepo = () => AppDataSource.getRepository(User);

//
// REGISTER
//
export const register = async (req, res) => {
  try {
    const { name, email, password, age, role } = req.body;

    const repo = userRepo();

    // check if user exists
    const existing = await repo.findOneBy({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const user = repo.create({
      name,
      email,
      password: hashedPassword,
      age,
      role: role || "user"   // ✅ FIXED ROLE ISSUE
    });

    await repo.save(user);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        age: user.age,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//
// LOGIN
//
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const repo = userRepo();

    const user = await repo.findOneBy({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // IMPORTANT: include role in token
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role   // ✅ FIXED
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // save refresh token in DB
    user.refreshToken = refreshToken;
    await repo.save(user);

    res.json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//
// GET ALL USERS
//
export const getAllUsers = async (req, res) => {
  try {
    const repo = userRepo();

    const users = await repo.find();

    const safeUsers = users.map(({ password, refreshToken, ...rest }) => rest);

    res.json(safeUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//
// GET USER BY ID
//
export const getUserById = async (req, res) => {
  try {
    const repo = userRepo();

    const user = await repo.findOneBy({ id: Number(req.params.id) });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password, refreshToken, ...safeUser } = user;

    res.json(safeUser);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//
// UPDATE USER
//
export const updateUser = async (req, res) => {
  try {
    const repo = userRepo();

    const user = await repo.findOneBy({ id: Number(req.params.id) });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // hash password if updated
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }

    repo.merge(user, req.body);

    const updatedUser = await repo.save(user);

    const { password, refreshToken, ...safeUser } = updatedUser;

    res.json(safeUser);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//
// DELETE USER
//
export const deleteUser = async (req, res) => {
  try {
    const repo = userRepo();

    const user = await repo.findOneBy({ id: Number(req.params.id) });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await repo.delete(req.params.id);

    res.json({ message: "User deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
