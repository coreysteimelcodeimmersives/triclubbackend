const { MongoClient } = require("mongodb");
require("dotenv").config();

let db;

async function mongoConnect() {
  const uri = process.env.REACT_APP_MONGO_URI;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    db = await client.db(process.env.REACT_APP_MONGO_DATABASE);
    console.log("db connected");
  } catch (error) {
    console.log("db NOT CONNECTED!");
    console.error(error);
  }
}

function triclubDb() {
  return db;
}

module.exports = { mongoConnect, triclubDb };
