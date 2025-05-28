mod algorithm;
mod cache;
mod config;
mod context;
mod db;
mod entity;
mod mail;
mod middleware;
mod repository;
mod result;
mod router;
mod service;
mod test;
mod utils;

use config::CONFIG;
use router::get_routers;
use salvo::cors::Cors;
use salvo::http::Method;
use salvo::prelude::*;
use salvo::{Listener, Server};
use tracing::info;

#[tokio::main]
async fn main() {
    let _guard = clia_tracing_config::build()
        .filter_level(&CONFIG.log.filter_level)
        .with_ansi(CONFIG.log.with_ansi)
        .to_stdout(CONFIG.log.to_stdout)
        .with_source_location(false)
        .with_target(false)
        .with_thread_names(false)
        .with_thread_ids(false)
        .directory(&CONFIG.log.directory)
        .file_name(&CONFIG.log.file_prefix)
        .rolling(&CONFIG.log.rolling)
        .init();
    let acceptor = TcpListener::new(format!("{}:{}", CONFIG.server.host, CONFIG.server.port))
        .bind()
        .await;
    info!(
        "Started server on {}:{}",
        CONFIG.server.host, CONFIG.server.port
    );
    let cors = Cors::new()
        .allow_origin(&CONFIG.app.allow_domain)
        .allow_methods(vec![Method::GET, Method::POST])
        .allow_headers(vec!["Authorization", "Content-Type"])
        .into_handler();
    let router = get_routers();
    // 跨域设置
    let service = Service::new(router).hoop(cors);
    Server::new(acceptor).serve(service).await;
}
