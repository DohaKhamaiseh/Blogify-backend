DROP TABLE IF EXISTS Users;

CREATE TABLE IF NOT EXISTS Users (
    userId SERIAL,
    userFullName VARCHAR(255) NOT NULL,
    dateOfBirth DATE,
    email VARCHAR(255) NOT NULL,
    userPassword TEXT NOT NULL,
    imageURL VARCHAR(255) ,
    bio TEXT,
    PRIMARY KEY(userId)
);