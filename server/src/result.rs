use salvo::http::{ParseError, StatusCode};
use salvo::prelude::Json;
use salvo::{Response, Scribe};
use serde::Serialize;
use serde_json::Value;
use thiserror::Error;

pub struct Success(Value);

impl<T: Serialize> From<T> for Success {
    fn from(value: T) -> Self {
        Success(serde_json::json!({
            "code": 200,
            "data": value,
            "msg": "ok"
        }))
    }
}

impl Scribe for Success {
    fn render(self, res: &mut Response) {
        res.stuff(StatusCode::OK, Json(self.0));
    }
}

#[derive(Error, Debug)]
pub enum AppError {
    #[error("`{0}`")]
    AnyHow(#[from] anyhow::Error),
    #[error("Limit Error")]
    LimitError,
    #[error("ParseError: `{0}`")]
    ParseError(#[from] ParseError),
    #[error("Argument Error")]
    ArgumentError,
    #[error("Unauthorized")]
    Unauthorized,
    #[error("Permission Denied")]
    PermissionDenied,
}

impl Scribe for AppError {
    fn render(self, res: &mut Response) {
        match self {
            AppError::AnyHow(e) => res.stuff(
                StatusCode::OK,
                Json(serde_json::json!({
                    "code": 500,
                    "data": Value::Null,
                    "msg": format!("{}", e)
                })),
            ),
            AppError::LimitError => res.stuff(
                StatusCode::OK,
                Json(serde_json::json!({
                    "code": 503,
                    "data": Value::Null,
                    "msg": "请求过于频繁"
                })),
            ),
            AppError::ParseError(_) => res.stuff(
                StatusCode::OK,
                Json(serde_json::json!({
                    "code": 400,
                    "data": Value::Null,
                    "msg": format!("参数错误")
                })),
            ),
            AppError::ArgumentError => res.stuff(
                StatusCode::OK,
                Json(serde_json::json!({
                    "code": 400,
                    "data": Value::Null,
                    "msg": format!("参数错误")
                })),
            ),
            AppError::Unauthorized => res.stuff(
                StatusCode::OK,
                Json(serde_json::json!({
                    "code": 401,
                    "data": Value::Null,
                    "msg": format!("需要登录")
                })),
            ),
            AppError::PermissionDenied => res.stuff(
                StatusCode::OK,
                Json(serde_json::json!({
                    "code": 403,
                    "data": Value::Null,
                    "msg": format!("权限不足")
                })),
            ),
        }
    }
}

pub type RouterResult = Result<Success, AppError>;
