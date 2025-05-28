export const WEBSITE_NAME = "Fuzzy-Enigma";
export const API_URL_LOCAL = "http://127.0.0.1:15565";
export const API_URL_REMOTE = "http://127.0.0.1:15565";
export const EnableDebugLog = true;

export const TASK_RED_LIMIT = 1000 * 60 * 60 * 3; // 3 hours
export const TASK_ORANGE_LIMIT = 1000 * 60 * 60 * 24; // 1 day
export const TASK_LIME_LIMIT = 1000 * 60 * 60 * 24 * 3; // 3 day

export const PERMISSIONS = [
	{
		value: "manage_all_task",
		label: "可以管理所有任务",
	},
	{
		value: "manage_user",
		label: "可以进行用户管理",
	},
	{
		value: "root",
		label: "可以更改用户权限，更改用户角色，同时不能被删除",
	},
	{
		value: "assign_task",
		label: "可以将任务指派给其他人",
	},
	{
		value: "ai",
		label: "可以使用AI助手",
	},
];
