use serde::{Deserialize, Serialize};
use sqlx::{MySql, Type};
use validator::Validate;

use super::user::UserBasicInfo;

#[derive(PartialEq, Eq, PartialOrd, Ord, Deserialize, Serialize, Clone, Copy)]
#[repr(u32)]
pub enum TaskPriority {
    #[serde(rename = "low")]
    Low = 0,
    #[serde(rename = "medium")]
    Medium = 1,
    #[serde(rename = "high")]
    High = 2,
}

impl Type<MySql> for TaskPriority {
    fn type_info() -> sqlx::mysql::MySqlTypeInfo {
        <u32 as Type<MySql>>::type_info()
    }
}

impl Into<TaskPriority> for u32 {
    fn into(self) -> TaskPriority {
        match self {
            0 => TaskPriority::Low,
            1 => TaskPriority::Medium,
            2 => TaskPriority::High,
            _ => panic!("Invalid task priority"),
        }
    }
}

impl From<TaskPriority> for u32 {
    fn from(value: TaskPriority) -> Self {
        match value {
            TaskPriority::Low => 0,
            TaskPriority::Medium => 1,
            TaskPriority::High => 2,
        }
    }
}

#[derive(Deserialize, Serialize, sqlx::Type, PartialEq, Clone, Copy)]
#[sqlx(type_name = "VARCHAR")]
#[sqlx(rename_all = "lowercase")]
pub enum TaskType {
    #[serde(rename = "homework")]
    Homework,
    #[serde(rename = "review")]
    Review,
    #[serde(rename = "discussion")]
    Discussion,
    #[serde(rename = "extra")]
    Extra,
    #[serde(rename = "group")]
    Group,
}

impl Into<TaskType> for String {
    fn into(self) -> TaskType {
        match self.as_str() {
            "homework" => TaskType::Homework,
            "review" => TaskType::Review,
            "discussion" => TaskType::Discussion,
            "extra" => TaskType::Extra,
            "group" => TaskType::Group,
            _ => panic!("Invalid task type"),
        }
    }
}

#[derive(Deserialize, Serialize, sqlx::FromRow, Validate, Clone)]
pub struct TaskInfo {
    #[validate(length(min = 1))]
    pub title: String,
    #[serde(rename = "type")]
    #[sqlx(rename = "type")]
    pub typ: TaskType,
    pub priority: TaskPriority,
    #[validate(range(min = 1))]
    pub cost: u32,
    pub deadline: u64,
}

#[derive(Deserialize, Serialize, sqlx::FromRow, Clone)]
pub struct Task {
    pub id: u32,
    pub info: TaskInfo,
    pub publisher: u32,
    pub prev: Option<u32>,
}

#[derive(Deserialize, Serialize)]
pub struct TaskDTO {
    pub id: u32,
    pub info: TaskInfo,
    pub publisher: UserBasicInfo,
}
