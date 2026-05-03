const express = require("express");
const AppDataSource = require("../config/data-source").default;

const router = express.Router();

// GET ALL RESULTS
router.get("/", async (req, res) => {
  const repo = AppDataSource.getRepository("Result");
  const data = await repo.find();
  res.json(data);
});

// GET ONE STUDENT
router.get("/:name", async (req, res) => {
  const repo = AppDataSource.getRepository("Result");

  const data = await repo.find({
    where: { student_name: req.params.name }
  });

  res.json(data);
});

module.exports = router;