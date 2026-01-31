import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root BEFORE any other imports
dotenv.config({ path: path.join(__dirname, '../../../.env') });
