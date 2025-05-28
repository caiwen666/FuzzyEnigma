use crate::{
    cache::{CACHE, CacheType},
    entity::user::{UserBasicInfo, UserPermission},
    mail::{build_auth_email_msg, mailer},
    repository,
    utils::compute_str_md5,
};
use anyhow::Result;
use chrono::Utc;
use lettre::AsyncTransport;
use rand::{Rng, SeedableRng};
use rand_chacha::ChaCha12Rng;
/// 发送验证邮件
/// 发送邮件，并把验证码加到 moka 中，EmailCodeLock 由调用者考虑
pub async fn send_email_code(email: &str) -> Result<()> {
    let mut rng = ChaCha12Rng::from_os_rng();
    let code: u32 = rng.random_range(100000..999999);
    drop(rng);
    let mail = build_auth_email_msg(email, code as usize).await?;
    mailer().await.send(mail).await?;
    CACHE
        .insert(
            CacheType::EmailCode(String::from(email), code),
            "1".to_string(),
        )
        .await;
    Ok(())
}

/// 校验邮箱验证码
/// 如果验证成功会生成一个 ticket 并加入到 moka 中，并把原来的验证码从 moka 中删除
pub async fn verify_email_code(email: &str, code: u32) -> Result<Option<String>> {
    if CACHE
        .get(&CacheType::EmailCode(String::from(email), code))
        .await
        .is_some()
    {
        CACHE
            .remove(&CacheType::EmailCode(String::from(email), code))
            .await;
        let ticket = compute_str_md5(format!(
            "preuser_session_{}_{}",
            email,
            Utc::now().timestamp_millis()
        ));
        CACHE
            .insert(CacheType::EmailTicket(ticket.clone()), String::from(email))
            .await;
        Ok(Some(ticket))
    } else {
        Ok(None)
    }
}

/// 校验邮件验证的 ticket
pub async fn check_email_ticket(token: &str) -> Result<Option<String>> {
    if let Some(email) = CACHE
        .get(&CacheType::EmailTicket(String::from(token)))
        .await
    {
        Ok(Some(email))
    } else {
        Ok(None)
    }
}

/// 删除预登录状态的会话 token
pub async fn delete_email_ticket(token: &str) -> Result<()> {
    CACHE
        .remove(&CacheType::EmailTicket(String::from(token)))
        .await;
    Ok(())
}

pub async fn get_uid_by_email(email: &str) -> Result<Option<u32>> {
    repository::user::get_uid_by_email(email).await
}

/// 生成用户登录状态的会话 token
pub async fn generate_user_session(uid: u32) -> Result<String> {
    let token = compute_str_md5(format!(
        "user_session_{}_{}",
        uid,
        Utc::now().timestamp_millis()
    ));
    CACHE
        .insert(CacheType::UserSession(token.clone()), uid.to_string())
        .await;
    Ok(token)
}

/// 校验用户登录状态的会话 token
pub async fn verify_user_session(token: &str) -> Result<Option<u32>> {
    if let Some(uid_str) = CACHE
        .get(&CacheType::UserSession(String::from(token)))
        .await
    {
        Ok(Some(uid_str.parse()?))
    } else {
        Ok(None)
    }
}

/// 删除用户登录状态的会话 token
pub async fn delete_user_session(token: &str) -> Result<()> {
    CACHE
        .remove(&CacheType::UserSession(String::from(token)))
        .await;
    Ok(())
}

/// 向数据库中添加用户
pub async fn add(email: &str, username: &str, password: &str) -> Result<u32> {
    let uid = repository::user::add(
        String::from(username),
        String::from(email),
        String::from(password),
    )
    .await?;
    Ok(uid as u32)
}

pub async fn check_password(uid: u32, password: &str) -> Result<bool> {
    let pwd: String = repository::user::get_password(uid).await?.unwrap();
    if compute_str_md5(password) == pwd {
        Ok(true)
    } else {
        Ok(false)
    }
}

pub async fn get_permissions(uid: u32) -> Result<UserPermission> {
    let permissions = repository::user::get_permission(uid).await?;
    Ok(permissions)
}

/// 获取用户信息
pub async fn get_basic_info(uid: u32) -> Result<Option<UserBasicInfo>> {
    Ok(repository::user::get_basic_info(uid).await?)
}

pub async fn search(keyword: &str) -> Result<Vec<UserBasicInfo>> {
    repository::user::search(keyword).await
}

pub async fn all() -> Result<Vec<UserBasicInfo>> {
    repository::user::all().await
}

pub async fn delete(uid: u32) -> Result<()> {
    repository::user::delete(uid).await
}

pub async fn add_permission(uid: u32, permission: String) -> Result<()> {
    repository::user::add_permission(uid, permission).await
}

pub async fn delete_permission(uid: u32, permission: String) -> Result<()> {
    repository::user::delete_permission(uid, permission).await
}
