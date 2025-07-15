import './envConfig.js';
import mongoose from 'mongoose';
import app from './app.js';

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXEPTION! Shuting down...');
  console.log(err.name, err.message);
  process.exit(1);
});
const password = encodeURIComponent(process.env.DATABASE_PASSWORD); // because of special characters in password
const DB = process.env.DATABASE.replace('<PASSWORD>', password);
mongoose.connect(DB).then(() => {
  console.log('DB connection successful');
});
const port = 3000;
const server = app.listen(port, () => console.log(`running on port: ${port}`));

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shuting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
