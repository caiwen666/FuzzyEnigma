use crate::{
    db::db,
    entity::user::{UserBasicInfo, UserPermission},
    utils::compute_str_md5,
};
use anyhow::Result;

pub async fn get_basic_info(uid: u32) -> Result<Option<UserBasicInfo>> {
    let res = sqlx::query_as!(
        UserBasicInfo,
        r#"
        SELECT uid, username, email
        FROM tb_user
        WHERE uid = ?
        "#,
        uid
    )
    .fetch_optional(db().await)
    .await?;
    Ok(res)
}

pub async fn get_password(uid: u32) -> Result<Option<String>> {
    let res = sqlx::query!(
        r#"
        SELECT password
        FROM tb_user
        WHERE uid = ?
        "#,
        uid
    )
    .fetch_optional(db().await)
    .await?
    .map(|r| r.password);
    Ok(res)
}

pub async fn add(username: String, email: String, password: String) -> Result<u32> {
    let res = sqlx::query!(
        r#"
        INSERT INTO tb_user (username, email, password, sign, ccfLevel, rating, intro, submitted, accepted)
        VALUES (?, ?, ?, '', 0, 0, '', 0, 0)
        "#,
        username,
        email,
        compute_str_md5(password)
    )
    .execute(db().await)
    .await?;
    Ok(res.last_insert_id() as u32)
}

pub async fn get_permission(uid: u32) -> Result<UserPermission> {
    let res = sqlx::query!(
        r#"
        SELECT value
        FROM tb_user_permissions
        WHERE uid = ?
        "#,
        uid
    )
    .fetch_all(db().await)
    .await?
    .into_iter()
    .map(|r| r.value)
    .collect::<Vec<_>>();
    Ok(UserPermission::new(res))
}

pub async fn get_uid_by_email(email: &str) -> Result<Option<u32>> {
    let res = sqlx::query!(
        r#"
        SELECT uid
        FROM tb_user
        WHERE email = ?
        "#,
        email
    )
    .fetch_optional(db().await)
    .await?
    .map(|r| r.uid);
    Ok(res)
}

pub async fn search(keyword: &str) -> Result<Vec<UserBasicInfo>> {
    let res = sqlx::query_as!(
        UserBasicInfo,
        r#"
        SELECT uid, username, email
        FROM tb_user
        WHERE username LIKE ?
        "#,
        format!("%{}%", keyword)
    )
    .fetch_all(db().await)
    .await?;
    Ok(res)
}

pub async fn all() -> Result<Vec<UserBasicInfo>> {
    let res = sqlx::query_as!(
        UserBasicInfo,
        r#"
        SELECT uid, username, email
        FROM tb_user
        "#,
    )
    .fetch_all(db().await)
    .await?;
    Ok(res)
}

pub async fn delete(uid: u32) -> Result<()> {
    sqlx::query!(
        r#"
        DELETE FROM tb_user
        WHERE uid = ?
        "#,
        uid
    )
    .execute(db().await)
    .await?;
    Ok(())
}

pub async fn add_permission(uid: u32, permission: String) -> Result<()> {
    sqlx::query!(
        r#"
        INSERT INTO tb_user_permissions (uid, value)
        VALUES (?, ?)
        "#,
        uid,
        permission
    )
    .execute(db().await)
    .await?;
    Ok(())
}

pub async fn delete_permission(uid: u32, permission: String) -> Result<()> {
    sqlx::query!(
        r#"
        DELETE FROM tb_user_permissions
        WHERE uid = ? AND value = ?
        "#,
        uid,
        permission
    )
    .execute(db().await)
    .await?;
    Ok(())
}
