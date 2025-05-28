use std::{sync::LazyLock, time::Duration};

use moka::{Expiry, future::Cache};

#[derive(Eq, Hash, PartialEq)]
pub enum CacheType {
    UserSession(String),    // (token)
    EmailCode(String, u32), // (email, code)
    EmailCodeLock(String),  // (email)
    EmailTicket(String), // (token) 预登录状态，一般用于用户无登录状态时保存会话。目前是用在注册时
    ResourceTicket(String), // (file_name)
}

pub type CacheKey = CacheType;
pub type CacheValue = String;

impl CacheType {
    fn expire_after_fetch(&self) -> Option<Duration> {
        match self {
            CacheType::UserSession(_) => Some(Duration::from_secs(60 * 60 * 12)), // 用户登录状态在12小时内有效
            CacheType::EmailCode(_, _) => Some(Duration::from_secs(60 * 5)), // 邮箱验证码在5分钟内有效
            CacheType::EmailCodeLock(_) => Some(Duration::from_secs(60)),    // 60 秒发一次验证码
            CacheType::EmailTicket(_) => Some(Duration::from_secs(5 * 60)),  // 5min
            CacheType::ResourceTicket(_) => Some(Duration::from_secs(30)), // 30s
        }
    }
}

struct ExpiryPolicy;
impl Expiry<CacheKey, CacheValue> for ExpiryPolicy {
    fn expire_after_create(
        &self,
        key: &CacheKey,
        _value: &CacheValue,
        _created_at: std::time::Instant,
    ) -> Option<Duration> {
        key.expire_after_fetch()
    }

    fn expire_after_update(
        &self,
        key: &CacheKey,
        _value: &CacheValue,
        _updated_at: std::time::Instant,
        _duration_until_expiry: Option<std::time::Duration>,
    ) -> Option<Duration> {
        key.expire_after_fetch()
    }
}

pub static CACHE: LazyLock<Cache<CacheKey, CacheValue>> = LazyLock::new(|| {
    Cache::builder()
        .max_capacity(10000) // 简单设置一下缓存的容量。希望不会出现缓存溢出
        .expire_after(ExpiryPolicy)
        .build()
});
