"use strict";

const mysql = require("mysql2");

//create connection to pool server

const pool = mysql.createPool({
  host: "localhost",
  user: "thinhle",
  password: "thinhle",
  database: "shopDEV",
});

const batchSize = 10; //100000; // adjust batch size
const totalSize = 1000; //1_000_000;

let currentId = 1;
console.time(`::::::::TIMMER:::::::`);

const insertBatch = async () => {
  const values = [];
  for (let i = 0; i < batchSize && currentId <= totalSize; i++) {
    const name = `name-${currentId}`;
    const age = currentId;
    const address = `address-${currentId}`;
    values.push([currentId, name, age, address]);
    currentId++;
  }

  if (!values.length) {
    console.timeEnd(":::::::::::TIMMER::::");
    pool.end((err) => {
      if (err) {
        console.error(`Error occurred while running batch`, err);
      } else {
        console.log(`Connection pool closed successfully`);
      }
    });
    return;
  }

  const sql = `INSERT INTO test_table (name, age, address) VALUES ?`;
  pool.query(sql, [values], async function (err, results) {
    if (err) throw err;

    console.log(`Inserted ${results.affectedRows} records`);
    await insertBatch();
  });
};

insertBatch().catch(console.error(err));

// Perform a sample operation
// pool.query("Select 1 + 1 AS solution", function (err, result) {
// pool.query("Select * from users", function (err, result) {
//   if (err) throw err;

//   console.log(`query result: ${JSON.stringify(result)}`);

//   //   close pool connection
//   pool.end((err) => {
//     if (err) throw err;
//     console.log(`connection closed`);
//   });
// });
