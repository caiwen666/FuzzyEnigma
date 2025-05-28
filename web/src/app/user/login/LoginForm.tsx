"use client";

import { NavigateNextOutlined } from "@mui/icons-material";
import { Button, TextField } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginFormSchema } from "@/config/schema";
import { useState } from "react";
import { DefaultProps } from "@/utils/type";
import { login } from "@/api/user";
import request from "@/utils/request/client";
import { setCookie } from "@/utils/cookie";

interface Props extends DefaultProps {
	callback?: string;
}

const LoginForm: React.FC<Props> = ({ callback, ...props }) => {
	const [loading, setLoading] = useState("");
	const {
		control,
		trigger,
		getValues,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(LoginFormSchema),
		mode: "onChange",
	});
	const handleSubmit = async () => {
		const valid = await trigger();
		if (!valid) {
			return;
		}
		const { email, password } = getValues();
		setLoading("login");
		try {
			const token = await login(request, email, password);
			setCookie("session", token, { maxAge: 60 * 60 * 12 });
			if (callback) {
				window.location.replace(callback);
			} else {
				window.location.replace("/");
			}
		} catch {}
		setLoading("");
	};
	return (
		<div {...props}>
			<div className="h-1 bg-primary"></div>
			<div className="p-6">
				<div className="text-2xl">登录</div>
			</div>
			<div className="px-6 pb-4">
				<Controller
					name="email"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							label="邮箱"
							variant="outlined"
							fullWidth
							error={!!errors.email}
							helperText={errors.email ? errors.email.message : ""}
						/>
					)}
				></Controller>
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
			</div>
			<div className="px-6 pb-4 flex">
				<div>
					<Button href="/user/register" disabled={loading !== ""}>
						注册
					</Button>
				</div>
				<div className="ml-auto">
					<Button
						loading={loading === "login"}
						endIcon={<NavigateNextOutlined />}
						onClick={handleSubmit}
					>
						登录
					</Button>
				</div>
			</div>
		</div>
	);
};
export default LoginForm;
