/* eslint-disable */
import * as dotenv from 'dotenv';
import path from 'path';

var __TEARDOWN_MESSAGE__: string;

// Adjust the path to point to the .env file in the backend folder
const envPath = path.resolve(__dirname, '../../../backend/.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log('Successfully loaded .env file');
}

module.exports = async function () {
  // Start services that that the app needs to run (e.g. database, docker-compose, etc.).
  console.log('\nSetting up...\n');

  // Hint: Use `globalThis` to pass variables to global teardown.
  globalThis.__TEARDOWN_MESSAGE__ = '\nTearing down...\n';
};
