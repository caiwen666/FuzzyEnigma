use crate::{
    db::db,
    entity::resource::{Comment, Resource, ResourceAttitude, ResourceType},
};
use anyhow::Result;
use chrono::Utc;

pub async fn get_with_task(task_id: u32) -> Result<Vec<Resource>> {
    let res = sqlx::query_as!(
        Resource,
        r#"
        SELECT id, type AS "typ!", content, name, tid
        FROM tb_resource
        WHERE tid = ?
        "#,
        task_id
    )
    .fetch_all(db().await)
    .await?;
    Ok(res)
}

pub async fn get_comment_count(id: u32) -> Result<u32> {
    let res = sqlx::query!(
        r#"
        SELECT COUNT(*) AS count
        FROM tb_comment
        WHERE rid = ?
        "#,
        id
    )
    .fetch_one(db().await)
    .await?;
    Ok(res.count as u32)
}

pub async fn get_tags(id: u32) -> Result<Vec<String>> {
    let res = sqlx::query!(
        r#"
        SELECT value
        FROM tb_resource_tag
        WHERE rid = ?
        "#,
        id
    )
    .fetch_all(db().await)
    .await?
    .into_iter()
    .map(|r| r.value)
    .collect();
    Ok(res)
}

pub async fn add_tag(id: u32, tag: String) -> Result<()> {
    sqlx::query!(
        r#"
        INSERT INTO tb_resource_tag (rid, value)
        VALUES (?, ?)
        "#,
        id,
        tag
    )
    .execute(crate::db::db().await)
    .await?;
    Ok(())
}

pub async fn delete_tag(id: u32, tag: String) -> Result<()> {
    sqlx::query!(
        r#"
        DELETE FROM tb_resource_tag
        WHERE rid = ? AND value = ?
        "#,
        id,
        tag
    )
    .execute(db().await)
    .await?;
    Ok(())
}

pub async fn add(task_id: u32, typ: ResourceType, name: String) -> Result<u32> {
    let res = sqlx::query!(
        r#"
        INSERT INTO tb_resource (type, content, name, tid)
        VALUES (?, ?, ?, ?)
        "#,
        String::from(typ),
        "",
        name,
        task_id
    )
    .execute(db().await)
    .await?;
    Ok(res.last_insert_id() as u32)
}

pub async fn set_content(id: u32, content: String) -> Result<()> {
    sqlx::query!(
        r#"
        UPDATE tb_resource
        SET content = ?
        WHERE id = ?
        "#,
        content,
        id
    )
    .execute(db().await)
    .await?;
    Ok(())
}

pub async fn delete(id: u32) -> Result<()> {
    sqlx::query!(
        r#"
        DELETE FROM tb_resource
        WHERE id = ?
        "#,
        id
    )
    .execute(db().await)
    .await?;
    Ok(())
}

pub async fn update_attitude(resource_id: u32, uid: u32, attitude: ResourceAttitude) -> Result<()> {
    sqlx::query!(
        r#"
        INSERT INTO link_user_resource (uid, rid, attitude)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE attitude = ?
        "#,
        uid,
        resource_id,
        String::from(attitude),
        String::from(attitude)
    )
    .execute(db().await)
    .await?;
    Ok(())
}

pub async fn get_attitude(resource_id: u32, uid: u32) -> Result<ResourceAttitude> {
    let res = sqlx::query!(
        r#"
        SELECT attitude
        FROM link_user_resource
        WHERE rid = ? AND uid = ?
        "#,
        resource_id,
        uid
    )
    .fetch_optional(crate::db::db().await)
    .await?;
    if let Some(r) = res {
        return Ok(ResourceAttitude::from(r.attitude));
    } else {
        return Ok(ResourceAttitude::NONE);
    }
}

pub async fn up_count(resource_id: u32) -> Result<u32> {
    let res = sqlx::query!(
        r#"
        SELECT COUNT(*) AS count
        FROM link_user_resource
        WHERE rid = ? AND attitude = 'up'
        "#,
        resource_id
    )
    .fetch_one(db().await)
    .await?;
    Ok(res.count as u32)
}

pub async fn down_count(resource_id: u32) -> Result<u32> {
    let res = sqlx::query!(
        r#"
        SELECT COUNT(*) AS count
        FROM link_user_resource
        WHERE rid = ? AND attitude = 'down'
        "#,
        resource_id
    )
    .fetch_one(db().await)
    .await?;
    Ok(res.count as u32)
}

pub async fn update(id: u32, name: String) -> Result<()> {
    sqlx::query!(
        r#"
        UPDATE tb_resource
        SET name = ?
        WHERE id = ?
        "#,
        name,
        id
    )
    .execute(db().await)
    .await?;
    Ok(())
}

pub async fn add_comment(resource_id: u32, uid: u32, content: String) -> Result<u32> {
    let res = sqlx::query!(
        r#"
        INSERT INTO tb_comment (rid, uid, content, time)
        VALUES (?, ?, ?, ?)
        "#,
        resource_id,
        uid,
        content,
        Utc::now().timestamp_millis()
    )
    .execute(db().await)
    .await?;
    Ok(res.last_insert_id() as u32)
}

pub async fn delete_comment(comment_id: u32) -> Result<()> {
    sqlx::query!(
        r#"
        DELETE FROM tb_comment
        WHERE id = ?
        "#,
        comment_id
    )
    .execute(db().await)
    .await?;
    Ok(())
}

pub async fn get_comments(id: u32) -> Result<Vec<Comment>> {
    let res = sqlx::query_as!(
        Comment,
        r#"
        SELECT id, content, rid, time, uid
        FROM tb_comment
        WHERE rid = ?
        "#,
        id
    )
    .fetch_all(db().await)
    .await?;
    Ok(res)
}

pub async fn get(id: u32) -> Result<Resource> {
    let res = sqlx::query_as!(
        Resource,
        r#"
        SELECT id, type AS "typ!", content, name, tid
        FROM tb_resource
        WHERE id = ?
        "#,
        id
    )
    .fetch_one(db().await)
    .await?;
    Ok(res)
}

pub async fn get_comment(id: u32) -> Result<Option<Comment>> {
    let res = sqlx::query_as!(
        Comment,
        r#"
        SELECT id, content, rid, time, uid
        FROM tb_comment
        WHERE id = ?
        "#,
        id
    )
    .fetch_optional(db().await)
    .await?;
    Ok(res)
}
