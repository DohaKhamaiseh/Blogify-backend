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

var bodyParser = require('body-parser')
// parse application/x-www-form-urlencoded
server.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
server.use(bodyParser.json())


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
server.post('/addUsers', addUsersHandler)
server.get('/getUsers', getUsersHandler)
server.post('/addPost', addPostHandler)
server.get('/getAllPosts', getAllPostsHandler)





// Functions Handlers

function startHandler(req, res) {
    res.send("Hello from the Start route");
}

function homeHandler(req, res) {
    res.send("Hello from the home route");
}

function addUsersHandler(req, res) {
    const user = req.body;
    //console.log(user);

    const sql = `INSERT INTO Users (userFullName, dateOfBirth, email, userPassword, imageURL, bio) VALUES ('${ user.userFullName}',) ` ;
    user.userFullName,user.dateOfBirth,user.email,user.userPassword,user.imageURL, user.bio];

    client.query(sql)
        .then((data) => {
            res.send(data.rows);
        })
        .catch(error => {
            res.send('error');
        });

}

function getUsersHandler(req, res) {
    const sql = `SELECT * FROM Users;`
    client.query(sql)
        .then((data) => {
            res.send(data.rows);
        })
        .catch(error => {
            res.send('error');
        });
}

function addPostHandler(req, res) {
    const post = req.body;
    const sql = `INSERT INTO Posts (userId, title, content,imageURL)  
VALUES ('${post.userId}','${post.title}','${post.content}','${post.imageURL}') ;`
    client.query(sql)
        .then((data) => {
            res.send(data.rows);
        })
        .catch(error => {
            res.send('error');
        });
}
// (GET) /getAllPosts: get list of all blog posts created by all users. (Database Join between Posts and User )
//  (postId ,userId ,imageURL ,title ,content ,numberOfLikes,Created_at , userFullName , imageURL AS userImageURL) sorted by created_at
function getAllPostsHandler(req, res) {
    const sql = 'SELECT Users.userId ,Users.userFullName, Users.imageURL , Posts.postId  , Posts.imageURL , Posts.title , Posts.content  , Posts.numberOfLikes , Posts.Created_at  FROM Users INNER JOIN Posts ON Users.userId=Posts.userId  ORDER BY Created_at DESC ;'
    client.query(sql)
        .then((data) => {
            res.send(data.rows);
        })
        .catch(error => {
            res.send('error');
        });
}








function savePostHandler(req, res) {
    const Post = req.body;
    const sql = `INSERT INTO Posts (userId, title, content,imageURL) VALUES ($1, $2, $3,$4) RETURNING *;`
    const values = [Post.userId, Post.title, Post.content, Post.imageURL];

    client.query(sql, values)
        .then((data) => {
            res.send("your data was added !");
        })
        .catch(error => {
            // console.log(error);
            errorHandler(error, req, res);
        });
}


// 404 errors
server.get('*', (req, res) => {
    const errorObj = {
        status: 404,
        responseText: 'Sorry, page not found'
    }
    res.status(404).send(errorObj);
})


//middleware function
function errorHandler(err, req, res) {
    const errorObj = {
        status: 500,
        massage: err
    }
    res.status(500).send(errorObj);
}

// server errors
server.use(errorHandler)


//connect the server with Blogify database
// http://localhost:3000 => (Ip = localhost) (port = 3000)
client.connect()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`listening on ${PORT} : I am ready`);
        });
    })