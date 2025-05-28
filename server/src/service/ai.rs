use crate::config::CONFIG;
use crate::repository;
use anyhow::Result;
use anyhow::anyhow;
use chrono::{DateTime, FixedOffset, NaiveDateTime, Utc};
use reqwest::header::{AUTHORIZATION, HeaderMap, HeaderValue};
use serde::Deserialize;
use serde_json::json;
use tokio::sync::OnceCell;

async fn get_client() -> &'static reqwest::Client {
    static INSTANCE: OnceCell<reqwest::Client> = OnceCell::const_new();
    INSTANCE
        .get_or_init(|| async {
            let token = CONFIG.app.deepseek_token.clone();
            let mut headers = HeaderMap::new();
            headers.insert(
                AUTHORIZATION,
                HeaderValue::from_str(format!("Bearer {}", token.as_str()).as_str()).unwrap(),
            );
            reqwest::Client::builder()
                .no_proxy()
                .pool_max_idle_per_host(1)
                .default_headers(headers)
                .build()
                .unwrap()
        })
        .await
}

#[derive(Deserialize)]
struct DeepSeekResponse {
    pub id: String,
    pub object: String,
    pub created: u64,
    pub model: String,
    pub choices: Vec<DeepSeekChoice>,
}
#[derive(Deserialize)]
struct DeepSeekChoice {
    pub index: u32,
    pub message: DeepSeekMessage,
    pub finish_reason: String,
}
#[derive(Deserialize)]
struct DeepSeekMessage {
    pub role: String,
    pub content: String,
}

async fn fetch(uid: u32) -> Result<String> {
    let now = chrono::Utc::now().timestamp_millis() as u64;
    let task = super::task::get_participated(uid)
        .await?
        .into_iter()
        .filter(|(task, finish)| {
            if *finish {
                // 已完成的任务不考虑
                return false;
            }
            if now > task.info.deadline {
                // 过期的任务不考虑
                return false;
            }
            return true;
        })
        .collect::<Vec<_>>();
    if task.is_empty() {
        return Ok("当前没有尚未完成的任务".to_string());
    }
    let prompt = task
        .into_iter()
        .map(|(task, _)| {
            let seconds = task.info.deadline / 1000;
            let nanos = (task.info.deadline % 1000) * 1_000_000; // 转换为纳秒
            let utc_time = DateTime::<Utc>::from_utc(
                NaiveDateTime::from_timestamp_opt(seconds as i64, nanos as u32).unwrap(),
                Utc,
            );
            // 转换为 UTC+8
            let utc_plus_8 = FixedOffset::east_opt(8 * 3600).unwrap();
            let beijing_time = utc_time.with_timezone(&utc_plus_8);

            format!(
                "<begin>{}\n{}\n{}\n{}<end>",
                task.info.title,
                beijing_time.format("%Y-%m-%d %H:%M"),
                match task.info.priority {
                    crate::entity::task::TaskPriority::High => "高优先级",
                    crate::entity::task::TaskPriority::Medium => "中优先级",
                    crate::entity::task::TaskPriority::Low => "低优先级",
                },
                task.info.cost
            )
        })
        .collect::<Vec<_>>()
        .join("\n");
    let data = json!({
        "model": "deepseek-chat",
        "messages": [
            {
                "role": "system",
                "content": r#"你现在是一个时间规划大师，我将给你若干个任务，每个任务以<begin>开始<end>结束，每个任务包含多行信息，具体地，第一行为任务的名称，第二行为任务的截止时间，第三行为任务的优先级，第四行为任务的预计耗时。你需要为我安排一个时间规划方案。规划方案可以根据当前日期考虑其他外界因素。规划方案可以添加休息建议，注意劳逸结合。注意，你只需要给出规划方案和规划理由，其他的任何内容都不要回答。你的回答应简短"#
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
    });
    let client = get_client().await;
    let response = client
        .post("https://api.deepseek.com/chat/completions")
        .json(&data)
        .send()
        .await?;
    if response.status() != 200 {
        match response.status().as_u16() {
            401 => return Ok("DeepSeek 密钥错误，请联系管理员解决".to_string()),
            402 => return Ok("DeepSeek 额度不足，请联系管理员解决".to_string()),
            429 => return Ok("DeepSeek 请求过于频繁，请稍后再试".to_string()),
            500 => return Ok("DeepSeek 服务器错误，请稍后再试".to_string()),
            503 => return Ok("DeepSeek 服务器繁忙，请稍后再试".to_string()),
            _ => return Ok(format!("请求 DeepSeek 失败，错误码：{}", response.status())),
        }
    }
    let response = response.json::<DeepSeekResponse>().await?;
    Ok(response
        .choices
        .get(0)
        .ok_or(anyhow!("DeepSeek 返回空响应！"))?
        .message
        .content
        .clone())
}

pub async fn get_time_arrange(uid: u32) -> Result<Option<(String, u64)>> {
    repository::ai::get(uid).await
}

pub async fn update_time_arrange(uid: u32) -> Result<()> {
    let content = fetch(uid).await?;
    repository::ai::update(uid, content).await?;
    Ok(())
}
