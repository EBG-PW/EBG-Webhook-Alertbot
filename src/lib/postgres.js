const pg = require('pg');
const util = require('util')

const pool = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
})

//Creat Table devices
pool.query(`CREATE TABLE IF NOT EXISTS devices (
    ip text PRIMARY KEY,
    name text,
    port integer,
    link text,
    service text,
    beschreibung text,
    benutzer text,
    time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP)`, (err, result) => {
    if (err) {console.log(err)}
    //Create Index for devices
    pool.query(`CREATE INDEX IF NOT EXISTS IP_idx ON devices (devices)`, (err, result) => {
      if (err) {console.log(err)}
    });
});

//Creat Table tokens
pool.query(`CREATE TABLE IF NOT EXISTS tokens (
  token text PRIMARY KEY,
  ip text,
  benutzer integer,
  time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP)`, (err, result) => {
  if (err) {console.log(err)}
  //Create Index for devices
  pool.query(`CREATE INDEX IF NOT EXISTS IP_idx ON devices (devices)`, (err, result) => {
    if (err) {console.log(err)}
  });
});

module.exports = {

};