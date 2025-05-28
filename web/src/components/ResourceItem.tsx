import { Resource } from "@/entity/resource";
import { DefaultProps } from "@/utils/type";
import {
	InsertDriveFileOutlined,
	CommentOutlined,
	ThumbUpOffAlt,
	ThumbDownOffAlt,
	DeleteOutline,
	Link,
} from "@mui/icons-material";
import { ButtonBase, Divider, Button } from "@mui/material";
import classNames from "classnames";
import React from "react";

interface Props extends DefaultProps {
	resource: Resource;
	onDelete?: (id: number) => void;
	loading?: string;
}

const ResourceItem: React.FC<Props> = (props) => {
	const [resource, setResource] = React.useState<Resource>(props.resource);
	const [loading, setLoading] = React.useState<string>(props.loading || "");
	const [className, setClassName] = React.useState<string>(
		props.className || "",
	);
	React.useEffect(() => {
		setResource(props.resource);
		setLoading(props.loading || "");
		setClassName(props.className || "");
	}, [props.resource, props.loading, props.className]);
	const { onDelete } = props;
	return (
		<ButtonBase
			component="a"
			className={classNames(
				"p-2 hover:bg-background hover:bg-opacity-80 transition-all flex justify-start",
				className,
			)}
			href={"/resource/detail?id=" + resource.id}
		>
			{resource.type === "file" && (
				<InsertDriveFileOutlined className="text-4xl text-title m-1" />
			)}
			{resource.type === "link" && <Link className="text-4xl text-title m-1" />}
			<div className="ml-1 flex-1 truncate mx-1">
				<div className="overflow-hidden text-ellipsis whitespace-nowrap">
					{resource.name}
				</div>
				<div className="flex flex-wrap">
					<div className="text-xs">
						<CommentOutlined className="text-xs mr-0.5" />
						评论：{resource.commentCount}
					</div>
					<Divider
						orientation="vertical"
						flexItem
						className="mx-2 h-3 my-auto"
					/>
					<div className="text-xs">
						<ThumbUpOffAlt className="text-xs mr-0.5" />
						点赞：{resource.up}
					</div>
					<Divider
						orientation="vertical"
						flexItem
						className="mx-2 h-3 my-auto"
					/>
					<div className="text-xs">
						<ThumbDownOffAlt className="text-xs mr-0.5" />
						点踩：{resource.down}
					</div>
				</div>
			</div>
			{onDelete && (
				<Button
					startIcon={<DeleteOutline />}
					className="ml-auto flex-none"
					onClick={(e) => {
						e.stopPropagation();
						e.preventDefault();
						onDelete(resource.id);
					}}
					disabled={loading !== ""}
					loading={loading === "deleteResource" + resource.id}
				>
					删除
				</Button>
			)}
		</ButtonBase>
	);
};

export default ResourceItem;
