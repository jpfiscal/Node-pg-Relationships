/** Database setup for BizTime. */
const { Client } = require("pg");

const DB_URI = (process.env.NODE_ENV === "test")
    ? "postgresql:///biztime_test"
    : "postgresql:///biztime";

let db = new Client({
    connectionString: DB_URI
});

db.connect(err => {
    if (err) {
        console.error('Connection error', err.stack);
    } else {
        console.log(`Connected to database: ${DB_URI}`);
    }
});

module.exports = db;
