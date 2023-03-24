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

const { Configuration, OpenAIApi } = require("openai");


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


//OpenAI API Configuration
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

//Routes
server.get('/', startHandler)
server.get('/home', homeHandler)

server.get('/getUserPosts/:id', getUserPostsHandler)
server.get('/getPostById/:id', getPostByIdHandler)

server.post('/addUsers', addUsersHandler)
// server.get('/getUsers', getUsersHandler)
server.post('/addPost', savePostHandler)
server.get('/getAllPosts', getAllPostsHandler)
server.put('/updatepost/:id', updatePostHandler)
server.delete('/deletepost/:id', deletePostHandler)
server.post('/increasepostlikes/:id', increaseLikesHandler)
server.post('/decreespostlikes/:id', decreesLikesHandler)
server.get('/getProfileById/:id', getProfileByIdHandler)
server.put('/updateprofil/:id', updateProfilHandler)
server.get('/getUserIdByEmail', getUserIdByEmailHandler)

// Functions Handlers

function startHandler(req, res) {
    res.send("Hello from the Start route");
}

function homeHandler(req, res) {
    res.send("Hello from the home route");
}

function addUsersHandler(req, res) {
    const user = req.body;
    const checkEmailSql = `SELECT userId FROM Users WHERE email=$1;`;
    const checkEmailValues = [user.email];
    client.query(checkEmailSql, checkEmailValues)
        .then((result) => {
            if (result.rowCount > 0) {
                res.status(400).send("Email already exists");
            } else {
                const sql = `INSERT INTO Users (userFullName, email) VALUES ($1, $2) RETURNING *;`;
                const values = [user.userFullName, user.email];
                client.query(sql, values)
                    .then((data) => {
                        res.send("Users Saved successfully");
                    })
                    .catch(error => {
                        errorHandler(error, req, res);
                    });
            }
        })
        .catch((error) => {
            errorHandler(error, req, res);
        });
}



// function getUsersHandler(req, res) {
//     const sql = `SELECT * FROM Users;`
//     client.query(sql)
//         .then((data) => {
//             res.send(data.rows);
//         })
//         .catch(error => {
//             res.send('error');
//         });
// }

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



// (GET) /getAllPosts: get list of all blog posts created by all users. (Database Join between Posts and User )
//  (postId ,userId ,imageURL ,title ,content ,numberOfLikes,Created_at , userFullName , imageURL AS userImageURL) sorted by created_at
function getAllPostsHandler(req, res) {
    const sql = 'SELECT Posts.postId ,Users.userId ,Users.userFullName, Users.imageURL , Posts.postId  , Posts.imageURL , Posts.title , Posts.content  , Posts.numberOfLikes , Posts.Created_at  FROM Users INNER JOIN Posts ON Users.userId=Posts.userId  ORDER BY Created_at DESC ;'
    client.query(sql)
        .then((data) => {
            res.send(data.rows);
        })
        .catch(error => {
            res.send('error');
        });
}


function getUserPostsHandler(req, res) {
    const id = req.params.id;
    const sql = `SELECT Users.userId ,
                        Posts.postId ,
                        Users.userFullName ,
                        Users.imageURL AS userImageURL ,
                        Posts.imageURL,
                        Posts.title ,
                        Posts.content ,
                        Posts.numberOfLikes ,
                        Posts.Created_at 
                FROM Posts
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
    const sql = `SELECT Users.userId ,
                        Posts.postId ,
                        Users.userFullName ,
                        Users.imageURL AS userImageURL ,
                        Posts.imageURL,
                        Posts.title ,
                        Posts.content ,
                        Posts.numberOfLikes ,
                        Posts.Created_at  
                FROM Posts 
                INNER JOIN Users ON Posts.userId = Users.userId
                WHERE postId=${id}`;
    client.query(sql)
        .then((data) => {
            res.send(data.rows);
        })
        .catch((err) => {
            errorHandler(err, req, res);
        })

}

function updatePostHandler(req, res) {
    const id = req.params.id;
    if (!isNaN(id)) {
        const Post = req.body;
        const sql = `UPDATE Posts SET title =$1 , content  =$2 , imageURL =$3 WHERE postId = ${id} RETURNING *;`
        const values = [Post.title, Post.content, Post.imageURL];

        client.query(sql, values)
            .then((data) => {
                res.status(200).send(data.rows);
            })
            .catch(error => {
                // console.log(error);
                errorHandler(error, req, res);
            });
    }
    else {
        res.send("Id Must Be Numaric");
    }
}

function deletePostHandler(req, res) {
    const postId = req.params.id;
    if (!isNaN(postId)) {
        const deleteCommentsQuery = `DELETE FROM Comments WHERE postId = $1;`;
        const deletePostQuery = `DELETE FROM Posts WHERE postId = $1;`;
        client.query(deleteCommentsQuery, [postId])
            .then(() => client.query(deletePostQuery, [postId]))
            .then(() => res.send("Post and associated comments deleted successfully."))
            .catch((err) => errorHandler(err, req, res));
    } else {
        res.send("Id Must Be Numeric");
    }

}

function increaseLikesHandler(req, res) {
    const id = req.params.id;
    if (!isNaN(id)) {
        const sql = `UPDATE posts SET numberOfLikes = numberOfLikes + 1 WHERE postId = ${id};`
        console.log(sql);
        client.query(sql)
            .then((data) => {
                res.send("increased successfully");
            })
            .catch(error => {
                errorHandler(error, req, res);
            });


    }
    else {
        res.send("Id Must Be Numaric");
    }
}
function decreesLikesHandler(req, res) {
    const id = req.params.id;
    if (!isNaN(id)) {
        const sql = `UPDATE posts SET numberOfLikes = numberOfLikes - 1 WHERE postId = ${id};`
        console.log(sql);
        client.query(sql)
            .then((data) => {
                res.send("decreesed successfully");
            })
            .catch(error => {
                errorHandler(error, req, res);
            });


    }
    else {
        res.send("Id Must Be Numaric");
    }
}


function getProfileByIdHandler(req, res) {
    const id = req.params.id;
    if (!isNaN(id)) {
        const sql = `SELECT Users.userFullName  ,
                        Users.dateOfBirth  ,
                        Users.email ,
                        Users.imageURL AS userImageURL ,
                        Users.bio 
                FROM Users 
                WHERE userId =${id}`;
        client.query(sql)
            .then((data) => {
                res.send(data.rows);
            })
            .catch((err) => {
                errorHandler(err, req, res);
            })

    }
    else {
        res.send("Id Must Be Numaric");
    }

}
function updateProfilHandler(req, res) {
    const id = req.params.id;
    if (!isNaN(id)) {
        const User = req.body;
        const sql = `UPDATE Users SET userFullName =$1 , dateOfBirth  =$2 , imageURL =$3,bio=$4 WHERE userId = ${id} RETURNING *;`
        const values = [User.userFullName, User.dateOfBirth, User.imageURL, User.bio];

        client.query(sql, values)
            .then((data) => {
                res.status(200).send(data.rows);
            })
            .catch(error => {
                // console.log(error);
                errorHandler(error, req, res);
            });
    }
    else {
        res.send("Id Must Be Numaric");
    }
}

function getUserIdByEmailHandler(req, res) {
    const email = req.body.email;
    const sql = `SELECT userId FROM Users WHERE email = '${email}'`;
    client.query(sql)
        .then((data) => {
            res.send(data.rows);
        })
        .catch((err) => {
            errorHandler(err, req, res);
        })
}


server.get('/generateByAi', async function(req, res) {
    const prompt = `create for me blog post about ${req.body.title} and do not start with Sure`;
    openai.createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
        max_tokens: 2048,
    }).then(function(completion) {
        res.send(completion.data.choices[0].text);
    }).catch(function(err) {
        errorHandler(err, req, res);
    });
});


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