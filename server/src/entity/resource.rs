use serde::{Deserialize, Serialize};

use super::user::UserBasicInfo;

#[derive(Deserialize, Serialize, sqlx::FromRow)]
pub struct Resource {
    pub id: u32,
    pub typ: String,
    pub content: String,
    pub name: String,
    pub tid: u32,
}

#[derive(Deserialize, Serialize)]
pub enum ResourceType {
    #[serde(rename = "link")]
    LINK,
    #[serde(rename = "file")]
    FILE,
}

#[derive(Deserialize, Serialize, Clone, Copy, PartialEq)]
pub enum ResourceAttitude {
    #[serde(rename = "up")]
    UP,
    #[serde(rename = "down")]
    DOWN,
    #[serde(rename = "none")]
    NONE,
}

impl From<ResourceType> for String {
    fn from(typ: ResourceType) -> Self {
        match typ {
            ResourceType::LINK => "link".to_string(),
            ResourceType::FILE => "file".to_string(),
        }
    }
}

impl From<ResourceAttitude> for String {
    fn from(typ: ResourceAttitude) -> Self {
        match typ {
            ResourceAttitude::UP => "up".to_string(),
            ResourceAttitude::DOWN => "down".to_string(),
            ResourceAttitude::NONE => "none".to_string(),
        }
    }
}

impl From<String> for ResourceType {
    fn from(typ: String) -> Self {
        match typ.as_str() {
            "link" => ResourceType::LINK,
            "file" => ResourceType::FILE,
            _ => panic!("Invalid resource type"),
        }
    }
}

impl From<String> for ResourceAttitude {
    fn from(typ: String) -> Self {
        match typ.as_str() {
            "up" => ResourceAttitude::UP,
            "down" => ResourceAttitude::DOWN,
            "none" => ResourceAttitude::NONE,
            _ => panic!("Invalid resource attitude"),
        }
    }
}

pub struct Comment {
    pub id: u32,
    pub content: String,
    pub rid: u32,
    pub time: u64,
    pub uid: u32,
}

#[derive(Deserialize, Serialize)]
pub struct CommentDTO {
    pub id: u32,
    pub user: UserBasicInfo,
    pub content: String,
    pub time: u64,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResourceDTO {
    pub id: u32,
    #[serde(rename = "type")]
    pub typ: String,
    pub name: String,
    pub up: u32,
    pub down: u32,
    pub comment_count: u32,
    pub tags: Vec<String>,
}
