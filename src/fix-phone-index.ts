/**
 * Run this script once to fix existing null phoneNo.value documents
 * Command: npx ts-node src/fix-phone-index.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function fix() {
  await mongoose.connect(process.env.DB_URL!);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db!;
  const users = db.collection('users');

  // Remove phoneNo field entirely from docs where phoneNo.value is null or empty
  const result = await users.updateMany(
    { $or: [{ 'phoneNo.value': null }, { 'phoneNo.value': '' }, { 'phoneNo': null }] },
    { $unset: { phoneNo: '' } }
  );

  console.log(`Fixed ${result.modifiedCount} documents`);

  // Drop and recreate the index as sparse
  try {
    await users.dropIndex('phoneNo.value_1');
    console.log('Dropped old index');
  } catch (e) {
    console.log('Index may not exist:', (e as any).message);
  }

  await users.createIndex({ 'phoneNo.value': 1 }, { unique: true, sparse: true });
  console.log('Recreated sparse unique index on phoneNo.value');

  await mongoose.disconnect();
  console.log('Done!');
}

fix().catch(console.error);
