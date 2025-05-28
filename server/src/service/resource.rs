use crate::{
    cache::{CACHE, CacheType},
    db::db,
    entity::resource::{
        Comment, CommentDTO, Resource, ResourceAttitude, ResourceDTO, ResourceType,
    },
    repository,
    utils::compute_str_md5,
};
use anyhow::{Ok, Result};
use chrono::Utc;
use sqlx::Row;
use tracing::error;

pub async fn get_with_task(task_id: u32) -> Result<Vec<Resource>> {
    repository::resource::get_with_task(task_id).await
}

pub async fn get_comment_count(id: u32) -> Result<u32> {
    repository::resource::get_comment_count(id).await
}

pub async fn get_tags(id: u32) -> Result<Vec<String>> {
    repository::resource::get_tags(id).await
}

pub async fn add_tag(id: u32, tag: String) -> Result<()> {
    repository::resource::add_tag(id, tag).await
}

pub async fn delete_tag(id: u32, tag: String) -> Result<()> {
    repository::resource::delete_tag(id, tag).await
}

pub async fn get_attitude(id: u32, uid: u32) -> Result<ResourceAttitude> {
    repository::resource::get_attitude(id, uid).await
}

pub async fn update_attitude(id: u32, uid: u32, attitude: ResourceAttitude) -> Result<()> {
    repository::resource::update_attitude(id, uid, attitude).await
}

pub async fn up_count(id: u32) -> Result<u32> {
    repository::resource::up_count(id).await
}

pub async fn down_count(id: u32) -> Result<u32> {
    repository::resource::down_count(id).await
}

pub async fn add(task_id: u32, name: String, typ: ResourceType, tags: Vec<String>) -> Result<u32> {
    let id = repository::resource::add(task_id, typ, name).await?;
    for tag in tags {
        add_tag(id, tag).await?;
    }
    Ok(id)
}

pub async fn set_content(id: u32, content: String) -> Result<()> {
    repository::resource::set_content(id, content).await
}

pub async fn update(id: u32, name: String) -> Result<()> {
    repository::resource::update(id, name).await
}

pub async fn delete(id: u32) -> Result<()> {
    repository::resource::delete(id).await
}

pub async fn get_comments(id: u32) -> Result<Vec<Comment>> {
    repository::resource::get_comments(id).await
}

pub async fn get(id: u32) -> Result<Resource> {
    repository::resource::get(id).await
}

pub async fn to_resource_dto(v: Resource) -> Result<ResourceDTO> {
    let up = up_count(v.id).await?;
    let down = down_count(v.id).await?;
    let comment_count = get_comment_count(v.id).await?;
    let tags = get_tags(v.id).await?;
    let res = ResourceDTO {
        id: v.id,
        typ: v.typ,
        name: v.name,
        up,
        down,
        comment_count,
        tags,
    };
    Ok(res)
}

pub async fn to_comment_dto(v: Comment) -> Result<CommentDTO> {
    let user = super::user::get_basic_info(v.uid).await?.unwrap();
    let res = CommentDTO {
        id: v.id,
        user,
        content: v.content,
        time: v.time,
    };
    Ok(res)
}

pub async fn add_comment(uid: u32, rid: u32, content: String) -> Result<u32> {
    repository::resource::add_comment(rid, uid, content).await
}

pub async fn delete_comment(id: u32) -> Result<()> {
    repository::resource::delete_comment(id).await
}

pub async fn get_comment(id: u32) -> Result<Option<Comment>> {
    repository::resource::get_comment(id).await
}

pub async fn get_recommend(uid: u32, task_id: u32) -> Result<Vec<Resource>> {
    let tags = sqlx::query!(
        r#"
        SELECT DISTINCT value 
        FROM tb_resource_tag WHERE rid IN (
            SELECT id FROM tb_resource WHERE tid = ?
        )
        "#,
        task_id
    )
    .fetch_all(db().await)
    .await?
    .into_iter()
    .map(|x| x.value)
    .collect::<Vec<_>>();
    if tags.is_empty() {
        return Ok(vec![]);
    }
    let participated = repository::task::get_participated(uid)
        .await?
        .into_iter()
        .map(|(task, _)| task.id)
        .filter(|x| *x != task_id)
        .collect::<Vec<_>>();
    if participated.is_empty() {
        return Ok(vec![]);
    }
    let sql = format!(
        r#"
        SELECT DISTINCT tb_resource.id as id
        FROM tb_resource
        INNER JOIN tb_resource_tag ON tb_resource.id = tb_resource_tag.rid
        WHERE tb_resource_tag.value IN ({}) AND tb_resource.tid IN ({})
        "#,
        std::iter::repeat("?")
            .take(tags.len())
            .collect::<Vec<_>>()
            .join(","),
        std::iter::repeat("?")
            .take(participated.len())
            .collect::<Vec<_>>()
            .join(",")
    );
    let mut query = sqlx::query(&sql);
    for tag in tags {
        query = query.bind(tag);
    }
    for task in participated {
        query = query.bind(task);
    }
    let res = query
        .fetch_all(db().await)
        .await?
        .into_iter()
        .map(|x| x.get("id"))
        .collect::<Vec<u32>>();
    if res.is_empty() {
        return Ok(vec![]);
    }
    let sql = format!(
        r#"
        SELECT id, type AS typ, content, name, tid
        FROM tb_resource
        WHERE id IN ({})
        "#,
        std::iter::repeat("?")
            .take(res.len())
            .collect::<Vec<_>>()
            .join(",")
    );
    let mut query = sqlx::query_as::<_, Resource>(&sql);
    for id in res {
        query = query.bind(id);
    }
    let res = query.fetch_all(db().await).await?;
    Ok(res)
}

pub async fn generate_ticket(id: u32, file_name: String) -> Result<String> {
    let ticket = compute_str_md5(format!("resource_{}_{}", id, Utc::now().timestamp_millis()));
    CACHE
        .insert(CacheType::ResourceTicket(ticket.clone()), file_name)
        .await;
    Ok(ticket)
}

pub async fn check_ticket(ticket: String) -> Result<Option<String>> {
    if let Some(file_name) = CACHE.get(&CacheType::ResourceTicket(ticket.clone())).await {
        CACHE.remove(&CacheType::ResourceTicket(ticket)).await;
        Ok(Some(file_name))
    } else {
        Ok(None)
    }
}
