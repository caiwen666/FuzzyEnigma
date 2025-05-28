import { Task } from "./task";
import { UserInfo } from "./user";

export type ResourceType = "file" | "link";
export type ResourceAttitude = "up" | "down" | "none";

export interface Resource {
	id: number;
	type: ResourceType;
	name: string;
	up: number;
	down: number;
	commentCount: number;
	tags: string[];
}

export interface Comment {
	id: number;
	user: UserInfo;
	content: string;
	time: number;
}

export interface ResourceDetail {
	info: Resource;
	comments: Comment[];
	attitude: ResourceAttitude;
	task: Task;
}

export const resourceTypeText = (v: ResourceType): string => {
	switch (v) {
		case "file":
			return "文件";
		case "link":
			return "链接";
		default:
			return v;
	}
};
