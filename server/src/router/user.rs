use anyhow::anyhow;
use salvo::{Depot, Request, handler, macros::Extractible};
use serde::Deserialize;
use serde_json::json;
use validator::{Validate, ValidateEmail};

use crate::{
    cache::{CACHE, CacheType},
    context::AppContext,
    entity::user::UserPermission,
    result::{AppError, RouterResult},
    service,
};

#[handler]
pub async fn email_send(req: &mut Request) -> RouterResult {
    let email: String = req.query("email").ok_or(AppError::ArgumentError)?;
    if !email.validate_email() {
        return Err(AppError::ArgumentError);
    }
    if CACHE
        .get(&CacheType::EmailCodeLock(email.clone()))
        .await
        .is_some()
    {
        return Err(anyhow!("发送验证码频繁，请稍后再试").into());
    }
    service::user::send_email_code(email.as_str()).await?;
    CACHE
        .insert(CacheType::EmailCodeLock(email.clone()), "1".to_string())
        .await;
    Ok(().into())
}

#[derive(Deserialize, Validate, Extractible)]
#[salvo(extract(default_source(from = "body")))]
struct EmailVerifyForm {
    #[validate(email)]
    email: String,
    #[validate(range(min = 100000, max = 999999))]
    code: u32,
}

#[handler]
pub async fn email_verify(req: &mut Request) -> RouterResult {
    let arg: EmailVerifyForm = req.extract().await?;
    if arg.validate().is_err() {
        return Err(AppError::ArgumentError);
    }
    let ticket = service::user::verify_email_code(arg.email.as_str(), arg.code)
        .await?
        .ok_or(anyhow!("验证码错误"))?;
    Ok(ticket.into())
}

#[derive(Deserialize, Validate, Extractible)]
#[salvo(extract(default_source(from = "body")))]
struct RegisterForm {
    ticket: String,
    #[validate(length(min = 6, max = 60))]
    password: String,
    #[validate(length(max = 20))]
    username: String,
}

#[handler]
pub async fn register(req: &mut Request) -> RouterResult {
    let arg: RegisterForm = req.extract().await?;
    if arg.validate().is_err() {
        return Err(AppError::ArgumentError);
    }
    let email = service::user::check_email_ticket(arg.ticket.as_str())
        .await?
        .ok_or(anyhow!("验证码失效，请重新发送验证码"))?;
    if service::user::get_uid_by_email(email.as_str())
        .await?
        .is_some()
    {
        return Err(anyhow!("用户已存在").into());
    }
    let uid =
        service::user::add(email.as_str(), arg.username.as_str(), arg.password.as_str()).await?;
    service::user::delete_email_ticket(arg.ticket.as_str()).await?;
    let token = service::user::generate_user_session(uid).await?;
    Ok(token.into())
}

#[derive(Deserialize, Validate, Extractible)]
#[salvo(extract(default_source(from = "body")))]
struct LoginForm {
    #[validate(email)]
    email: String,
    #[validate(length(min = 6, max = 60))]
    password: String,
}

#[handler]
pub async fn login(req: &mut Request) -> RouterResult {
    let arg: LoginForm = req.extract().await?;
    if arg.validate().is_err() {
        return Err(AppError::ArgumentError);
    }
    if let Some(uid) = service::user::get_uid_by_email(arg.email.as_str()).await? {
        if service::user::check_password(uid, arg.password.as_str()).await? {
            let token = service::user::generate_user_session(uid).await?;
            Ok(token.into())
        } else {
            return Err(anyhow!("密码错误").into());
        }
    } else {
        return Err(anyhow!("用户不存在").into());
    }
}

#[handler]
/// Query: token
pub async fn logout(depot: &mut Depot) -> RouterResult {
    let context = depot.obtain::<AppContext>().unwrap();
    service::user::delete_user_session(context.token.as_str()).await?;
    Ok(().into())
}

#[handler]
pub async fn info(depot: &mut Depot) -> RouterResult {
    let context = depot.obtain::<AppContext>().unwrap();
    Ok(json!({
        "basic_info": context.user,
        "permission": context.permissions.clone().into_vec(),
    })
    .into())
}

#[handler]
pub async fn search(req: &mut Request) -> RouterResult {
    let keyword: String = req.query("keyword").ok_or(AppError::ArgumentError)?;
    if keyword.is_empty() {
        return Err(AppError::ArgumentError);
    }
    let users = service::user::search(keyword.as_str()).await?;
    Ok(users.into())
}

#[handler]
pub async fn delete(req: &mut Request, depot: &mut Depot) -> RouterResult {
    let uid: u32 = req.query("uid").ok_or(AppError::ArgumentError)?;
    let context = depot.obtain::<AppContext>().unwrap();
    if context.user.uid == uid {
        return Err(anyhow!("不能删除自己").into());
    }
    if !context.permissions.manage_user() {
        return Err(AppError::PermissionDenied);
    }
    if service::user::get_basic_info(uid).await?.is_none() {
        return Err(anyhow!("用户不存在").into());
    }
    let user_permissions = service::user::get_permissions(uid).await?;
    if user_permissions.root() {
        return Err(AppError::PermissionDenied);
    }
    service::user::delete(uid).await?;
    Ok(().into())
}

#[derive(Deserialize, Extractible)]
#[salvo(extract(default_source(from = "body")))]
struct UpdatePermissionForm {
    uid: u32,
    permission: Vec<String>,
}

#[handler]
pub async fn update_permission(req: &mut Request, depot: &mut Depot) -> RouterResult {
    let arg: UpdatePermissionForm = req.extract().await?;
    let context = depot.obtain::<AppContext>().unwrap();
    if !context.permissions.root() {
        return Err(AppError::PermissionDenied);
    }
    if service::user::get_basic_info(arg.uid).await?.is_none() {
        return Err(anyhow!("用户不存在").into());
    }
    let ori = service::user::get_permissions(arg.uid).await?;
    let target = UserPermission::new(arg.permission);
    let (added, deleted) = target.differ(&ori);
    if added.root() || deleted.root() {
        return Err(anyhow!("不能添加或删除 root 权限").into());
    }
    for v in added.into_vec() {
        service::user::add_permission(arg.uid, v).await?;
    }
    for v in deleted.into_vec() {
        service::user::delete_permission(arg.uid, v).await?;
    }
    Ok(().into())
}

#[handler]
pub async fn list(depot: &mut Depot) -> RouterResult {
    let context = depot.obtain::<AppContext>().unwrap();
    if !context.permissions.manage_user() {
        return Err(AppError::PermissionDenied);
    }
    let users = service::user::all().await?;
    let mut res = Vec::new();
    for u in users {
        res.push(json!({
            "info": u,
            "permissions": service::user::get_permissions(u.uid).await?.into_vec(),
        }));
    }
    Ok(res.into())
}
