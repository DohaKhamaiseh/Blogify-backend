'use strict';

//import the express framework
const express = require('express');
//import cors
const cors = require('cors');
//import axios
const axios = require('axios');
//Database - > importing the pg 
const pg = require('pg');



const server = express();

//server open for all clients requests
server.use(cors());

// Load the environment variables into your Node.js
require('dotenv').config();

//Set Port Number
const PORT = process.env.PORT || 5500;
//create obj from Client
const client = new pg.Client(process.env.DATABASE_URL);



//Routes
server.get('/', startHandler)
server.get('/home', homeHandler)
server.get('/getUserPosts/:id', getUserPostsHandler)
server.get('/getPostById/:id', getPostByIdHandler)
server.get('/getAllComment/:id', getAllCommentHandler)

// Functions Handlers

function startHandler(req, res) {
    res.send("Hello from the Start route");
}

function homeHandler(req, res) {
    res.send("Hello from the home route");
}

function getUserPostsHandler(req, res) {
    const id = req.params.id;
    const sql = `SELECT Posts.postId, Posts.userId, Posts.imageURL, Posts.title, Posts.content,
    Posts.numberOfLikes,Posts.Created_at,User.userFullName,User.userImageURL
    FROM Posts 
    WHERE Posts.userId=${id}
    INNER JOIN User ON Posts.userId=User.userId
    ORDER BY Posts.Created_at DESC`;

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

function getAllCommentHandler(req,res){

}



//connect the server with Blogify database
// http://localhost:3000 => (Ip = localhost) (port = 3000)
client.connect()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`listening on ${PORT} : I am ready`);
        });
    })