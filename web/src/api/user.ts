import { UserDetail } from "@/entity/user";
import { UserInfo } from "@/entity/user";
import { AxiosInstance } from "axios";

export const sendEmail = async (r: AxiosInstance, email: string) => {
	await r.get("/user/email/send", { params: { email } });
};

export const verifyEmail = async (
	r: AxiosInstance,
	email: string,
	code: number,
): Promise<string> => {
	const ticket: string = await r.post("/user/email/verify", { email, code });
	return ticket;
};

export const register = async (
	r: AxiosInstance,
	username: string,
	ticket: string,
	password: string,
): Promise<string> => {
	const token: string = await r.post("/user/register", {
		username,
		ticket,
		password,
	});
	return token;
};

export const login = async (
	r: AxiosInstance,
	email: string,
	password: string,
): Promise<string> => {
	const token: string = await r.post("/user/login", {
		email,
		password,
	});
	return token;
};

export const logout = async (r: AxiosInstance) => {
	await r.get("/user/logout");
};

export const getUserInfo = async (r: AxiosInstance): Promise<UserDetail> => {
	const data: UserDetail = await r.get("/user/basic_info");
	return data;
};

export const searchUser = async (
	r: AxiosInstance,
	keyword: string,
): Promise<UserInfo[]> => {
	const data: UserInfo[] = await r.get("/user/search", {
		params: { keyword },
	});
	return data;
};

export const deleteUser = async (r: AxiosInstance, uid: number) => {
	await r.get("/user/delete", {
		params: { uid },
	});
};

export const getAllUserList = async (r: AxiosInstance) => {
	const res: { info: UserInfo; permissions: string[] }[] =
		await r.get("/user/list");
	return res;
};

export const updateUserPermission = async (
	r: AxiosInstance,
	uid: number,
	permission: string[],
) => {
	await r.post("/user/update_permission", {
		uid,
		permission,
	});
};
