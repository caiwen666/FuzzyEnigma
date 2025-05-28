import NormalContainter from "@/components/NormalContainter";
import { WithParamsProps } from "@/utils/type";
import { toValue } from "@/utils/url";
import NotFound from "@/components/page/NotFound";
import { headers } from "next/headers";
import { getServerRequest } from "@/utils/request/server";
import { getResourceDetail } from "@/api/resource";
import ResourceIndex from "./ResourceDetail";

const ResourceDetailPage: React.FC<WithParamsProps> = async (props) => {
	const searchParams = await props.searchParams;
	const id = toValue(searchParams.id);
	if (!id || isNaN(Number(id))) return <NotFound />;
	try {
		const header = await headers();
		const session = header.get("session") as string;
		const uid = Number(header.get("uid")!);
		const username = header.get("username")!;
		const email = header.get("email")!;
		const r = await getServerRequest(session);
		const resource = await getResourceDetail(r, Number(id));
		const manage =
			uid === resource.task.publisher.uid ||
			header.get("permission")?.includes("manage_all_task") ||
			false;
		return (
			<NormalContainter>
				<ResourceIndex
					resource={resource}
					manage={manage}
					me={{ uid, username, email }}
				/>
			</NormalContainter>
		);
	} catch {
		return <NotFound />;
	}
};

export default ResourceDetailPage;
