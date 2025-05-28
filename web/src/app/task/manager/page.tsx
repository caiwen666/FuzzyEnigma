import { getCreatedTaskList } from "@/api/task";
import NormalContainter from "@/components/NormalContainter";
import { getServerRequest } from "@/utils/request/server";
import { headers } from "next/headers";
import TaskManager from "./TaskManager";
import ErrorPageTemplate from "@/components/page/ErrorPageTemplate";
import { formatToString } from "@/utils";

const TaskManagerPage = async () => {
	const header = await headers();
	const session = header.get("session") as string;
	const r = await getServerRequest(session);
	try {
		const list = await getCreatedTaskList(r);
		return (
			<NormalContainter>
				<TaskManager list={list} />
			</NormalContainter>
		);
	} catch (e) {
		return (
			<ErrorPageTemplate title="加载页面时出错" info={formatToString(e)} />
		);
	}
};

export default TaskManagerPage;
