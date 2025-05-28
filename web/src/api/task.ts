import { Task, TaskDetail, TaskInfo } from "@/entity/task";
import { AxiosInstance } from "axios";

export const createTask = async (
	r: AxiosInstance,
	info: TaskInfo,
	prev: number | null,
	description: string,
): Promise<number> => {
	const taskId: number = await r.post("/task/create", {
		info,
		prev,
		description,
	});
	return taskId;
};

export const updateTask = async (
	r: AxiosInstance,
	taskId: number,
	info: TaskInfo,
	description: string,
): Promise<void> => {
	await r.post(
		"/task/update",
		{
			info,
			description,
		},
		{ params: { id: taskId } },
	);
};

export const deleteTask = async (r: AxiosInstance, taskId: number) => {
	const res: null | Task[] = await r.get("/task/delete", {
		params: { id: taskId },
	});
	return res;
};

export const getCreatedTaskList = async (r: AxiosInstance): Promise<Task[]> => {
	const taskList: Task[] = await r.get("/task/created_list");
	return taskList;
};

export const getParticipatedTaskList = async (r: AxiosInstance) => {
	const taskList: { task: Task; finish: boolean }[] = await r.get(
		"/task/participated_list",
	);
	return taskList;
};

export const getTaskDetail = async (
	r: AxiosInstance,
	taskId: number,
): Promise<TaskDetail> => {
	const taskDetail: TaskDetail = await r.get("/task/detail", {
		params: { id: taskId },
	});
	return taskDetail;
};

export const createGroup = async (
	r: AxiosInstance,
	taskId: number,
): Promise<number> => {
	const group_id: number = await r.get("/task/group/create", {
		params: { task_id: taskId },
	});
	return group_id;
};

export const deleteGroup = async (
	r: AxiosInstance,
	taskId: number,
	groupId: number,
): Promise<void> => {
	await r.get("/task/group/delete", {
		params: { task_id: taskId, group_id: groupId },
	});
};

export const addGroupMember = async (
	r: AxiosInstance,
	taskId: number,
	groupId: number,
	uid: number,
): Promise<void> => {
	await r.get("/task/group/add_user", {
		params: { task_id: taskId, group_id: groupId, uid },
	});
};

export const deleteGroupMember = async (
	r: AxiosInstance,
	taskId: number,
	groupId: number,
	uid: number,
): Promise<void> => {
	await r.get("/task/group/delete_user", {
		params: { task_id: taskId, group_id: groupId, uid },
	});
};

export const finishTask = async (
	r: AxiosInstance,
	taskId: number,
): Promise<void> => {
	await r.get("/task/finish", { params: { id: taskId } });
};

export const getTimeArrange = async (r: AxiosInstance) => {
	const res: { content: string; created: number } | null =
		await r.get("/task/time_arrange");
	return res;
};

export const updateTimeArrange = async (r: AxiosInstance) => {
	// ai生成会比较慢，超时时间设置大一点
	await r.get("/task/update_time_arrange", { timeout: 1000 * 60 * 10 });
};
