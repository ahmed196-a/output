#!/usr/bin/env node
/**
 * Usage:  node scripts/hash-password.mjs "yourpassword"
 *
 * Prints a bcrypt hash you can paste into the Supabase `users` table
 * (password_hash column) or the seed SQL.
 *
 * Install once:  npm install bcryptjs
 */
import bcrypt from "bcryptjs";

const [, , plaintext] = process.argv;

if (!plaintext) {
  console.error("Usage: node scripts/hash-password.mjs <password>");
  process.exit(1);
}

const hash = await bcrypt.hash(plaintext, 10);
console.log(hash);
