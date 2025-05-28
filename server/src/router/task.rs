use std::collections::HashMap;

use anyhow::anyhow;
use salvo::{Depot, Request, handler, macros::Extractible};
use serde::Deserialize;
use serde_json::json;
use validator::Validate;

use crate::{
    context::AppContext,
    entity::task::{TaskInfo, TaskType},
    result::{AppError, RouterResult},
    service::{self, resource::to_resource_dto, task::to_task_dto},
};

#[derive(Deserialize, Validate, Extractible)]
#[salvo(extract(default_source(from = "body")))]
struct CreateForm {
    info: TaskInfo,
    prev: Option<u32>,
    description: String,
}

#[handler]
pub async fn create_task(req: &mut Request, depot: &mut Depot) -> RouterResult {
    let arg: CreateForm = req.extract().await?;
    if arg.validate().is_err() {
        return Err(AppError::ArgumentError.into());
    }
    let context = depot.obtain::<AppContext>().unwrap();
    let publisher = context.user.uid;
    if let Some(prev) = arg.prev {
        let prev_task = service::task::get(prev).await?;
        if let Some(prev_task) = prev_task {
            if publisher != prev_task.publisher {
                // 只能依赖自己的任务
                return Err(AppError::PermissionDenied.into());
            }
        } else {
            return Err(anyhow!("依赖的任务不存在").into());
        }
    }
    let id = service::task::create(arg.info, arg.prev, publisher, arg.description).await?;
    Ok(id.into())
}

#[derive(Deserialize, Validate, Extractible)]
#[salvo(extract(default_source(from = "body")))]
struct UpdateForm {
    #[salvo(extract(source(from = "query")))]
    id: u32,
    info: TaskInfo,
    description: String,
}

#[handler]
pub async fn update_task(req: &mut Request, depot: &mut Depot) -> RouterResult {
    let arg: UpdateForm = req.extract().await?;
    if arg.validate().is_err() {
        return Err(AppError::ArgumentError.into());
    }
    let task = service::task::get(arg.id)
        .await?
        .ok_or(anyhow!("任务不存在"))?;
    if arg.info.typ != task.info.typ {
        return Err(AppError::ArgumentError.into());
    }
    let context = depot.obtain::<AppContext>().unwrap();
    if context.user.uid != task.publisher && !context.permissions.manage_all_task() {
        return Err(AppError::PermissionDenied.into());
    }
    service::task::update(arg.id, arg.info, arg.description).await?;
    Ok(().into())
}

#[handler]
pub async fn delete_task(req: &mut Request, depot: &mut Depot) -> RouterResult {
    let id = req.query::<u32>("id").ok_or(AppError::ArgumentError)?;
    let task = service::task::get(id).await?.ok_or(anyhow!("任务不存在"))?;
    let context = depot.obtain::<AppContext>().unwrap();
    if context.user.uid != task.publisher && !context.permissions.manage_all_task() {
        return Err(AppError::PermissionDenied.into());
    }
    let next_tasks = service::task::get_as_prev(id).await?;
    if next_tasks.len() > 0 {
        let mut res = Vec::new();
        for v in next_tasks {
            res.push(service::task::to_task_dto(v).await?);
        }
        return Ok(res.into());
    }
    service::task::delete(id).await?;
    Ok(().into())
}

#[handler]
pub async fn get_created_tasks(depot: &mut Depot) -> RouterResult {
    let context = depot.obtain::<AppContext>().unwrap();
    let tasks = if context.permissions.manage_all_task() {
        service::task::get_all().await?
    } else {
        service::task::get_created(context.user.uid).await?
    };
    let mut res = Vec::new();
    for v in tasks {
        res.push(to_task_dto(v).await?);
    }
    Ok(res.into())
}

#[handler]
pub async fn get_participated_tasks(depot: &mut Depot) -> RouterResult {
    let context = depot.obtain::<AppContext>().unwrap();
    let tasks = service::task::get_participated(context.user.uid).await?;
    let mut res = Vec::new();
    for (v, finish) in tasks {
        res.push(json!({
            "task": to_task_dto(v).await?,
            "finish": finish,
        }));
    }
    Ok(res.into())
}

#[handler]
pub async fn task_detail(req: &mut Request, depot: &mut Depot) -> RouterResult {
    let id = req.query::<u32>("id").ok_or(AppError::ArgumentError)?;
    let task = service::task::get(id).await?.ok_or(anyhow!("任务不存在"))?;
    let context = depot.obtain::<AppContext>().unwrap();
    let participated = service::task::is_participated(context.user.uid, id)
        .await?
        .is_some();
    if context.user.uid != task.publisher && !context.permissions.manage_all_task() && !participated
    {
        return Err(AppError::PermissionDenied.into());
    }
    let mut res = HashMap::new();
    // task
    res.insert("task", json!(to_task_dto(task.clone()).await?));
    // prev
    let prev_task = if let Some(prev) = task.prev {
        let prev_task = service::task::get(prev).await?;
        if let Some(prev_task) = prev_task {
            Some(to_task_dto(prev_task).await?)
        } else {
            None
        }
    } else {
        None
    };
    res.insert("prevTask", json!(prev_task));
    // description
    let description = service::task::get_description(id).await?;
    res.insert("description", json!(description));
    // resources
    let mut resources = Vec::new();
    for v in service::resource::get_with_task(task.id).await? {
        resources.push(to_resource_dto(v).await?);
    }
    res.insert("resources", json!(resources));
    let group = service::task::get_group(id).await?;
    // myGroup / finished
    if participated {
        let finish = service::task::is_finished(context.user.uid, id).await?;
        res.insert("finished", json!(finish));
        if task.info.typ == TaskType::Group {
            let (my_group_id, my_group) = group
                .iter()
                .find(|(_, v)| v.iter().any(|(uid, _)| *uid == context.user.uid))
                .unwrap();
            let mut my_group_filled = Vec::new();
            for v in my_group {
                let user = service::user::get_basic_info(v.0).await?.unwrap();
                my_group_filled.push(user);
            }
            res.insert(
                "myGroup",
                json!({"id": my_group_id, "members": my_group_filled}),
            );
        } else {
            res.insert("myGroup", json!(null));
        }
    } else {
        res.insert("finished", json!(null));
        res.insert("myGroup", json!(null));
    }
    // allGroup
    if context.user.uid == task.publisher || context.permissions.manage_all_task() {
        let mut all_group = HashMap::new();
        for (gid, v) in &group {
            let mut new_v = Vec::new();
            for (uid, finish) in v {
                let user = service::user::get_basic_info(*uid).await?.unwrap();
                new_v.push(json!({
                    "user": user,
                    "finished": finish,
                }));
            }
            all_group.insert(gid, new_v);
        }
        res.insert("allGroup", json!(all_group));
    } else {
        res.insert("allGroup", json!(null));
    }

    Ok(res.into())
}

#[handler]
pub async fn add_group(req: &mut Request, depot: &mut Depot) -> RouterResult {
    let task_id = req.query::<u32>("task_id").ok_or(AppError::ArgumentError)?;
    let task = service::task::get(task_id)
        .await?
        .ok_or(anyhow!("任务不存在"))?;
    if task.info.typ != TaskType::Group {
        return Err(AppError::ArgumentError.into());
    }
    let context = depot.obtain::<AppContext>().unwrap();
    if context.user.uid != task.publisher && !context.permissions.manage_all_task() {
        return Err(AppError::PermissionDenied.into());
    }
    let group_id = service::task::add_group(task_id).await?;
    Ok(group_id.into())
}

#[handler]
pub async fn delete_group(req: &mut Request, depot: &mut Depot) -> RouterResult {
    let task_id = req.query::<u32>("task_id").ok_or(AppError::ArgumentError)?;
    let group_id = req
        .query::<u32>("group_id")
        .ok_or(AppError::ArgumentError)?;
    let task = service::task::get(task_id)
        .await?
        .ok_or(anyhow!("任务不存在"))?;
    if task.info.typ != TaskType::Group {
        return Err(AppError::ArgumentError.into());
    }
    let context = depot.obtain::<AppContext>().unwrap();
    if context.user.uid != task.publisher && !context.permissions.manage_all_task() {
        return Err(AppError::PermissionDenied.into());
    }
    service::task::delete_group(group_id).await?;
    Ok(().into())
}

#[handler]
pub async fn add_member(req: &mut Request, depot: &mut Depot) -> RouterResult {
    let task_id = req.query::<u32>("task_id").ok_or(AppError::ArgumentError)?;
    let group_id = req
        .query::<u32>("group_id")
        .ok_or(AppError::ArgumentError)?;
    let uid = req.query::<u32>("uid").ok_or(AppError::ArgumentError)?;
    let task = service::task::get(task_id)
        .await?
        .ok_or(anyhow!("任务不存在"))?;
    let context = depot.obtain::<AppContext>().unwrap();
    if context.user.uid != task.publisher && !context.permissions.manage_all_task() {
        return Err(AppError::PermissionDenied.into());
    }
    if uid != context.user.uid && !context.permissions.assign_task() {
        return Err(AppError::PermissionDenied.into());
    }
    if service::task::is_participated(uid, task_id)
        .await?
        .is_some()
    {
        return Err(anyhow!("用户已经添加").into());
    }
    if let Some(prev) = task.prev {
        let prev_task = service::task::get(prev).await?.unwrap();
        if service::task::is_participated(uid, prev_task.id)
            .await?
            .is_none()
        {
            return Err(anyhow!("用户未参与当前任务所依赖的任务").into());
        }
    }
    service::task::add_group_member(group_id, uid).await?;
    Ok(().into())
}

#[handler]
pub async fn delete_member(req: &mut Request, depot: &mut Depot) -> RouterResult {
    let task_id = req.query::<u32>("task_id").ok_or(AppError::ArgumentError)?;
    let group_id = req
        .query::<u32>("group_id")
        .ok_or(AppError::ArgumentError)?;
    let uid = req.query::<u32>("uid").ok_or(AppError::ArgumentError)?;
    let task = service::task::get(task_id)
        .await?
        .ok_or(anyhow!("任务不存在"))?;
    let context = depot.obtain::<AppContext>().unwrap();
    if context.user.uid != task.publisher && !context.permissions.manage_all_task() {
        return Err(AppError::PermissionDenied.into());
    }
    if uid != context.user.uid && !context.permissions.assign_task() {
        return Err(AppError::PermissionDenied.into());
    }
    if service::task::is_participated(uid, task_id)
        .await?
        .is_none()
    {
        return Err(anyhow!("用户未被添加").into());
    }
    if service::task::check_rely(task_id, uid).await? != 0 {
        return Err(anyhow!("用户参与了依赖于当前任务的任务").into());
    }
    service::task::delete_group_member(group_id, uid).await?;
    Ok(().into())
}

#[handler]
pub async fn finish_task(req: &mut Request, depot: &mut Depot) -> RouterResult {
    let id = req.query::<u32>("id").ok_or(AppError::ArgumentError)?;
    let context = depot.obtain::<AppContext>().unwrap();
    let uid = context.user.uid;
    let task = service::task::get(id).await?.ok_or(anyhow!("任务不存在"))?;
    if service::task::is_participated(uid, id).await?.is_none() {
        return Err(anyhow!("未加入该任务").into());
    }
    if service::task::is_finished(uid, id).await? {
        return Err(anyhow!("已经加入该任务").into());
    }
    let now = chrono::Utc::now().timestamp_millis();
    let deadline = task.info.deadline;
    if (now as u64) > deadline {
        return Err(anyhow!("任务已过期").into());
    }
    if let Some(prev) = task.prev {
        let prev_task = service::task::get(prev).await?.unwrap();
        if service::task::is_finished(uid, prev_task.id).await? {
            return Err(anyhow!("前置任务未完成").into());
        }
    }
    service::task::finish(id, uid).await?;
    Ok(().into())
}

#[handler]
pub async fn get_time_arrange(depot: &mut Depot) -> RouterResult {
    let context = depot.obtain::<AppContext>().unwrap();
    if !context.permissions.ai() {
        return Err(AppError::PermissionDenied.into());
    }
    let res = service::ai::get_time_arrange(context.user.uid)
        .await?
        .map(|(content, created)| {
            json!({
                "content": content,
                "created": created,
            })
        });
    Ok(res.into())
}

#[handler]
pub async fn update_time_arrange(depot: &mut Depot) -> RouterResult {
    let context = depot.obtain::<AppContext>().unwrap();
    if !context.permissions.ai() {
        return Err(AppError::PermissionDenied.into());
    }
    service::ai::update_time_arrange(context.user.uid).await?;
    Ok(().into())
}
