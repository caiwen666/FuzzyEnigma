use crate::entity::user::{UserBasicInfo, UserPermission};

pub struct AppContext {
    pub user: UserBasicInfo,
    pub permissions: UserPermission,
    pub token: String,
}

impl AppContext {
    pub fn new(user: UserBasicInfo, permissions: UserPermission, token: String) -> Self {
        Self {
            user,
            permissions,
            token,
        }
    }
}
