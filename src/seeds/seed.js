import AppDataSource from "../config/data-source.js";
import bcrypt from "bcrypt";
async function seedDatabase() {
  try {
    await AppDataSource.initialize();
    console.log("Database connected for seeding");

    const userRepository = AppDataSource.getRepository("User");
    const resultRepository = AppDataSource.getRepository("Result");

    // -----------------------------
    // 1. SEED USERS (3 users)
    // -----------------------------
  const users = [
  { name: "Ali", email: "ali@gmail.com", age: 21, password: "1234" },
  { name: "Ayesha", email: "ayesha@gmail.com", age: 22, password: "5678" },
  { name: "Ahmed", email: "ahmed@gmail.com", age: 20, password: "9101" }
];
for (const userData of users) {
  const existingUser = await userRepository.findOneBy({
    email: userData.email
  });

  if (!existingUser) {

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = userRepository.create({
      name: userData.name,
      email: userData.email,
      age: userData.age,
      password: hashedPassword   // ✅ MUST be here
    });

    await userRepository.save(user);

    console.log("Inserted:", userData.email);
  }
}
    // -----------------------------
    // 2. SEED RESULTS (5 results)
    // -----------------------------
    const results = [
      { student_name: "Ali", subject: "Math", marks: 85, grade: "A" },
      { student_name: "Ali", subject: "English", marks: 78, grade: "B" },
      { student_name: "Ayesha", subject: "Science", marks: 92, grade: "A+" },
      { student_name: "Ahmed", subject: "Physics", marks: 74, grade: "B" },
      { student_name: "Ayesha", subject: "Computer", marks: 88, grade: "A" }
    ];

    for (const resultData of results) {
      const existingResult = await resultRepository.findOneBy({
        student_name: resultData.student_name,
        subject: resultData.subject
      });

      if (!existingResult) {
        await resultRepository.save(resultRepository.create(resultData));
        console.log(
          `Inserted result: ${resultData.student_name} - ${resultData.subject}`
        );
      } else {
        console.log(
          `Result already exists: ${resultData.student_name} - ${resultData.subject}`
        );
      }
    }

    console.log("Seeding completed successfully");
    await AppDataSource.destroy();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Seeding failed:", error);
  }
}

seedDatabase();