![](http://pic.caiwen.work/i/2025/05/28/683702b0de8b3.jpg)

# 这是什么？

这是湖南大学 2025 年春季程序设计的大作业源代码仓库。这门课程是专门开给计算机科学与技术拔尖班中来自非信科院的学生的。

本次作业的内容和实验报告在 attachment 文件夹中。

# 部署方式

将仓库克隆到本地。

首先准备 mysql 数据库，数据库表的定义在 attachment 文件夹中，将其导入。

然后需要准备一个邮箱（建议企业邮箱，如阿里云企业邮箱）来进行验证码的发送。邮箱需要支持 smtp 服务。

然后需要在 deepseek 开放平台上购买额度。

mysql 的连接信息按 `mysql://[用户名]:[密码]@[数据库地址]:[端口号]/[数据库名称]` 的格式填写到 `server/config/config.toml` 中。同时邮箱的连接信息（邮件地址，密码，smtp 服务器地址等）和 deepseek 的 token 也写入该文件中。

然后我们进入 server 目录，执行 `cargo build --release` 进行编译（注意需要事前安装好 rust 的工具链），编译得到服务端。

然后进入 web 目录，根据实际情况编辑 `web/src/config/index.ts`。需要修改的是 `API_URL_LOCAL` 即在本地请求服务端的地址，以及 `API_URL_REMOTE` 即从外网请求服务端的地址。地址的结尾均不要带斜杠。

先执行 `yarn install` 安装依赖，然后执行 `yarn run build` 进行编译。编译完成后，我们将 `web/.next/static` 文件夹复制到 `web/.next/standalone/.next` 中。然后 `web/.next/standalone` 即为前端部分的编译产物。直接执行 `server.js` 即可运行。

使用 nginx 反向代理前端的时候需要添加如下配置以确保 Next.js 正常工作：

```ini
location / {
    ...
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Scheme $scheme;
    ...
}
```

同时不建议设置过短的超时时间
