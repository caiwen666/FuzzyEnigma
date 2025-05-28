"use client";

import PageTitle from "@/components/PageTitle";
import { ResourceDetail, resourceTypeText } from "@/entity/resource";
import {
	Add,
	Delete,
	EditOutlined,
	ThumbDown,
	ThumbDownOffAlt,
	ThumbUp,
	ThumbUpOffAlt,
} from "@mui/icons-material";
import {
	Button,
	ButtonBase,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Divider,
	IconButton,
	Paper,
	styled,
	TextField,
} from "@mui/material";
import { useRef, useState } from "react";
import Badge, { badgeClasses } from "@mui/material/Badge";
import UserItem from "@/components/UserItem";
import {
	addComment,
	addResourceTag,
	attitudeResource,
	deleteComment,
	deleteResource,
	fetchResource,
	removeResourceTag,
	updateResource,
} from "@/api/resource";
import request from "@/utils/request/client";
import { enqueueSnackbar } from "notistack";
import dayjs from "dayjs";
import { UserInfo } from "@/entity/user";
import { API_URL_REMOTE } from "@/config";
import TaskItem from "@/components/TaskItem";

interface Props {
	resource: ResourceDetail;
	manage: boolean;
	me: UserInfo;
}

const CartBadge = styled(Badge)`
	& .${badgeClasses.badge} {
		top: -12px;
		right: -6px;
	}
`;

const ResourceIndex: React.FC<Props> = (props) => {
	const [loading, setLoading] = useState("");
	const [addTagDialog, setAddTagDialog] = useState(false);
	const [updateDialog, setUpdateDialog] = useState(false);
	const [deleteDialog, setDeleteDialog] = useState(false);
	const { resource, manage, me } = props;
	const [tags, setTags] = useState<string[]>(resource.info.tags);
	const tagsRef = useRef(tags);
	const [tagText, setTagText] = useState("");
	const [name, setName] = useState(resource.info.name);
	const [nameText, setNameText] = useState("");
	const [contentText, setContentText] = useState("");
	const [up, setUp] = useState(resource.info.up);
	const [down, setDown] = useState(resource.info.down);
	const [attitude, setAttitude] = useState(resource.attitude);
	const [comments, setComments] = useState(resource.comments);
	const handleDeleteTag = async (tag: string) => {
		setLoading("deleteTag");
		try {
			await removeResourceTag(request, resource.info.id, tag);
			tagsRef.current = tagsRef.current.filter((target) => target !== tag);
			setTags([...tagsRef.current]);
			enqueueSnackbar("删除标签成功", {
				variant: "success",
				autoHideDuration: 3000,
			});
		} catch {}
		setLoading("");
	};
	const handleDeleteComment = async (commentId: number) => {
		setLoading("deleteComment" + commentId);
		try {
			await deleteComment(request, commentId);
			setComments((prev) => prev.filter((comment) => comment.id !== commentId));
			enqueueSnackbar("删除评论成功", {
				variant: "success",
				autoHideDuration: 3000,
			});
		} catch {}
		setLoading("");
	};
	const handleAddComment = async (content: string) => {
		setLoading("addComment");
		try {
			const id = await addComment(request, resource.info.id, content);
			setContentText("");
			setComments((prev) => [
				...prev,
				{
					id,
					content,
					time: Date.now(),
					user: me,
				},
			]);
			enqueueSnackbar("添加评论成功", {
				variant: "success",
				autoHideDuration: 3000,
			});
		} catch {}
		setLoading("");
	};
	const handleFetchResource = async () => {
		setLoading("fetch");
		try {
			const res = await fetchResource(request, resource.info.id);
			if (resource.info.type == "file") {
				window.open(
					API_URL_REMOTE + "/resource/download?ticket=" + res,
					"_blank",
				);
			} else {
				window.open(res, "_blank");
			}
		} catch {}
		setLoading("");
	};
	return (
		<>
			<PageTitle title="学习资源" back />
			<Paper className="mt-5">
				<div className="p-3">
					<div className="text-title font-bold flex items-center">
						<span className="text-lg">
							{resourceTypeText(resource.info.type)}
						</span>
						{manage && (
							<div className="ml-auto flex-none">
								<IconButton
									size="small"
									className="ml-1 self-center"
									onClick={() => {
										setAddTagDialog(true);
										setTagText("");
									}}
								>
									<Add />
								</IconButton>
								<IconButton
									size="small"
									onClick={() => {
										setUpdateDialog(true);
										setNameText(name);
									}}
								>
									<EditOutlined />
								</IconButton>
								<IconButton size="small" onClick={() => setDeleteDialog(true)}>
									<Delete />
								</IconButton>
							</div>
						)}
					</div>
					<div className="flex items-center">
						<div className="text-xl break-all">{name}</div>
					</div>
					<div className="flex flex-wrap mt-1">
						{tags.map((v) => (
							<Chip
								label={v}
								key={v}
								onDelete={manage ? () => handleDeleteTag(v) : undefined}
								className="m-1"
								size="small"
							/>
						))}
					</div>
				</div>
				<Divider />
				<div className="text-sm p-3 flex">
					<IconButton
						onClick={async () => {
							try {
								if (attitude === "up") {
									await attitudeResource(request, resource.info.id, "none");
									setAttitude("none");
									setUp((v) => v - 1);
								} else {
									await attitudeResource(request, resource.info.id, "up");
									setUp((v) => v + 1);
									if (attitude === "down") {
										setDown((v) => v - 1);
									}
									setAttitude("up");
								}
							} catch {}
						}}
					>
						{attitude === "up" ? (
							<ThumbUp fontSize="small" />
						) : (
							<ThumbUpOffAlt fontSize="small" />
						)}
						<CartBadge badgeContent={up} color="primary" overlap="circular" />
					</IconButton>
					<IconButton
						className="ml-4"
						onClick={async () => {
							try {
								if (attitude === "down") {
									await attitudeResource(request, resource.info.id, "none");
									setAttitude("none");
									setDown((v) => v - 1);
								} else {
									await attitudeResource(request, resource.info.id, "down");
									setDown((v) => v + 1);
									if (attitude === "up") {
										setUp((v) => v - 1);
									}
									setAttitude("down");
								}
							} catch {}
						}}
					>
						{attitude === "down" ? (
							<ThumbDown fontSize="small" />
						) : (
							<ThumbDownOffAlt fontSize="small" />
						)}
						<CartBadge badgeContent={down} color="primary" overlap="circular" />
					</IconButton>
					<Button
						size="small"
						className="ml-auto"
						onClick={handleFetchResource}
					>
						打开
					</Button>
				</div>
			</Paper>
			<Paper className="mt-2 overflow-hidden">
				<ButtonBase
					component="a"
					className="p-3 justify-start w-full hover:bg-background transition-all hover:bg-opacity-75"
					href={"/task/detail?id=" + resource.task.id}
				>
					<TaskItem task={resource.task} />
				</ButtonBase>
			</Paper>
			<Paper className="mt-2">
				<div className="p-3">
					<div className="text-title font-bold flex items-center">
						<span className="text-lg">评论</span>
					</div>
					<TextField
						className="mt-4"
						label="评论"
						variant="outlined"
						fullWidth
						multiline
						rows={4}
						value={contentText}
						onChange={(e) => {
							setContentText(e.target.value);
						}}
					/>
					<div className="flex">
						<Button
							className="ml-auto mt-3"
							onClick={() => {
								if (contentText.length === 0) return;
								handleAddComment(contentText);
							}}
							loading={loading === "addComment"}
							disabled={loading !== ""}
						>
							发表评论
						</Button>
					</div>
				</div>
				{comments.length === 0 && (
					<>
						<Divider />
						<div className="text-sm py-5 text-center">暂无评论</div>
					</>
				)}
				{comments.length !== 0 &&
					comments.map((comment) => (
						<div key={comment.id}>
							<Divider />
							<div className="p-3">
								<div className="flex">
									<UserItem user={comment.user}></UserItem>
									{(manage || comment.user.uid === me.uid) && (
										<IconButton
											className="ml-auto"
											disabled={loading !== ""}
											loading={loading === "deleteComment" + comment.id}
											onClick={() => handleDeleteComment(comment.id)}
										>
											<Delete />
										</IconButton>
									)}
								</div>
								<div className="py-4 px-2">{comment.content}</div>
								<div className="text-xs text-title">
									发表于：{dayjs(comment.time).format("YYYY-MM-DD HH:mm:ss")}
								</div>
							</div>
						</div>
					))}
			</Paper>
			<Dialog open={addTagDialog} onClose={() => setAddTagDialog(false)}>
				<DialogTitle>添加标签</DialogTitle>
				<DialogContent>
					<TextField
						variant="outlined"
						label="标签名称"
						className="mt-2"
						value={tagText}
						error={
							tagText.length === 0 ||
							tags.find((v) => v == tagText) !== undefined
						}
						helperText={
							tagText.length === 0
								? "标签内容不能为空"
								: tags.find((v) => v == tagText) !== undefined
									? "标签名称已存在"
									: undefined
						}
						onChange={(e) => {
							setTagText(e.target.value);
						}}
					/>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => setAddTagDialog(false)}
						disabled={loading !== ""}
					>
						取消
					</Button>
					<Button
						onClick={async () => {
							if (tagText.length === 0) return;
							if (tags.find((v) => v == tagText) !== undefined) return;
							setLoading("addTag");
							try {
								await addResourceTag(request, resource.info.id, tagText);
								tagsRef.current.push(tagText);
								setTags([...tagsRef.current]);
								setAddTagDialog(false);
								enqueueSnackbar("添加标签成功", {
									variant: "success",
									autoHideDuration: 3000,
								});
							} catch {}
							setLoading("");
						}}
						disabled={loading !== ""}
						loading={loading === "addTag"}
					>
						添加
					</Button>
				</DialogActions>
			</Dialog>
			<Dialog
				open={updateDialog}
				onClose={() => setUpdateDialog(false)}
				fullWidth
				maxWidth="sm"
			>
				<DialogTitle>更新信息</DialogTitle>
				<DialogContent>
					<TextField
						fullWidth
						variant="outlined"
						label="资源名称"
						className="mt-2"
						value={nameText}
						error={nameText.length === 0}
						helperText={nameText.length === 0 ? "资源名称不能为空" : undefined}
						onChange={(e) => {
							setNameText(e.target.value);
						}}
					/>
				</DialogContent>
				<DialogActions>
					<Button
						disabled={loading !== ""}
						onClick={() => setUpdateDialog(false)}
					>
						取消
					</Button>
					<Button
						disabled={loading !== ""}
						onClick={async () => {
							if (nameText.length === 0) return;
							setLoading("update");
							try {
								await updateResource(request, resource.info.id, nameText);
								setName(nameText);
								setUpdateDialog(false);
								enqueueSnackbar("更新资源名称成功", {
									variant: "success",
									autoHideDuration: 3000,
								});
							} catch {}
							setLoading("");
						}}
						loading={loading === "update"}
					>
						更新
					</Button>
				</DialogActions>
			</Dialog>
			<Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
				<DialogTitle>删除资源</DialogTitle>
				<DialogContent>
					<DialogContentText>
						确定要删除该资源吗？删除后无法恢复
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => setDeleteDialog(false)}
						disabled={loading !== ""}
					>
						取消
					</Button>
					<Button
						loading={loading === "delete"}
						onClick={async () => {
							setLoading("delete");
							try {
								await deleteResource(request, resource.info.id);
								window.location.href = "/task/detail?id=" + resource.task.id;
							} catch {}
							setLoading("");
						}}
					>
						删除
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default ResourceIndex;
