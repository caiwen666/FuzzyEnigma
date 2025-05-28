use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, sqlx::FromRow)]
pub struct UserBasicInfo {
    pub uid: u32,
    pub username: String,
    pub email: String,
}

#[derive(Clone)]
pub struct UserPermission {
    permission: Vec<String>,
}

impl UserPermission {
    pub fn new(permission: Vec<String>) -> Self {
        Self { permission }
    }
    pub fn manage_all_task(&self) -> bool {
        self.permission.contains(&String::from("manage_all_task"))
    }
    pub fn manage_user(&self) -> bool {
        self.permission.contains(&String::from("manage_user"))
    }
    pub fn root(&self) -> bool {
        self.permission.contains(&String::from("root"))
    }
    pub fn assign_task(&self) -> bool {
        self.permission.contains(&String::from("assign_task"))
    }
    /// 求当前的值和给定的值的相对变化
    /// 返回(added, deleted)
    /// added: 当前相对于给定的值的新增的权限
    /// deleted: 当前相对于给定的值的删除的权限
    pub fn differ(&self, ori: &UserPermission) -> (UserPermission, UserPermission) {
        let mut added = Vec::new();
        let mut deleted = Vec::new();
        for permission in &self.permission {
            if !ori.permission.contains(permission) {
                added.push(permission.clone());
            }
        }
        for permission in &ori.permission {
            if !self.permission.contains(permission) {
                deleted.push(permission.clone());
            }
        }
        (Self::new(added), Self::new(deleted))
    }

    pub fn into_vec(self) -> Vec<String> {
        self.permission
    }

    pub fn ai(&self) -> bool {
        self.permission.contains(&String::from("ai"))
    }
}
