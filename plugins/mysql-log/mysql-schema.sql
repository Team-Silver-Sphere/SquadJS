DROP DATABASE squadjs;

CREATE DATABASE IF NOT EXISTS squadjs;
USE squadjs;

CREATE USER IF NOT EXISTS squadjs IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON squadjs.* TO squadjs;

CREATE TABLE IF NOT EXISTS tick_rate (
    id INT PRIMARY KEY AUTO_INCREMENT,
    time TIMESTAMP,
    server INT NOT NULL,
    tick_rate FLOAT NOT NULL
);

CREATE TABLE IF NOT EXISTS game (
    id INT PRIMARY KEY AUTO_INCREMENT,
    server INT,
    startTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    endTime TIMESTAMP NULL DEFAULT NULL,
    map VARCHAR(255),
    layer VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS player_wound (
    id INT PRIMARY KEY AUTO_INCREMENT,
    server INT,
    time TIMESTAMP NOT NULL,
    victim VARCHAR(255),
    damage FLOAT,
    attacker VARCHAR(255),
    weapon VARCHAR(255),
    teamkill BOOLEAN
);

CREATE TABLE IF NOT EXISTS player_die (
    id INT PRIMARY KEY AUTO_INCREMENT,
    server INT NOT NULL,
    time TIMESTAMP NOT NULL,
    victim VARCHAR(255),
    damage FLOAT,
    attacker VARCHAR(255),
    weapon VARCHAR(255),
    teamkill BOOLEAN
);

CREATE TABLE IF NOT EXISTS revive (
    id       INT PRIMARY KEY AUTO_INCREMENT,
    server   VARCHAR(255) NOT NULL,
    time     TIMESTAMP    NOT NULL,
    victim   VARCHAR(255),
    damage   FLOAT,
    attacker VARCHAR(255),
    weapon   VARCHAR(255),
    reviver  VARCHAR(255)
);