import {
	Resource,
	ResourceAttitude,
	ResourceDetail,
	ResourceType,
} from "@/entity/resource";
import { AxiosInstance } from "axios";

export const createResource = async (
	r: AxiosInstance,
	type: ResourceType,
	name: string,
	tags: string[],
	task_id: number,
	content: string | File,
) => {
	const formData = new FormData();
	formData.append("type", type);
	formData.append("name", name);
	for (const tag of tags) {
		formData.append("tags", tag);
	}
	formData.append("task_id", task_id.toString());
	if (type === "file") {
		formData.append("content", content as File);
	} else {
		formData.append("content", content as string);
	}
	const res: number = await r.post("/resource/create", formData, {
		headers: {
			"Content-Type": "multipart/form-data",
		},
	});
	return res;
};

export const updateResource = async (
	r: AxiosInstance,
	resource_id: number,
	name: string,
) => {
	const formData = new FormData();
	formData.append("name", name);
	await r.post("/resource/update", formData, {
		headers: {
			"Content-Type": "multipart/form-data",
		},
		params: {
			resource_id,
		},
	});
};

export const deleteResource = async (r: AxiosInstance, resource_id: number) => {
	await r.get("/resource/delete", {
		params: {
			resource_id,
		},
	});
};

export const getResourceDetail = async (
	r: AxiosInstance,
	resource_id: number,
) => {
	const res: ResourceDetail = await r.get("/resource/detail", {
		params: {
			resource_id,
		},
	});
	return res;
};

export const addResourceTag = async (
	r: AxiosInstance,
	resource_id: number,
	value: string,
) => {
	await r.get("/resource/tag/add", {
		params: {
			resource_id,
			value,
		},
	});
};

export const removeResourceTag = async (
	r: AxiosInstance,
	resource_id: number,
	value: string,
) => {
	await r.get("/resource/tag/delete", {
		params: {
			resource_id,
			value,
		},
	});
};

export const attitudeResource = async (
	r: AxiosInstance,
	resource_id: number,
	attitude: ResourceAttitude,
) => {
	await r.get("/resource/attitude", {
		params: {
			resource_id,
			attitude,
		},
	});
};

export const addComment = async (
	r: AxiosInstance,
	resource_id: number,
	content: string,
) => {
	const formData = new FormData();
	formData.append("content", content);
	const res: number = await r.post("/resource/comment/add", formData, {
		headers: {
			"Content-Type": "multipart/form-data",
		},
		params: {
			resource_id,
		},
	});
	return res;
};

export const deleteComment = async (r: AxiosInstance, comment_id: number) => {
	await r.get("/resource/comment/delete", {
		params: {
			comment_id,
		},
	});
};

export const getRecommendResource = async (
	r: AxiosInstance,
	task_id: number,
) => {
	const res: Resource[] = await r.get("/resource/recommend", {
		params: {
			task_id,
		},
	});
	return res;
};

export const fetchResource = async (r: AxiosInstance, resource_id: number) => {
	const res: string = await r.get("/resource/fetch", {
		params: {
			resource_id,
		},
	});
	return res;
};
