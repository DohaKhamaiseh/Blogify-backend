'use strict';

//import the express framework
const express = require('express');
//import cors
const cors = require('cors');
//import axios
const axios = require('axios');
//Database - > importing the pg 
const pg = require('pg');

var bodyParser = require('body-parser')


const server = express();

//server open for all clients requests
server.use(cors());


// Load the environment variables into your Node.js
require('dotenv').config();

//Set Port Number
const PORT = process.env.PORT || 5500;
//create obj from Client
const client = new pg.Client(process.env.DATABASE_URL);


// parse application/x-www-form-urlencoded
server.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
server.use(bodyParser.json())


//Routes
server.get('/', startHandler)
server.get('/home', homeHandler)
server.get('/getUserPosts/:id', getUserPostsHandler)
server.get('/getPostById/:id', getPostByIdHandler)
server.get('/getAllComment/:id', getAllCommentHandler)
server.post('/saveComment', saveCommentHandler)
server.delete('/deleteComment/:id', deleteCommentHandler)

// Functions Handlers

function startHandler(req, res) {
    res.send("Hello from the Start route");
}

function homeHandler(req, res) {
    res.send("Hello from the home route");
}

function getUserPostsHandler(req, res) {
    const id = req.params.id;
    const sql = `SELECT *  FROM Posts
    INNER JOIN Users ON Posts.userId =Users.userId 
    WHERE Posts.userId=${id}
    ORDER BY Posts.Created_at DESC;`;

    client.query(sql)
        .then((data) => {
            res.send(data.rows);

        })
        .catch((err) => {
            errorHandler(err, req, res);
        })
}

function getPostByIdHandler(req, res) {
    const id = req.params.id;
    const sql = `SELECT * FROM Posts WHERE postId=${id}`;
    client.query(sql)
        .then((data) => {
            res.send(data.rows);
        })
        .catch((err) => {
            errorHandler(err, req, res);
        })

}

function getAllCommentHandler(req, res) {
    const id = req.params.id;
    const sql = `SELECT Comments.userId,
                        Comments.Content,
                        Comments.Created_at
                FROM Comments
                INNER JOIN Users ON Comments.userId = Users.userId
                WHERE Comments.postId=${id}
                ORDER BY Comments.Created_at DESC;`;
    client.query(sql)
        .then((data) => {
            res.send(data.rows);

        })
        .catch((err) => {
            errorHandler(err, req, res);
        })

}

function saveCommentHandler(req, res) {
    const newComment = req.body;
    const sql = `INSERT INTO Comments (postId, userId ,Content) VALUES ($1,$2,$3) RETURNING *;`;
    const values = [newComment.postId, newComment.userId, newComment.Content];
    console.log(sql);
    client.query(sql, values)
        .then((data) => {
            res.send("your data was added !");
        })
        .catch((err) => {
            errorHandler(err, req, res);
        })
    // res.send("Hello from the home route");
}
function deleteCommentHandler(req, res) {
    const id = req.params.id;
    const sql = `DELETE FROM Comments WHERE commentId=${id}`;
    client.query(sql)
        .then((data) => {
            res.status(204).json({});
        })
        .catch((err) => {
            errorHandler(err, req, res);
        })

}


//connect the server with Blogify database
// http://localhost:3000 => (Ip = localhost) (port = 3000)
client.connect()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`listening on ${PORT} : I am ready`);
        });
    })