use salvo::{Depot, FlowCtrl, Request, Response, handler};

use crate::{
    context::AppContext,
    result::{AppError, Success},
    service,
    utils::async_func,
};

#[handler]
pub async fn auth_middleware(
    req: &mut Request,
    resp: &mut Response,
    ctrl: &mut FlowCtrl,
    depot: &mut Depot,
) {
    let res = async_func(async {
        let token = req
            .headers()
            .get("Authorization")
            .ok_or(AppError::Unauthorized)?
            .to_str()
            .map_err(|_| AppError::Unauthorized)?;
        let uid = service::user::verify_user_session(token)
            .await?
            .ok_or(AppError::Unauthorized)?;
        let user = service::user::get_basic_info(uid)
            .await?
            .ok_or(AppError::Unauthorized)?;
        let permissions = service::user::get_permissions(uid).await?;
        depot.inject(AppContext::new(user, permissions, String::from(token)));
        Ok(Success::from(()))
    })
    .await;
    match res {
        Ok(_) => {
            ctrl.call_next(req, depot, resp).await;
        }
        Err(e) => {
            resp.render(e);
            ctrl.skip_rest();
        }
    }
}
