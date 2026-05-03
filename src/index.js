import express from "express";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import AppDataSource from "./config/data-source.js";
import userRoutes from "./routes/userRoutes.js";
import loggerMiddleware from "./middleware/loggerMiddleware.js";
import validateRegister from "./middleware/validateRegister.js";
import validateLogin from "./middleware/validateLogin.js";
import authMiddleware from "./middleware/authMiddleware.js";
import roleMiddleware from "./middleware/roleMiddleware.js";
import errorMiddleware from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
app.get("/test-admin", (req, res) => {
  res.json({ message: "route works" });
});
app.use(express.json());
app.use(loggerMiddleware);
app.use("/users", userRoutes);
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

app.get("/", (req, res) => {
  res.send("Server is running");
});

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected successfully");

    const userRepository = AppDataSource.getRepository("User");

    // Basic create user route
    app.post("/users", async (req, res, next) => {
      try {
        const { name, email, age, password, role } = req.body;

        if (!name || !email || !password) {
          return res.status(400).json({
            message: "Name, email and password are required"
          });
        }

        const existingUser = await userRepository.findOneBy({ email });
        if (existingUser) {
          return res.status(400).json({
            message: "Email already exists"
          });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = userRepository.create({
          name,
          email,
          age,
          password: hashedPassword,
          role: role || "user"
        });

        const savedUser = await userRepository.save(newUser);

        res.status(201).json({
          message: "User created successfully",
          user: {
            id: savedUser.id,
            name: savedUser.name,
            email: savedUser.email,
            age: savedUser.age,
            role: savedUser.role
          }
        });
      } catch (error) {
        next(error);
      }
    });

    // REGISTER
   

       

    // LOGIN -> returns access token + refresh token
    app.post("/login", validateLogin, async (req, res, next) => {
      try {
        const { email, password } = req.body;

        const user = await userRepository.findOneBy({ email });

        if (!user) {
          return res.status(400).json({
            message: "Invalid email or password"
          });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          return res.status(400).json({
            message: "Invalid email or password"
          });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        user.refreshToken = refreshToken;
        await userRepository.save(user);

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
        next(error);
      }
    });

    // REFRESH ACCESS TOKEN
    app.post("/refresh", async (req, res, next) => {
      try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
          return res.status(401).json({
            message: "Refresh token required"
          });
        }

        const decoded = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET
        );

        const user = await userRepository.findOneBy({ id: decoded.id });

        if (!user || user.refreshToken !== refreshToken) {
          return res.status(403).json({
            message: "Invalid refresh token"
          });
        }

        const newAccessToken = generateAccessToken(user);

        res.json({
          accessToken: newAccessToken
        });
      } catch (error) {
        next(error);
      }
    });

    // LOGOUT
    app.post("/logout", authMiddleware, async (req, res, next) => {
      try {
        const user = await userRepository.findOneBy({ id: req.user.id });

        if (!user) {
          return res.status(404).json({
            message: "User not found"
          });
        }

        user.refreshToken = null;
        await userRepository.save(user);

        res.json({
          message: "Logged out successfully"
        });
      } catch (error) {
        next(error);
      }
    });

    // PROTECTED PROFILE ROUTE
    app.get("/profile", authMiddleware, async (req, res, next) => {
      try {
        const user = await userRepository.findOneBy({ id: req.user.id });

        if (!user) {
          return res.status(404).json({
            message: "User not found"
          });
        }

        res.json({
          message: "Profile fetched successfully",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            age: user.age,
            role: user.role
          }
        });
      } catch (error) {
        next(error);
      }
    });

    // ADMIN ONLY ROUTE
    app.get(
      "/admin",
      authMiddleware,
      roleMiddleware("admin"),
      async (req, res, next) => {
        try {
          res.json({
            message: "Welcome Admin"
          });
        } catch (error) {
          next(error);
        }
      }
    );

    // GET USERS - hide password and refreshToken
    app.get("/users", async (req, res, next) => {
      try {
        const users = await userRepository.find();

        const safeUsers = users.map(
          ({ password, refreshToken, ...user }) => user
        );

        res.json(safeUsers);
      } catch (error) {
        next(error);
      }
    });

    app.use(errorMiddleware);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
  });