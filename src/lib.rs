#![allow(clippy::multiple_crate_versions)]
use souls::http::{Config, create_router};
use tower_service::Service;
use worker::{Context, Env, HttpRequest, Result, event};

#[event(fetch)]
async fn fetch(
    req: HttpRequest,
    _env: Env,
    _ctx: Context,
) -> Result<axum::http::Response<axum::body::Body>> {
    let config = Config::default();
    Ok(create_router(config).call(req).await?)
}
