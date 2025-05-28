#[cfg(test)]
mod test {
    use lettre::AsyncTransport;

    use crate::mail::{build_auth_email_msg, mailer};

    #[tokio::test]
    async fn test_mail() {
        let mail = build_auth_email_msg("3102733279@qq.com", 114514)
            .await
            .unwrap();
        let mailer = mailer().await;
        mailer.send(mail).await.unwrap();
    }
}
