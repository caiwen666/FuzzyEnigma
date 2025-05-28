"use client";

import { RegisterFormSchema } from "@/config/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { NavigateNextOutlined } from "@mui/icons-material";
import { Button, TextField } from "@mui/material";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import request from "@/utils/request/client";
import { register, sendEmail, verifyEmail } from "@/api/user";
import { setCookie } from "@/utils/cookie";

const RegisterForm: React.FC<React.HTMLAttributes<HTMLDivElement>> = (
	props,
) => {
	const [loading, setLoading] = useState("");
	const [countDown, setCountDown] = useState(0);
	const {
		control,
		trigger,
		getValues,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(RegisterFormSchema),
		mode: "onChange",
	});
	const handleSendCode = async () => {
		const valid = await trigger("email");
		if (!valid) {
			return;
		}
		const { email } = getValues();
		setLoading("send");
		try {
			await sendEmail(request, email);
			setCountDown(60);
			const timer = setInterval(() => {
				setCountDown((v) => {
					const nv = v - 1;
					if (nv == 0) {
						clearInterval(timer);
					}
					return nv;
				});
			}, 1000);
		} catch {}
		setLoading("");
	};
	const handleSubmit = async () => {
		const valid = await trigger();
		if (!valid) {
			return;
		}
		const { email, code, password, username } = getValues();
		setLoading("next");
		try {
			const ticket = await verifyEmail(request, email, Number(code));
			const token = await register(request, username, ticket, password);
			setCookie("session", token, { maxAge: 60 * 60 * 12 });
			window.location.replace("/");
		} catch {}
		setLoading("");
	};
	return (
		<div {...props}>
			<div className="h-1 bg-primary"></div>
			<div className="p-6">
				<div className="text-2xl">注册</div>
			</div>
			<div className="px-6 pb-4">
				<Controller
					name="username"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							label="用户名"
							variant="outlined"
							fullWidth
							error={!!errors.username}
							helperText={errors.username ? errors.username.message : ""}
						/>
					)}
				></Controller>
				<Controller
					name="email"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							label="邮箱"
							variant="outlined"
							fullWidth
							className="mt-4"
							error={!!errors.email}
							helperText={errors.email ? errors.email.message : ""}
						/>
					)}
				></Controller>
				<div className="mt-3 flex">
					<Controller
						name="code"
						control={control}
						render={({ field }) => (
							<TextField
								{...field}
								label="验证码"
								variant="outlined"
								className="flex-1 mt-1"
								error={!!errors.code}
								helperText={errors.code ? errors.code.message : ""}
							/>
						)}
					></Controller>
					<Button
						className="flex-none self-center ml-2 mt-2"
						onClick={handleSendCode}
						loading={loading === "send"}
						disabled={countDown > 0 || loading !== ""}
					>
						发送验证码{countDown > 0 ? `(${countDown})` : ""}
					</Button>
				</div>
				<Controller
					name="password"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							label="密码"
							variant="outlined"
							fullWidth
							className="mt-4"
							error={!!errors.password}
							helperText={errors.password ? errors.password.message : ""}
							type="password"
						/>
					)}
				></Controller>
				<Controller
					name="confirmPassword"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							label="确认密码"
							variant="outlined"
							fullWidth
							className="mt-4"
							error={!!errors.confirmPassword}
							helperText={
								errors.confirmPassword ? errors.confirmPassword.message : ""
							}
							type="password"
						/>
					)}
				></Controller>
			</div>
			<div className="px-6 pt-2 pb-4 flex">
				<div>
					<Button href="/user/login" disabled={loading !== ""}>
						登录
					</Button>
				</div>
				<div className="ml-auto">
					<Button
						loading={loading === "next"}
						disabled={loading !== ""}
						endIcon={<NavigateNextOutlined />}
						onClick={handleSubmit}
					>
						下一步
					</Button>
				</div>
			</div>
		</div>
	);
};

export default RegisterForm;
