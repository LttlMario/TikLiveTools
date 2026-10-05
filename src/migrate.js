const db=require('./db');
async function migrate(){
  const statements=[
    "CREATE TABLE IF NOT EXISTS goals (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(180) NOT NULL, goal_type VARCHAR(50) NOT NULL, target DECIMAL(18,2) NOT NULL DEFAULT 0, current_value DECIMAL(18,2) NOT NULL DEFAULT 0, enabled TINYINT(1) NOT NULL DEFAULT 1, reset_mode ENUM('manual','stream','daily') NOT NULL DEFAULT 'stream', created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS chat_commands (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, command_name VARCHAR(80) NOT NULL UNIQUE, response_text TEXT NULL, enabled TINYINT(1) NOT NULL DEFAULT 1, required_role ENUM('everyone','follower','subscriber','moderator') NOT NULL DEFAULT 'everyone', cooldown_seconds INT UNSIGNED NOT NULL DEFAULT 0, actions JSON NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS sound_alerts (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(160) NOT NULL, trigger_type VARCHAR(50) NOT NULL, trigger_config JSON NOT NULL, file_path TEXT NULL, volume DECIMAL(4,3) NOT NULL DEFAULT 1, enabled TINYINT(1) NOT NULL DEFAULT 1, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS song_requests (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, unique_id VARCHAR(120) NULL, display_name VARCHAR(180) NULL, title VARCHAR(240) NOT NULL, artist VARCHAR(240) NULL, external_url TEXT NULL, status ENUM('queued','playing','played','skipped','rejected') NOT NULL DEFAULT 'queued', points_cost DECIMAL(18,2) NOT NULL DEFAULT 0, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, played_at TIMESTAMP NULL, INDEX idx_song_status(status,created_at))",
    "CREATE TABLE IF NOT EXISTS game_sessions (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, game_type VARCHAR(60) NOT NULL, status ENUM('idle','running','finished') NOT NULL DEFAULT 'idle', settings JSON NOT NULL, state JSON NOT NULL, started_at TIMESTAMP NULL, ended_at TIMESTAMP NULL)",
    "CREATE TABLE IF NOT EXISTS overlay_configs (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, slug VARCHAR(100) NOT NULL UNIQUE, title VARCHAR(160) NOT NULL, config JSON NOT NULL, enabled TINYINT(1) NOT NULL DEFAULT 1, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)",
  ];
  for(const sql of statements)await db.pool.query(sql);
}
module.exports=migrate;
