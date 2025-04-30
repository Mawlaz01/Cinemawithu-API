let mysql = require('mysql');

let conection = mysql.createConnection ({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db_cinema'
});

conection.connect(function(error) {
    if (error) {
        console.log(error);
    }
    else {
        console.log('Koneksi Sukses');
    }
});

module.exports = conection;