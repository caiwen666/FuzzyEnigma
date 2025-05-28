import NormalContainter from "@/components/NormalContainter";
import TaskEdit from "./TaskEdit";
import { WithParamsProps } from "@/utils/type";
import { toValue } from "@/utils/url";
import NotFound from "@/components/page/NotFound";
import { getTaskDetail } from "@/api/task";
import { headers } from "next/headers";
import { getServerRequest } from "@/utils/request/server";

const TaskEditPage: React.FC<WithParamsProps> = async (props) => {
	const searchParams = await props.searchParams;
	const id = toValue(searchParams.id);
	if (!id || isNaN(Number(id))) return <NotFound />;
	try {
		const header = await headers();
		const session = header.get("session") as string;
		const r = await getServerRequest(session);
		const task = await getTaskDetail(r, Number(id));
		return (
			<NormalContainter>
				<TaskEdit task={task} />
			</NormalContainter>
		);
	} catch {
		return <NotFound />;
	}
};

export default TaskEditPage;
