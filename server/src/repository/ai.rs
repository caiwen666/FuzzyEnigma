use anyhow::Result;

use crate::db::db;

pub async fn get(uid: u32) -> Result<Option<(String, u64)>> {
    let res = sqlx::query!("SELECT content, created FROM tb_ai WHERE uid = ?", uid)
        .fetch_optional(db().await)
        .await?
        .map(|row| (row.content, row.created as u64));
    Ok(res)
}

pub async fn update(uid: u32, content: String) -> Result<()> {
    sqlx::query!(
        "INSERT INTO tb_ai (uid, content, created) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE content = ?, created = ?",
        uid,
        content,
        chrono::Utc::now().timestamp_millis(),
        content,
        chrono::Utc::now().timestamp_millis()
    )
    .execute(db().await)
    .await?;
    Ok(())
}
