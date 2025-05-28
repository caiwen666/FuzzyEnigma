use salvo::Router;

use crate::middleware::auth_middleware;

mod resource;
mod task;
mod user;

pub fn get_routers() -> Router {
    let without_auth = Router::new()
        .push(
            Router::with_path("user")
                .push(Router::with_path("login").post(user::login))
                .push(Router::with_path("register").post(user::register))
                .push(
                    Router::with_path("email")
                        .push(Router::with_path("send").get(user::email_send))
                        .push(Router::with_path("verify").post(user::email_verify)),
                ),
        )
        .push(
            Router::with_path("resource")
                .push(Router::with_path("download").get(resource::download)),
        );
    let with_auth = Router::new()
        .push(
            Router::with_path("user")
                .push(Router::with_path("logout").get(user::logout))
                .push(Router::with_path("basic_info").get(user::info))
                .push(Router::with_path("search").get(user::search))
                .push(Router::with_path("delete").get(user::delete))
                .push(Router::with_path("list").get(user::list))
                .push(Router::with_path("update_permission").post(user::update_permission)),
        )
        .push(
            Router::with_path("task")
                .push(Router::with_path("create").post(task::create_task))
                .push(Router::with_path("update").post(task::update_task))
                .push(Router::with_path("delete").get(task::delete_task))
                .push(Router::with_path("created_list").get(task::get_created_tasks))
                .push(Router::with_path("participated_list").get(task::get_participated_tasks))
                .push(Router::with_path("detail").get(task::task_detail))
                .push(Router::with_path("finish").get(task::finish_task))
                .push(
                    Router::with_path("group")
                        .push(Router::with_path("create").get(task::add_group))
                        .push(Router::with_path("delete").get(task::delete_group))
                        .push(Router::with_path("add_user").get(task::add_member))
                        .push(Router::with_path("delete_user").get(task::delete_member)),
                )
                .push(Router::with_path("time_arrange").get(task::get_time_arrange))
                .push(Router::with_path("update_time_arrange").get(task::update_time_arrange)),
        )
        .push(
            Router::with_path("resource")
                .push(Router::with_path("create").post(resource::create_resource))
                .push(Router::with_path("delete").get(resource::delete_resource))
                .push(Router::with_path("update").post(resource::update_resource))
                .push(Router::with_path("detail").get(resource::resource_detail))
                .push(
                    Router::with_path("tag")
                        .push(Router::with_path("add").get(resource::add_tag))
                        .push(Router::with_path("delete").get(resource::delete_tag)),
                )
                .push(Router::with_path("attitude").get(resource::attitude_resource))
                .push(
                    Router::with_path("comment")
                        .push(Router::with_path("add").post(resource::add_comment))
                        .push(Router::with_path("delete").get(resource::delete_comment)),
                )
                .push(Router::with_path("recommend").get(resource::recommend_resource))
                .push(Router::with_path("fetch").get(resource::fetch)),
        );
    let router = Router::new()
        .push(without_auth)
        .push(Router::with_hoop(auth_middleware).push(with_auth));
    router
}
