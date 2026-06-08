-- Airship Battle Game Database Schema
-- 复古飞艇弹幕射击游戏数据库

CREATE DATABASE IF NOT EXISTS airship_game 
    DEFAULT CHARACTER SET utf8mb4 
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE airship_game;

CREATE TABLE IF NOT EXISTS player_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player_name VARCHAR(50) NOT NULL UNIQUE COMMENT '玩家昵称',
    kills INT DEFAULT 0 COMMENT '总击杀数',
    deaths INT DEFAULT 0 COMMENT '总死亡数',
    total_score INT DEFAULT 0 COMMENT '总得分',
    games_played INT DEFAULT 0 COMMENT '游戏场次',
    wins INT DEFAULT 0 COMMENT '胜利场次',
    last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后游戏时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_score (total_score),
    INDEX idx_kills (kills),
    INDEX idx_wins (wins),
    INDEX idx_last_played (last_played)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='玩家统计数据';

INSERT INTO player_stats (player_name, kills, deaths, total_score, games_played, wins) VALUES
    ('AcePilot', 156, 45, 15600, 32, 22),
    ('SkyMaster', 128, 52, 12800, 28, 18),
    ('StormRider', 95, 67, 9500, 21, 11),
    ('CloudHunter', 87, 38, 8700, 19, 13),
    ('ThunderBolt', 76, 89, 7600, 17, 7),
    ('BulletDodger', 62, 41, 6200, 14, 8),
    ('PixelHero', 45, 55, 4500, 12, 5),
    ('RetroGamer', 38, 62, 3800, 10, 3)
ON DUPLICATE KEY UPDATE player_name = VALUES(player_name);

DELIMITER //
CREATE PROCEDURE GetTopPlayers(IN limit_count INT)
BEGIN
    SELECT 
        player_name,
        kills,
        deaths,
        total_score,
        games_played,
        wins,
        CASE WHEN games_played > 0 THEN ROUND(wins / games_played * 100, 2) ELSE 0 END AS win_rate,
        CASE WHEN deaths > 0 THEN ROUND(kills / deaths, 2) ELSE kills END AS kd_ratio
    FROM player_stats
    ORDER BY total_score DESC
    LIMIT limit_count;
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE GetPlayerStats(IN p_name VARCHAR(50))
BEGIN
    SELECT 
        player_name,
        kills,
        deaths,
        total_score,
        games_played,
        wins,
        CASE WHEN games_played > 0 THEN ROUND(wins / games_played * 100, 2) ELSE 0 END AS win_rate,
        CASE WHEN deaths > 0 THEN ROUND(kills / deaths, 2) ELSE kills END AS kd_ratio,
        last_played,
        created_at
    FROM player_stats
    WHERE player_name = p_name;
END //
DELIMITER ;

SELECT 'Database initialized successfully!' AS status;
