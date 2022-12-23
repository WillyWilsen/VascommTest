CREATE DATABASE vascomm_test;

USE vascomm_test;

CREATE TABLE users (
    username VARCHAR(255) PRIMARY KEY,
    password VARCHAR(255),
    foto VARCHAR(255),
    is_admin boolean DEFAULT false,
    approved boolean DEFAULT false
);

INSERT INTO users VALUES ('admin', '$2b$10$S78lrF3DyVzhpMWYi/XaxeH1Ysde0FkGRRbtJqlJKzosSfNlc0v7u', '', true, true);