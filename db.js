var mysql = require("mysql");

var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "hrishi137",
    database: "cj"
});

connection.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");

});

module.exports = connection;