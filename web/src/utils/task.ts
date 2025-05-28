import { TASK_LIME_LIMIT, TASK_ORANGE_LIMIT, TASK_RED_LIMIT } from "@/config";

export const getTaskStatus = (deadline: number) => {
	const now = new Date().getTime();
	const remain_time = deadline - now;
	if (remain_time <= 0) {
		return "expired";
	} else if (remain_time <= TASK_RED_LIMIT) {
		return "red";
	} else if (remain_time <= TASK_ORANGE_LIMIT) {
		return "orange";
	} else if (remain_time <= TASK_LIME_LIMIT) {
		return "lime";
	} else {
		return "green";
	}
};
