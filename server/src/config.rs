use std::sync::LazyLock;

use serde::Deserialize;

const CONFIG_PATH: &str = "config/config.toml";

#[derive(Deserialize)]
pub struct Config {
    pub server: Server,
    pub log: Log,
    pub database: Database,
    pub mail: Mail,
    pub app: App,
}

#[derive(Deserialize)]
pub struct Server {
    pub host: String,
    pub port: u16,
}

#[derive(Deserialize)]
pub struct Log {
    pub filter_level: String,
    pub with_ansi: bool,
    pub to_stdout: bool,
    pub directory: String,
    pub file_prefix: String,
    pub rolling: String,
}

#[derive(Deserialize)]
pub struct Database {
    pub url: String,
}

#[derive(Deserialize)]
pub struct Mail {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct App {
    pub deepseek_token: String,
    pub allow_domain: Vec<String>,
}

pub static CONFIG: LazyLock<Config> = LazyLock::new(|| {
    let config_content = std::fs::read_to_string(CONFIG_PATH).expect("Failed to load the config!");
    let config: Config =
        toml::from_str(config_content.as_str()).expect("Failed to parse the config!");
    config
});
