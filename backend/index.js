const express = require("express");
const mysql = require("mysql2");
const cors = require('cors');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const saltRounds = 10;
const app = express();

app.use(express.json());
app.use(bodyParser.urlencoded({extended: true, parameterLimit: 100000, limit: "500mb"}));
app.use(cors());

// Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./");
    },
    filename: function(req, file, cb) {
        const ext = file.mimetype.split("/")[1];
        cb(null, `uploads/${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage
});

app.use(`/uploads`, express.static(path.join(__dirname, '/uploads')));

// Connect DB
const db = mysql.createConnection({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Register
app.post('/register', upload.single('foto'), (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const foto = req.file.filename;

    bcrypt.hash(password, saltRounds, (err, hash_password) => {
        if (err) {
            console.log(err);
        }

        db.query (
            `INSERT INTO users (username, password, foto) VALUES ("${username}", "${hash_password}", "${foto}")`, (error, result) => {
                if (error) {
                    res.send({error: "Username sudah digunakan."});
                } else {
                    res.send(result);
                }
            }
        );
    })
});

// Login
app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    db.query (
        `SELECT * FROM users WHERE username = "${username}"`,
        (err, result) => {
            if (err) {
                res.send({err: err});
            }

            if (result.length > 0) {
                bcrypt.compare(password, result[0].password, (error, response) => {
                    if (response) {
                        if (result[0].approved) {
                            result[0].api_key = username + "-" + result[0].is_admin;
                            res.send(result[0]);
                        } else {
                            res.send({error: "Mohon menunggu verifikasi untuk akun Anda."})
                        }
                    } else {
                        res.send({error: "Invalid username or password."})
                    }
                })
            } else {
                res.send({error: "Invalid username or password."})
            }
        }
    );
});

// List User
app.get('/user', (req, res) => {
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        const key = req.headers.authorization.split(' ')[1];

        if (key.split('-')[1] === '1') {
            db.query (
                `SELECT * FROM users WHERE is_admin = false ORDER BY approved`,
                (err, result) => {
                    if (err) {
                        res.send({error: err});
                    } else {
                        res.send(result);
                    }
                }
            );
        } else {
            res.send({error: "Unauthorized"}); 
        }
    } else {
        res.send({error: "Unauthorized"}); 
    }
});

// Detail User
app.get('/user/:username', (req, res) => {
    const username = req.params.username;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        const key = req.headers.authorization.split(' ')[1];

        if (key.split('-')[0] === username || key.split('-')[1] === '1') {
            db.query (
                `SELECT * FROM users WHERE username = "${username}"`,
                (err, result) => {
                    if (err) {
                        res.send({error: err});
                    } else {
                        res.send(result[0]);
                    }
                }
            );
        } else {
            res.send({error: "Unauthorized"}); 
        }
    } else {
        res.send({error: "Unauthorized"}); 
    }
});

// Verify User
app.get('/user/verify/:username', (req, res) => {
    const username = req.params.username;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        const key = req.headers.authorization.split(' ')[1];

        if (key.split('-')[1] === '1') {
            db.query (
                `UPDATE users SET approved = true WHERE username = "${username}"`,
                (err, result) => {
                    if (err) {
                        res.send({error: err});
                    } else {
                        res.send(result[0]);
                    }
                }
            );
        } else {
            res.send({error: "Unauthorized"}); 
        }
    } else {
        res.send({error: "Unauthorized"}); 
    }
});

app.listen(process.env.PORT, () => console.log(`Server running at port ${process.env.PORT}`));