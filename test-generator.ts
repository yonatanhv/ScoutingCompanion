import { generateMatchEntry } from './client/src/lib/testDataGenerator';

// Generate a test entry and display it
const entry = generateMatchEntry();
console.log(JSON.stringify(entry, null, 2));