export class AddPassword1710000000000 {
  async up(queryRunner) {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN password varchar
    `);
  }

  async down(queryRunner) {
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN password
    `);
  }
}
