import NormalContainter from "@/components/NormalContainter";
import ErrorPageTemplate from "@/components/page/ErrorPageTemplate";
import { getServerRequest } from "@/utils/request/server";
import { headers } from "next/headers";
import UserManager from "./UserManager";
import { getAllUserList } from "@/api/user";

const UserManagerPage = async () => {
	const header = await headers();
	const permission = JSON.parse(header.get("permission") ?? "[]");
	if (!permission.includes("manage_user")) {
		return <ErrorPageTemplate title="没有权限" info="你没有权限访问该页面" />;
	}
	const session = header.get("session") as string;
	const r = await getServerRequest(session);
	try {
		const list = await getAllUserList(r);
		return (
			<NormalContainter>
				<UserManager list={list} />
			</NormalContainter>
		);
	} catch (e) {
		return <ErrorPageTemplate title="加载页面时出错" info={String(e)} />;
	}
};

export default UserManagerPage;
