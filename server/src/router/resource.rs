use ::serde::Deserialize;
use anyhow::anyhow;
use salvo::{Depot, Request, Response, handler, macros::Extractible};
use serde_json::json;

use crate::{
    context::AppContext,
    entity::resource::{ResourceAttitude, ResourceType},
    result::{AppError, RouterResult},
    service::{
        self,
        resource::{to_comment_dto, to_resource_dto},
        task::to_task_dto,
    },
    utils::async_func,
};

#[derive(Deserialize, Extractible)]
#[salvo(extract(default_source(from = "body")))]
struct CreateForm {
    #[salvo(extract(rename = "type"))]
    typ: ResourceType,
    name: String,
    task_id: u32,
    tags: Option<Vec<String>>,
}

#[handler]
pub async fn create_resource(req: &mut Request, depot: &mut Depot) -> RouterResult {
    let arg = req.extract::<CreateForm>().await?;
    let task = service::task::get(arg.task_id)
        .await?
        .ok_or(anyhow!("任务不存在"))?;
    let context = depot.obtain::<AppContext>().unwrap();
    if task.publisher != context.user.uid && !context.permissions.manage_all_task() {
        return Err(AppError::PermissionDenied);
    }
    let tags = arg.tags.unwrap_or_default();
    let id = match arg.typ {
        ResourceType::LINK => {
            let content: String = req.form("content").await.ok_or(AppError::ArgumentError)?;
            let id = service::resource::add(arg.task_id, arg.name, arg.typ, tags).await?;
            service::resource::set_content(id, content.clone()).await?;
            id
        }
        ResourceType::FILE => {
            let file = req.file("content").await.ok_or(AppError::ArgumentError)?;
            let name = file
                .path()
                .file_name()
                .and_then(|s| s.to_str())
                .ok_or(AppError::ArgumentError)?;
            let id = service::resource::add(arg.task_id, arg.name, arg.typ, tags).await?;
            let key = format!("{}_{}", id, name);
            tokio::fs::copy(file.path(), format!("data/files/{}", key))
                .await
                .map_err(|e| anyhow!("存储文件失败: {}", e))?;
            service::resource::set_content(id, key).await?;
            id
        }
    };
    Ok(id.into())
}

#[handler]
pub async fn update_resource(req: &mut Request, depot: &mut Depot) -> RouterResult {
    let id = req
        .query::<u32>("resource_id")
        .ok_or(AppError::ArgumentError)?;
    let name = req
        .form::<String>("name")
        .await
        .ok_or(AppError::ArgumentError)?;
    let task = service::task::get_with_resource(id)
        .await?
        .ok_or(anyhow!("资源不存在"))?;
    let context = depot.obtain::<AppContext>().unwrap();
    if task.publisher != context.user.uid && !context.permissions.manage_all_task() {
        return Err(AppError::PermissionDenied);
    }
    service::resource::update(id, name).await?;
    Ok(().into())
}

#[handler]
pub async fn delete_resource(req: &mut Request, depot: &mut Depot) -> RouterResult {
    let id = req
        .query::<u32>("resource_id")
        .ok_or(AppError::ArgumentError)?;
    let task = service::task::get_with_resource(id)
        .await?
        .ok_or(anyhow!("资源不存在"))?;
    let context = depot.obtain::<AppContext>().unwrap();
    if task.publisher != context.user.uid && !context.permissions.manage_all_task() {
        return Err(AppError::PermissionDenied);
    }
    service::resource::delete(id).await?;
    Ok(().into())
}

#[derive(Deserialize, Extractible)]
#[salvo(extract(default_source(from = "query")))]
struct TagForm {
    resource_id: u32,
    value: String,
}

#[handler]
pub async fn add_tag(req: &mut Request, depot: &mut Depot) -> RouterResult {
    let arg = req.extract::<TagForm>().await?;
    let task = service::task::get_with_resource(arg.resource_id)
        .await?
        .ok_or(anyhow!("资源不存在"))?;
    let tags = service::resource::get_tags(arg.resource_id).await?;
    if tags.contains(&arg.value) {
        return Err(anyhow!("标签已存在").into());
    }
    let context = depot.obtain::<AppContext>().unwrap();
    if task.publisher != context.user.uid && !context.permissions.manage_all_task() {
        return Err(AppError::PermissionDenied);
    }
    service::resource::add_tag(arg.resource_id, arg.value).await?;
    Ok(().into())
}

#[handler]
pub async fn delete_tag(req: &mut Request, depot: &mut Depot) -> RouterResult {
    let arg = req.extract::<TagForm>().await?;
    let task = service::task::get_with_resource(arg.resource_id)
        .await?
        .ok_or(anyhow!("资源不存在"))?;
    let tags = service::resource::get_tags(arg.resource_id).await?;
    if !tags.contains(&arg.value) {
        return Err(anyhow!("标签不存在").into());
    }
    let context = depot.obtain::<AppContext>().unwrap();
    if task.publisher != context.user.uid && !context.permissions.manage_all_task() {
        return Err(AppError::PermissionDenied);
    }
    service::resource::delete_tag(arg.resource_id, arg.value).await?;
    Ok(().into())
}

#[handler]
pub async fn attitude_resource(req: &mut Request, depot: &mut Depot) -> RouterResult {
    let id = req
        .query::<u32>("resource_id")
        .ok_or(AppError::ArgumentError)?;
    let attitude = req
        .query::<ResourceAttitude>("attitude")
        .ok_or(AppError::ArgumentError)?;
    let task = service::task::get_with_resource(id)
        .await?
        .ok_or(anyhow!("资源不存在"))?;
    let context = depot.obtain::<AppContext>().unwrap();
    if service::task::is_participated(context.user.uid, task.id)
        .await?
        .is_none()
    {
        return Err(AppError::PermissionDenied);
    }
    service::resource::update_attitude(id, context.user.uid, attitude).await?;
    Ok(().into())
}

#[handler]
pub async fn resource_detail(req: &mut Request, depot: &mut Depot) -> RouterResult {
    let id = req
        .query::<u32>("resource_id")
        .ok_or(AppError::ArgumentError)?;
    let task = service::task::get_with_resource(id)
        .await?
        .ok_or(anyhow!("资源不存在"))?;
    let context = depot.obtain::<AppContext>().unwrap();
    let participate = service::task::is_participated(context.user.uid, task.id)
        .await?
        .is_some();
    if !participate && task.publisher != context.user.uid && !context.permissions.manage_all_task()
    {
        return Err(AppError::PermissionDenied);
    }
    let resource = service::resource::get(id).await?;
    let attitude = service::resource::get_attitude(id, context.user.uid).await?;
    let mut comments = Vec::new();
    for comment in service::resource::get_comments(id).await? {
        comments.push(to_comment_dto(comment).await?);
    }
    let res = json!({
        "info": to_resource_dto(resource).await?,
        "comments": comments,
        "attitude": attitude,
        "task": to_task_dto(task).await?
    });
    Ok(res.into())
}

#[handler]
pub async fn add_comment(req: &mut Request, depot: &mut Depot) -> RouterResult {
    let id = req
        .query::<u32>("resource_id")
        .ok_or(AppError::ArgumentError)?;
    let comment = req
        .form::<String>("content")
        .await
        .ok_or(AppError::ArgumentError)?;
    let task = service::task::get_with_resource(id)
        .await?
        .ok_or(anyhow!("资源不存在"))?;
    let context = depot.obtain::<AppContext>().unwrap();
    let participate = service::task::is_participated(context.user.uid, task.id)
        .await?
        .is_some();
    if !participate && task.publisher != context.user.uid && !context.permissions.manage_all_task()
    {
        return Err(AppError::PermissionDenied);
    }
    let comment_id = service::resource::add_comment(context.user.uid, id, comment).await?;
    Ok(comment_id.into())
}

#[handler]
pub async fn delete_comment(req: &mut Request, depot: &mut Depot) -> RouterResult {
    let comment_id = req
        .query::<u32>("comment_id")
        .ok_or(AppError::ArgumentError)?;
    let comment = service::resource::get_comment(comment_id)
        .await?
        .ok_or(anyhow!("评论不存在"))?;
    let task = service::task::get_with_resource(comment.rid)
        .await?
        .unwrap();
    let context = depot.obtain::<AppContext>().unwrap();
    if comment.uid != context.user.uid
        && task.publisher != context.user.uid
        && !context.permissions.manage_all_task()
    {
        return Err(AppError::PermissionDenied);
    }
    service::resource::delete_comment(comment_id).await?;
    Ok(().into())
}

#[handler]
pub async fn recommend_resource(req: &mut Request, depot: &mut Depot) -> RouterResult {
    let task_id = req.query::<u32>("task_id").ok_or(AppError::ArgumentError)?;
    let context = depot.obtain::<AppContext>().unwrap();
    let list = service::resource::get_recommend(context.user.uid, task_id).await?;
    let mut res = Vec::new();
    for resource in list {
        res.push(to_resource_dto(resource).await?);
    }
    Ok(res.into())
}

#[handler]
pub async fn fetch(req: &mut Request, depot: &mut Depot) -> RouterResult {
    let id = req
        .query::<u32>("resource_id")
        .ok_or(AppError::ArgumentError)?;
    let context = depot.obtain::<AppContext>().unwrap();
    let resource = service::resource::get(id).await?;
    let task = service::task::get_with_resource(id)
        .await?
        .ok_or(anyhow!("资源不存在"))?;
    if !service::task::is_participated(context.user.uid, task.id)
        .await?
        .is_some()
        && task.publisher != context.user.uid
        && !context.permissions.manage_all_task()
    {
        return Err(AppError::PermissionDenied);
    }
    // TODO 写到这里突然发现 Resource 结构体里的 typ 应为 ResourceType，但是已经懒得改了
    let typ = resource.typ.as_str();
    match typ {
        "link" => {
            return Ok(resource.content.into());
        }
        "file" => {
            let ticket = service::resource::generate_ticket(id, resource.content).await?;
            return Ok(ticket.into());
        }
        _ => {
            return Err(anyhow!("未知资源类型").into());
        }
    };
}

#[handler]
pub async fn download(req: &mut Request, res: &mut Response) {
    let app_result = async_func(async {
        let ticket = req
            .query::<String>("ticket")
            .ok_or(AppError::ArgumentError)?;
        let file_name = service::resource::check_ticket(ticket)
            .await?
            .ok_or(anyhow!("ticket 无效或已过期，请重试"))?;
        let file_path = format!("data/files/{}", file_name);
        res.send_file(&file_path, req.headers()).await;
        Ok(().into())
    })
    .await;
    match app_result {
        Ok(_) => (),
        Err(e) => {
            res.render(e);
        }
    };
}
