import { Sequelize } from "sequelize";

const sequelize = new Sequelize({
  host: process.env.DB_HOST,
  dialect: "postgres",
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "messenger",
});

async function ConnectDB() {
  try {
    await sequelize.authenticate();
    // console.log('Connection has been established successfully.');

    await sequelize.sync({ alter: true });
    // console.log('All models were synchronized successfully (altered).');
  } catch (error) {
    //   console.error('Unable to connect to the database:', error);
  }
}

export { sequelize, ConnectDB };
