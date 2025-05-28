use std::collections::HashMap;

use anyhow::{Ok, Result};

use crate::{
    db::db,
    entity::task::{Task, TaskInfo},
};

pub async fn get_all() -> Result<Vec<Task>> {
    let res = sqlx::query!(
        r#"
        SELECT id, title, type AS "typ!", priority, cost, deadline, publisher, prev
        FROM tb_task
        "#,
    )
    .fetch_all(db().await)
    .await?
    .into_iter()
    .map(|r| Task {
        id: r.id,
        info: TaskInfo {
            title: r.title,
            typ: r.typ.into(),
            priority: r.priority.into(),
            cost: r.cost,
            deadline: r.deadline,
        },
        publisher: r.publisher,
        prev: r.prev,
    })
    .collect::<Vec<_>>();
    Ok(res)
}

pub async fn get_participated(uid: u32) -> Result<Vec<(Task, bool)>> {
    let res = sqlx::query!(
        r#"
        SELECT task.id, task.title, task.type AS "typ!", task.priority, task.cost, task.deadline, task.publisher, task.prev, link_group_user.finish
        FROM tb_task task
        INNER JOIN tb_group ON task.id = tb_group.tid
        INNER JOIN link_group_user ON tb_group.id = link_group_user.gid
        WHERE link_group_user.uid = ?
        "#,
        uid
    ).fetch_all(db().await).await?.into_iter().map(|r| (
        Task {
            id: r.id,
            info: TaskInfo {
                title: r.title,
                typ: r.typ.into(),
                priority: r.priority.into(),
                cost: r.cost,
                deadline: r.deadline,
            },
            publisher: r.publisher,
            prev: r.prev,
        },
        if r.finish == 0 {
            false
        } else {
            true
        }
    )).collect::<Vec<_>>();
    Ok(res)
}

pub async fn get_created(uid: u32) -> Result<Vec<Task>> {
    let res = sqlx::query!(
        r#"
        SELECT id, title, type AS "typ!", priority, cost, deadline, publisher, prev
        FROM tb_task
        WHERE publisher = ?
        "#,
        uid
    )
    .fetch_all(db().await)
    .await?
    .into_iter()
    .map(|r| Task {
        id: r.id,
        info: TaskInfo {
            title: r.title,
            typ: r.typ.into(),
            priority: r.priority.into(),
            cost: r.cost,
            deadline: r.deadline,
        },
        publisher: r.publisher,
        prev: r.prev,
    })
    .collect::<Vec<_>>();
    Ok(res)
}

pub async fn create(
    info: TaskInfo,
    prev: Option<u32>,
    description: String,
    publisher: u32,
) -> Result<u32> {
    let res = sqlx::query!(
        r#"
        INSERT INTO tb_task (title, type, priority, cost, deadline, publisher, description, prev)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        "#,
        info.title,
        info.typ,
        u32::from(info.priority),
        info.cost,
        info.deadline,
        publisher,
        description,
        prev
    )
    .execute(db().await)
    .await?;
    Ok(res.last_insert_id() as u32)
}

pub async fn delete(id: u32) -> Result<()> {
    sqlx::query!(
        r#"
        DELETE FROM tb_task
        WHERE id = ?
        "#,
        id
    )
    .execute(db().await)
    .await?;
    Ok(())
}

pub async fn update(id: u32, info: TaskInfo, description: String) -> Result<()> {
    sqlx::query!(
        r#"
        UPDATE tb_task
        SET title = ?, type = ?, priority = ?, cost = ?, deadline = ?, description = ?
        WHERE id = ?
        "#,
        info.title,
        info.typ,
        u32::from(info.priority),
        info.cost,
        info.deadline,
        description,
        id
    )
    .execute(db().await)
    .await?;
    Ok(())
}

pub async fn get(id: u32) -> Result<Option<Task>> {
    let res = sqlx::query!(
        r#"
        SELECT id, title, type AS "typ!", priority, cost, deadline, publisher, prev
        FROM tb_task
        WHERE id = ?
        "#,
        id
    )
    .fetch_optional(db().await)
    .await?
    .map(|r| Task {
        id: r.id,
        info: TaskInfo {
            title: r.title,
            typ: r.typ.into(),
            priority: r.priority.into(),
            cost: r.cost,
            deadline: r.deadline,
        },
        publisher: r.publisher,
        prev: r.prev,
    });
    Ok(res)
}

/// 被哪些任务作为依赖
pub async fn get_as_prev(id: u32) -> Result<Vec<Task>> {
    let res = sqlx::query!(
        r#"
        SELECT id, title, type AS "typ!", priority, cost, deadline, publisher, prev
        FROM tb_task
        WHERE prev = ?
        "#,
        id
    )
    .fetch_all(db().await)
    .await?
    .into_iter()
    .map(|r| Task {
        id: r.id,
        info: TaskInfo {
            title: r.title,
            typ: r.typ.into(),
            priority: r.priority.into(),
            cost: r.cost,
            deadline: r.deadline,
        },
        publisher: r.publisher,
        prev: r.prev,
    })
    .collect::<Vec<_>>();
    Ok(res)
}

pub async fn get_with_resource(resource_id: u32) -> Result<Option<Task>> {
    let res = sqlx::query!(
        r#"
        SELECT id, title, type AS "typ!", priority, cost, deadline, publisher, prev
        FROM tb_task
        WHERE id = (
            SELECT tid
            FROM tb_resource
            WHERE id = ?
        )
        "#,
        resource_id
    )
    .fetch_optional(db().await)
    .await?
    .map(|r| Task {
        id: r.id,
        info: TaskInfo {
            title: r.title,
            typ: r.typ.into(),
            priority: r.priority.into(),
            cost: r.cost,
            deadline: r.deadline,
        },
        publisher: r.publisher,
        prev: r.prev,
    });
    Ok(res)
}

pub async fn get_description(id: u32) -> Result<String> {
    let res = sqlx::query!(
        r#"
        SELECT description
        FROM tb_task
        WHERE id = ?
        "#,
        id
    )
    .fetch_one(db().await)
    .await?
    .description;
    Ok(res)
}

pub async fn get_group(id: u32) -> Result<HashMap<u32, Vec<(u32, bool)>>> {
    let res = sqlx::query!(
        r#"
        SELECT link_group_user.uid, tb_group.id AS gid, link_group_user.finish
        FROM tb_task
        INNER JOIN tb_group ON tb_task.id = tb_group.tid
        LEFT JOIN link_group_user ON tb_group.id = link_group_user.gid
        WHERE tb_task.id = ?
        "#,
        id
    )
    .fetch_all(db().await)
    .await?;
    let mut map = HashMap::new();
    for r in res {
        let target = map.entry(r.gid).or_insert_with(Vec::new);
        if r.uid.is_some() {
            target.push((r.uid.unwrap(), r.finish.unwrap() != 0));
        }
    }
    Ok(map)
}

// (所属群组的id,是否完成)
pub async fn get_user_state(task_id: u32, uid: u32) -> Result<Option<(u32, bool)>> {
    let res = sqlx::query!(
        r#"
        SELECT tb_group.id, link_group_user.finish
        FROM tb_task
        INNER JOIN tb_group ON tb_group.tid = tb_task.id
        INNER JOIN link_group_user ON link_group_user.gid = tb_group.id
        WHERE link_group_user.uid = ? AND tb_task.id = ?
        "#,
        uid,
        task_id
    )
    .fetch_optional(db().await)
    .await?
    .map(|r| (r.id, r.finish != 0));
    Ok(res)
}

pub async fn add_group(id: u32) -> Result<u32> {
    let res = sqlx::query!(
        r#"
        INSERT INTO tb_group (tid)
        VALUES (?)
        "#,
        id
    )
    .execute(db().await)
    .await?;
    Ok(res.last_insert_id() as u32)
}

pub async fn delete_group(group_id: u32) -> Result<()> {
    sqlx::query!(
        r#"
        DELETE FROM tb_group
        WHERE id = ?
        "#,
        group_id
    )
    .execute(db().await)
    .await?;
    Ok(())
}

pub async fn add_group_member(group_id: u32, uid: u32) -> Result<()> {
    sqlx::query!(
        r#"
        INSERT INTO link_group_user (gid, uid)
        VALUES (?, ?)
        "#,
        group_id,
        uid
    )
    .execute(db().await)
    .await?;
    Ok(())
}

pub async fn delete_group_member(group_id: u32, uid: u32) -> Result<()> {
    sqlx::query!(
        r#"
        DELETE FROM link_group_user
        WHERE gid = ? AND uid = ?
        "#,
        group_id,
        uid
    )
    .execute(db().await)
    .await?;
    Ok(())
}

pub async fn finish(group_id: u32, uid: u32) -> Result<()> {
    sqlx::query!(
        r#"
        UPDATE link_group_user
        SET finish = 1
        WHERE gid = ? AND uid = ?
        "#,
        group_id,
        uid
    )
    .execute(db().await)
    .await?;
    Ok(())
}

/// 检查某个用户是否也加入了依赖于某个任务的任务
pub async fn check_rely(uid: u32, task_id: u32) -> Result<u32> {
    let res = sqlx::query!(
        r#"
        SELECT COUNT(DISTINCT tb_task.id) AS count
        FROM tb_task
        INNER JOIN tb_group ON tb_task.id = tb_group.tid
        INNER JOIN link_group_user ON tb_group.id = link_group_user.gid
        WHERE link_group_user.uid = ? AND tb_task.prev = ?
        "#,
        uid,
        task_id
    )
    .fetch_one(db().await)
    .await?;
    Ok(res.count as u32)
}
