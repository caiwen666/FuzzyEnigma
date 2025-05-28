import ErrorPageTemplate from "@/components/page/ErrorPageTemplate";
import NotFound from "@/components/page/NotFound";
import { formatToString } from "@/utils";
import { WithParamsProps } from "@/utils/type";
import { headers } from "next/headers";
import TaskDetailIndex from "./TaskDetailIndex";
import { getServerRequest } from "@/utils/request/server";
import { getTaskDetail } from "@/api/task";
import NormalContainter from "@/components/NormalContainter";

const TaskDetailPage: React.FC<WithParamsProps> = async (props) => {
	const searchParams = await props.searchParams;
	const id = searchParams.id;
	if (!id || isNaN(Number(id))) return <NotFound />;
	try {
		const header = await headers();
		const session = header.get("session") as string;
		const r = await getServerRequest(session);
		const task = await getTaskDetail(r, Number(id));
		return (
			<NormalContainter>
				<TaskDetailIndex task={task} />
			</NormalContainter>
		);
	} catch (e) {
		return (
			<ErrorPageTemplate title="加载页面时出错" info={formatToString(e)} />
		);
	}
};

export default TaskDetailPage;
