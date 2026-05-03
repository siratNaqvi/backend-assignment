import "reflect-metadata";
import { DataSource } from "typeorm";
import  User  from "./entities/User.js";
import Result  from "./entities/Result.js";
import dotenv from "dotenv";

dotenv.config();

const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  synchronize: true,
  logging: false,

  entities: [User, Result],
});

export default AppDataSource;