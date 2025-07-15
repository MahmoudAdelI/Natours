import fs from 'fs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

import Tour from '../../models/tourModel.js';
import User from '../../models/userModel.js';
import Review from '../../models/reviewModel.js';

dotenv.config({ path: './config.env' });
const password = encodeURIComponent(process.env.DATABASE_PASSWORD); // because of special characters in password

const DB = process.env.DATABASE.replace('<PASSWORD>', password);
mongoose.connect(DB).then(() => {
  console.log('DB connection successful');
});

// Polyfill for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read JSON file
const tours = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'tours.json'), 'utf-8'),
);
const users = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'users.json'), 'utf-8'),
);
const reviews = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'reviews.json'), 'utf-8'),
);

// Import data into DB
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// Delete all data from DB
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data successfully deleted!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// Command line arguments to run the script
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
