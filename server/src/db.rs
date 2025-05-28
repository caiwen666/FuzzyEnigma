use std::time::Duration;

use sqlx::{MySqlPool, mysql::MySqlPoolOptions};
use tokio::sync::OnceCell;

use crate::config::CONFIG;

#[inline]
pub async fn db() -> &'static MySqlPool {
    pub static DB: OnceCell<MySqlPool> = OnceCell::const_new();
    DB.get_or_init(|| async {
        let opt = MySqlPoolOptions::new().acquire_timeout(Duration::from_secs(3));
        opt.connect(&CONFIG.database.url)
            .await
            .expect("Failed to connect to database")
    })
    .await
}
