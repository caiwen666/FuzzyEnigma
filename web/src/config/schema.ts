import { z } from "zod";

const password = z
	.string({
		required_error: "密码不能为空",
	})
	.min(6, "密码至少6位")
	.max(60, "密码最多60位")
	.nonempty("密码不能为空");
const email = z
	.string({
		required_error: "邮箱不能为空",
	})
	.email("请输入正确的邮箱")
	.nonempty("邮箱不能为空");
const username = z
	.string({
		required_error: "用户名不能为空",
	})
	.max(20, "用户名最多20位")
	.nonempty("用户名不能为空");
const emailCode = z
	.string({
		required_error: "验证码不能为空",
	})
	.regex(/^\d{6}$/, "请输入6位数字");

export const LoginFormSchema = z.object({
	email,
	password,
});

export const RegisterFormSchema = z
	.object({
		username,
		email,
		code: emailCode,
		password,
		confirmPassword: password,
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "两次密码输入不一致",
		path: ["confirmPassword"],
	});

export const TaskFormSchema = z.object({
	title: z.string().nonempty("任务名称不能为空"),
	description: z.string().optional(),
	priority: z.enum(["low", "medium", "high"]),
	type: z.enum(["homework", "review", "discussion", "extra", "group"]),
	deadline: z.any(),
	cost: z
		.string()
		.regex(/^[1-9][0-9]*$/, "请输入正整数")
		.nonempty("预计耗时不能为空")
		.transform((val) => Number(val)),
});

export const AttachmentFormSchema = z.object({
	name: z.string().nonempty("附件名称不能为空"),
	type: z.enum(["file", "link"]),
	content: z.string().nonempty("附件内容不能为空"),
});
