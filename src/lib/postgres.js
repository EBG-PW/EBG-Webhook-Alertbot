const pg = require('pg');
const util = require('util')
const randomstring = require('randomstring')

const pool = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
})

//Creat Table devices
pool.query(`CREATE TABLE IF NOT EXISTS devices (
    ip inet PRIMARY KEY,
    name text,
    port integer,
    link text,
    service text,
    beschreibung text,
    benutzer text,
    time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP)`, (err, result) => {
    if (err) {console.log(err)}
    //Create Index for devices
    pool.query(`CREATE INDEX IF NOT EXISTS IP_idx ON devices (ip)`, (err, result) => {
      if (err) {console.log(err)}
    });
});

//Creat Table tokens
pool.query(`CREATE TABLE IF NOT EXISTS tokens (
    token varchar(64) PRIMARY KEY,
    ip inet,
    benutzer integer,
    chatid bigint,
    msgid integer,
    time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP)`, (err, result) => {
    if (err) {console.log(err)}
    //Create Index for devices
    pool.query(`CREATE INDEX IF NOT EXISTS token_idx ON tokens (token)`, (err, result) => {
      if (err) {console.log(err)}
    });
});

/**
 * This function will write new token to database
 * @param {Object} Data
 * @returns {Promise}
 */
 let WriteToken = function(Data) {
  return new Promise(function(resolve, reject) {
    pool.query('INSERT INTO tokens(token,ip,benutzer,chatid,msgid) VALUES ($1,$2,$3,$4,$5)',[
      Data.token, Data.ip, Data.benutzer, Data.chatid, Data.msgid
    ], (err, result) => {
      if (err) {reject(err)}
      resolve(result)
    });
  });
}

/**
 * This function will get the data of a token
 * @param {String} Token
 * @returns {Promise}
 */
 let GetTokenData = function(Token) {
  return new Promise(function(resolve, reject) {
    pool.query('SELECT * FROM tokens WHERE token = $1',[
      Token
    ], (err, result) => {
      if (err) {reject(err)}
      resolve(result)
    });
  });
}

/**
 * This function will delete a used token
 * @param {String} Token
 * @returns {Promise}
 */
 let DeleteToken = function(Token) {
  return new Promise(function(resolve, reject) {
    pool.query('DELETE FROM tokens WHERE token = $1',[
      Token
    ], (err, result) => {
      if (err) {reject(err)}
      resolve(result)
    });
  });
}

module.exports = {
  WriteToken,
  GetTokenData,
  DeleteToken
};