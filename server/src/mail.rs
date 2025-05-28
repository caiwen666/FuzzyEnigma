use std::borrow::Cow;

use crate::config::CONFIG;
use anyhow::Result;
use lettre::{
    AsyncSmtpTransport, Message, Tokio1Executor,
    message::{MessageBuilder, header::ContentType},
    transport::smtp::authentication::Credentials,
};
use tokio::sync::OnceCell;

const MAIL_AUTH_TEMPLATE: &str = "config/mail_auth_template.html";

#[inline]
pub async fn mailer() -> &'static AsyncSmtpTransport<Tokio1Executor> {
    pub static MAILER: OnceCell<AsyncSmtpTransport<Tokio1Executor>> = OnceCell::const_new();
    MAILER
        .get_or_init(|| async {
            AsyncSmtpTransport::<Tokio1Executor>::builder_dangerous(CONFIG.mail.host.as_str())
                .port(CONFIG.mail.port)
                .credentials(Credentials::new(
                    CONFIG.mail.username.clone(),
                    CONFIG.mail.password.clone(),
                ))
                .build()
        })
        .await
}

#[inline]
pub async fn build_auth_email_msg<'a>(to: impl Into<Cow<'a, str>>, code: usize) -> Result<Message> {
    let template = tokio::fs::read_to_string(MAIL_AUTH_TEMPLATE).await?;
    let body = template.replace("{{code}}", &code.to_string());
    let msg = get_mail_builder(to, "Fuzzy Enigma 邮件验证")?
        .header(ContentType::TEXT_HTML)
        .body(body)?;
    Ok(msg)
}

#[inline]
fn get_mail_builder<'a>(
    to: impl Into<Cow<'a, str>>,
    title: impl Into<Cow<'a, str>>,
) -> Result<MessageBuilder> {
    let title: Cow<str> = title.into();
    let to: Cow<str> = to.into();
    let res = Message::builder()
        .from(format!("FuzzyEnigma <{}>", CONFIG.mail.username).parse()?)
        .to(format!("User <{}>", to).parse()?)
        .subject(title);
    Ok(res)
}
