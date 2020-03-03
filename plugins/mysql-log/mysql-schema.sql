DROP DATABASE squadjs;

CREATE DATABASE IF NOT EXISTS squadjs;
USE squadjs;

CREATE USER IF NOT EXISTS squadjs IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON squadjs.* TO squadjs;

CREATE TABLE IF NOT EXISTS `Server` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS `ServerTickRate` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `server` INT NOT NULL,
    `tick_rate` FLOAT NOT NULL,

    FOREIGN KEY (`server`) REFERENCES `Server`(`id`)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `PlayerCount` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `server` INT NOT NULL,
    `player_count` FLOAT NOT NULL,

    FOREIGN KEY (`server`) REFERENCES `Server`(`id`)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `Match` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `server` INT NOT NULL,
    `map` VARCHAR(255),
    `layer` VARCHAR(255),
    `startTime` TIMESTAMP NOT NULL,
    `endTime` TIMESTAMP NULL DEFAULT NULL,

    FOREIGN KEY (`server`) REFERENCES `Server`(`id`)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `SteamUser` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `steamID` VARCHAR(17) NOT NULL UNIQUE,
    `lastName` VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS `PlayerWound` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `server` INT NOT NULL,
    `time` TIMESTAMP NOT NULL,
    `victim` VARCHAR(255),
    `victimName` VARCHAR(255),
    `victimTeamID` INT,
    `victimSquadID` INT,
    `attacker` VARCHAR(255),
    `attackerName` VARCHAR(255),
    `attackerTeamID` INT,
    `attackerSquadID` INT,
    `damage` FLOAT,
    `weapon` VARCHAR(255),
    `teamkill` BOOLEAN,

    FOREIGN KEY (`server`) REFERENCES `Server`(`id`)
        ON DELETE CASCADE,
    FOREIGN KEY (`victim`) REFERENCES `SteamUser`(`steamID`)
        ON DELETE CASCADE,
    FOREIGN KEY (`attacker`) REFERENCES `SteamUser`(`steamID`)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `PlayerDie` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `server` INT NOT NULL,
    `time` TIMESTAMP NOT NULL,
    `woundTime` TIMESTAMP NOT NULL,
    `victim` VARCHAR(255),
    `victimName` VARCHAR(255),
    `victimTeamID` INT,
    `victimSquadID` INT,
    `attacker` VARCHAR(255),
    `attackerName` VARCHAR(255),
    `attackerTeamID` INT,
    `attackerSquadID` INT,
    `damage` FLOAT,
    `weapon` VARCHAR(255),
    `teamkill` BOOLEAN,

    FOREIGN KEY (`server`) REFERENCES `Server`(`id`)
        ON DELETE CASCADE,
    FOREIGN KEY (`victim`) REFERENCES `SteamUser`(`steamID`)
        ON DELETE CASCADE,
    FOREIGN KEY (`attacker`) REFERENCES `SteamUser`(`steamID`)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `Revive` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `server` INT NOT NULL,
    `time` TIMESTAMP NOT NULL,
    `woundTime` TIMESTAMP NOT NULL,
    `victim` VARCHAR(255),
    `victimName` VARCHAR(255),
    `victimTeamID` INT,
    `victimSquadID` INT,
    `attacker` VARCHAR(255),
    `attackerName` VARCHAR(255),
    `attackerTeamID` INT,
    `attackerSquadID` INT,
    `damage` FLOAT,
    `weapon` VARCHAR(255),
    `teamkill` BOOLEAN,
    `reviver` VARCHAR(255),
    `reviverName` VARCHAR(255),
    `reviverTeamID` INT,
    `reviverSquadID` INT,

    FOREIGN KEY (`server`) REFERENCES `Server`(`id`)
        ON DELETE CASCADE,
    FOREIGN KEY (`victim`) REFERENCES `SteamUser`(`steamID`)
        ON DELETE CASCADE,
    FOREIGN KEY (`attacker`) REFERENCES `SteamUser`(`steamID`)
        ON DELETE CASCADE,
    FOREIGN KEY (`reviver`) REFERENCES `SteamUser`(`steamID`)
        ON DELETE CASCADE
);

DROP PROCEDURE IF EXISTS `NewMatch`;
DELIMITER #
CREATE PROCEDURE `NewMatch` (
    IN `p_server` INT,
    IN `p_time` TIMESTAMP,
    IN `p_map` VARCHAR(255),
    IN `p_layer` VARCHAR(255)
)
BEGIN
    UPDATE `Match` SET `endTime` = `p_time` WHERE `server` = `p_server` AND `endTime` IS NULL;
    INSERT INTO `Match` (`server`, `startTime`, `map`, `layer`) VALUES (`p_server`, `p_time`, `p_map`, `p_layer`);
END#
DELIMITER ;

DROP PROCEDURE IF EXISTS `InsertPlayerWound`;
DELIMITER #
CREATE PROCEDURE `InsertPlayerWound` (
    IN `p_server` INT,
    IN `p_time` TIMESTAMP,
    IN `P_victim` VARCHAR(255),
    IN `p_victimName` VARCHAR(255),
    IN `p_victimTeamID` INT,
    IN `p_victimSquadID` INT,
    IN `p_attacker` VARCHAR(255),
    IN `p_attackerName` VARCHAR(255),
    IN `p_attackerTeamID` INT,
    IN `p_attackerSquadID` INT,
    IN `p_damage` FLOAT,
    IN `p_weapon` VARCHAR(255),
    IN `p_teamkill` BOOLEAN
)
BEGIN
    -- insert players into SteamUsers table
    INSERT INTO `SteamUser` (`steamID`, `lastName`) VALUES (`p_victim`, `p_victimName`)
        ON DUPLICATE KEY UPDATE `lastName` = `p_victimName`;

    INSERT INTO `SteamUser` (`steamID`, `lastName`) VALUES (`p_attacker`, `p_attackerName`)
        ON DUPLICATE KEY UPDATE `lastName` = `p_attackerName`;

    -- create wound record
    INSERT INTO `PlayerWound` (
        `server`,
        `time`,
        `victim`,
        `victimName`,
        `victimTeamID`,
        `victimSquadID`,
        `attacker`,
        `attackerName`,
        `attackerTeamID`,
        `attackerSquadID`,
        `damage`,
        `weapon`,
        `teamkill`
    ) VALUES (
        `p_server`,
        `p_time`,
        `p_victim`,
        `p_victimName`,
        `p_victimTeamID`,
        `p_victimSquadID`,
        `p_attacker`,
        `p_attackerName`,
        `p_attackerTeamID`,
        `p_attackerSquadID`,
        `p_damage`,
        `p_weapon`,
        `p_teamkill`
    );
END#
DELIMITER ;

DROP PROCEDURE IF EXISTS `InsertPlayerDie`;
DELIMITER #
CREATE PROCEDURE `InsertPlayerDie` (
    IN `p_server` INT,
    IN `p_time` TIMESTAMP,
    IN `p_woundTime` TIMESTAMP,
    IN `P_victim` VARCHAR(255),
    IN `p_victimName` VARCHAR(255),
    IN `p_victimTeamID` INT,
    IN `p_victimSquadID` INT,
    IN `p_attacker` VARCHAR(255),
    IN `p_attackerName` VARCHAR(255),
    IN `p_attackerTeamID` INT,
    IN `p_attackerSquadID` INT,
    IN `p_damage` FLOAT,
    IN `p_weapon` VARCHAR(255),
    IN `p_teamkill` BOOLEAN
)
BEGIN
    -- insert players into SteamUsers table
    INSERT INTO `SteamUser` (`steamID`, `lastName`) VALUES (`p_victim`, `p_victimName`)
        ON DUPLICATE KEY UPDATE `lastName` = `p_victimName`;

    INSERT INTO `SteamUser` (`steamID`, `lastName`) VALUES (`p_attacker`, `p_attackerName`)
        ON DUPLICATE KEY UPDATE `lastName` = `p_attackerName`;

    -- create die record
    INSERT INTO `PlayerDie` (
        `server`,
        `time`,
        `woundTime`,
        `victim`,
        `victimName`,
        `victimTeamID`,
        `victimSquadID`,
        `attacker`,
        `attackerName`,
        `attackerTeamID`,
        `attackerSquadID`,
        `damage`,
        `weapon`,
        `teamkill`
    ) VALUES (
        `p_server`,
        `p_time`,
        `p_woundTime`,
        `p_victim`,
        `p_victimName`,
        `p_victimTeamID`,
        `p_victimSquadID`,
        `p_attacker`,
        `p_attackerName`,
        `p_attackerTeamID`,
        `p_attackerSquadID`,
        `p_damage`,
        `p_weapon`,
        `p_teamkill`
    );
END#
DELIMITER ;

DROP PROCEDURE IF EXISTS `InsertPlayerRevive`;
DELIMITER #
CREATE PROCEDURE `InsertPlayerRevive` (
    IN `p_server` INT,
    IN `p_time` TIMESTAMP,
    IN `p_woundTime` TIMESTAMP,
    IN `P_victim` VARCHAR(255),
    IN `p_victimName` VARCHAR(255),
    IN `p_victimTeamID` INT,
    IN `p_victimSquadID` INT,
    IN `p_attacker` VARCHAR(255),
    IN `p_attackerName` VARCHAR(255),
    IN `p_attackerTeamID` INT,
    IN `p_attackerSquadID` INT,
    IN `p_damage` FLOAT,
    IN `p_weapon` VARCHAR(255),
    IN `p_teamkill` BOOLEAN,
    IN `p_reviver` VARCHAR(255),
    IN `p_reviverName` VARCHAR(255),
    IN `p_reviverTeamID` VARCHAR(255),
    IN `p_reviverSquadID` VARCHAR(255)
)
BEGIN
    -- insert players into SteamUsers table
    INSERT INTO `SteamUser` (`steamID`, `lastName`) VALUES (`p_victim`, `p_victimName`)
        ON DUPLICATE KEY UPDATE `lastName` = `p_victimName`;

    INSERT INTO `SteamUser` (`steamID`, `lastName`) VALUES (`p_attacker`, `p_attackerName`)
        ON DUPLICATE KEY UPDATE `lastName` = `p_attackerName`;

    INSERT INTO `SteamUser` (`steamID`, `lastName`) VALUES (`p_reviver`, `p_reviverName`)
        ON DUPLICATE KEY UPDATE `lastName` = `p_reviverName`;

    -- create revive record
    INSERT INTO `Revive` (
        `server`,
        `time`,
        `woundTime`,
        `victim`,
        `victimName`,
        `victimTeamID`,
        `victimSquadID`,
        `attacker`,
        `attackerName`,
        `attackerTeamID`,
        `attackerSquadID`,
        `damage`,
        `weapon`,
        `teamkill`,
        `reviver`,
        `reviverName`,
        `reviverTeamID`,
        `reviverSquadID`
    ) VALUES (
        `p_server`,
        `p_time`,
        `p_woundTime`,
        `p_victim`,
        `p_victimName`,
        `p_victimTeamID`,
        `p_victimSquadID`,
        `p_attacker`,
        `p_attackerName`,
        `p_attackerTeamID`,
        `p_attackerSquadID`,
        `p_damage`,
        `p_weapon`,
        `p_teamkill`,
        `p_reviver`,
        `p_reviverName`,
        `p_reviverTeamID`,
        `p_reviverSquadID`
    );
END#
DELIMITER ;