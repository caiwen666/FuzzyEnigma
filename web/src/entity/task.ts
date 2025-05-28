import { Resource } from "./resource";
import { UserInfo } from "./user";

export type TaskType = "homework" | "review" | "discussion" | "extra" | "group";
export type TaskPriority = "high" | "medium" | "low";

export interface TaskInfo {
	title: string;
	type: TaskType;
	priority: TaskPriority;
	cost: number;
	deadline: number;
}

export interface Task {
	id: number;
	info: TaskInfo;
	publisher: UserInfo;
}

export const taskTypeText = (str: string): string => {
	switch (str) {
		case "homework":
			return "课程作业";
		case "review":
			return "考试复习";
		case "discussion":
			return "研讨准备";
		case "extra":
			return "竞赛拓展";
		case "group":
			return "小组任务";
		default:
			return str;
	}
};

export const taskPriorityText = (str: string): string => {
	switch (str) {
		case "high":
			return "高";
		case "medium":
			return "中";
		case "low":
			return "低";
		default:
			return str;
	}
};

export interface TaskDetail {
	task: Task;
	description: string;
	resources: Resource[];
	finished: boolean | null;
	myGroup: {
		id: number;
		members: UserInfo[];
	} | null;
	allGroup: TaskGroups | null;
	prevTask: Task | null;
}

export type TaskGroups = {
	[id: number]: { user: UserInfo; finished: boolean }[];
};
