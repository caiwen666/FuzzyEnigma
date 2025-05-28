pub mod file;

use std::borrow::Cow;

use md5::{Digest, Md5};

use crate::result::RouterResult;

pub fn compute_str_md5<'a>(s: impl Into<Cow<'a, str>>) -> String {
    let s: Cow<str> = s.into();
    let mut hasher = Md5::new();
    hasher.update(s.as_bytes());
    let result = hasher.finalize();
    format!("{:x}", result)
}

pub async fn async_func<F>(f: F) -> RouterResult
where
    F: Future<Output = RouterResult>,
{
    f.await
}
