use std::collections::HashMap;

use anyhow::Result;

use crate::{
    algorithm::arrange::arrange_task,
    entity::task::{Task, TaskDTO, TaskInfo},
    repository, service,
};

pub async fn get(id: u32) -> Result<Option<Task>> {
    repository::task::get(id).await
}

pub async fn create(
    info: TaskInfo,
    prev: Option<u32>,
    publisher: u32,
    description: String,
) -> Result<u32> {
    let id = repository::task::create(info, prev, description, publisher).await?;
    repository::task::add_group(id).await?;
    Ok(id)
}

pub async fn get_as_prev(id: u32) -> Result<Vec<Task>> {
    repository::task::get_as_prev(id).await
}

pub async fn delete(id: u32) -> Result<()> {
    repository::task::delete(id).await
}

pub async fn update(id: u32, info: TaskInfo, description: String) -> Result<()> {
    repository::task::update(id, info, description).await
}

pub async fn get_all() -> Result<Vec<Task>> {
    repository::task::get_all().await
}

pub async fn get_created(uid: u32) -> Result<Vec<Task>> {
    repository::task::get_created(uid).await
}

pub async fn get_participated(uid: u32) -> Result<Vec<(Task, bool)>> {
    let list = repository::task::get_participated(uid).await?;
    Ok(arrange_task(list).await)
}

pub async fn is_participated(uid: u32, task_id: u32) -> Result<Option<u32>> {
    Ok(repository::task::get_user_state(task_id, uid)
        .await?
        .map(|(group_id, _)| group_id))
}

pub async fn is_finished(uid: u32, task_id: u32) -> Result<bool> {
    Ok(repository::task::get_user_state(task_id, uid)
        .await?
        .unwrap()
        .1)
}

pub async fn get_description(id: u32) -> Result<String> {
    repository::task::get_description(id).await
}

pub async fn get_group(id: u32) -> Result<HashMap<u32, Vec<(u32, bool)>>> {
    repository::task::get_group(id).await
}

pub async fn add_group(id: u32) -> Result<u32> {
    repository::task::add_group(id).await
}

pub async fn delete_group(group_id: u32) -> Result<()> {
    repository::task::delete_group(group_id).await
}

pub async fn add_group_member(group_id: u32, uid: u32) -> Result<()> {
    repository::task::add_group_member(group_id, uid).await
}

pub async fn delete_group_member(group_id: u32, uid: u32) -> Result<()> {
    repository::task::delete_group_member(group_id, uid).await
}

pub async fn finish(task_id: u32, uid: u32) -> Result<()> {
    let group_id = is_participated(uid, task_id).await?.unwrap();
    repository::task::finish(group_id, uid).await
}

pub async fn get_with_resource(id: u32) -> Result<Option<Task>> {
    repository::task::get_with_resource(id).await
}

pub async fn to_task_dto(v: Task) -> Result<TaskDTO> {
    let user = service::user::get_basic_info(v.publisher).await?.unwrap();
    let res = TaskDTO {
        id: v.id,
        publisher: user,
        info: v.info,
    };
    Ok(res)
}

pub async fn check_rely(task_id: u32, uid: u32) -> Result<u32> {
    repository::task::check_rely(uid, task_id).await
}
