import NormalContainter from "@/components/NormalContainter";
import Home from "./Home";
import { headers } from "next/headers";
import { getServerRequest } from "@/utils/request/server";
import { getParticipatedTaskList } from "@/api/task";
import ErrorPageTemplate from "@/components/page/ErrorPageTemplate";
import { formatToString } from "@/utils";

export const HomePage = async () => {
	const header = await headers();
	const session = header.get("session") as string;
	const r = await getServerRequest(session);
	try {
		const list = await getParticipatedTaskList(r);
		return (
			<NormalContainter>
				<Home list={list} />
			</NormalContainter>
		);
	} catch (e) {
		return (
			<ErrorPageTemplate title="加载页面时出错" info={formatToString(e)} />
		);
	}
};

export default HomePage;
