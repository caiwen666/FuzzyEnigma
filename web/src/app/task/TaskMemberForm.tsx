import UserAvatar from "@/components/UserAvatar";
import UserItem from "@/components/UserItem";
import { TaskGroups, TaskType } from "@/entity/task";
import { DefaultProps } from "@/utils/type";
import { Add, DeleteOutlineOutlined, PlaylistAdd } from "@mui/icons-material";
import {
	Button,
	ButtonBase,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	IconButton,
	Paper,
	TextField,
	Checkbox,
	DialogContentText,
	Tooltip,
} from "@mui/material";
import classNames from "classnames";
import { useEffect, useRef, useState } from "react";
import _ from "lodash";
import request from "@/utils/request/client";
import { searchUser } from "@/api/user";
import { UserInfo } from "@/entity/user";
import {
	addGroupMember,
	createGroup,
	deleteGroup,
	deleteGroupMember,
} from "@/api/task";

interface Props extends DefaultProps {
	taskId: number;
	groups: TaskGroups;
	taskType: TaskType;
}

const TaskMember: React.FC<Props> = (props) => {
	const { className, groups, taskId, taskType, ...rest } = props;
	const [loading, setLoading] = useState("");
	const [addDialog, setAddDialog] = useState(false);
	const [deleteDialog, setDeleteDialog] = useState(false);
	const targetGroup = useRef(0);
	const [theGroups, setGroups] = useState<TaskGroups>(groups);
	const groupsRef = useRef(theGroups);
	const [searchResult, setSearchResult] = useState<UserInfo[]>([]);
	const [selectedUser, setSelectedUser] = useState<UserInfo[]>([]);
	const selectedUserRef = useRef(selectedUser);
	const handleSearch = _.debounce(async (value: string) => {
		if (value.length == 0) {
			setSearchResult([]);
			setLoading("");
			return;
		}
		try {
			const result = await searchUser(request, value);
			setSearchResult(result);
		} catch {
			setSearchResult([]);
		}
		setLoading("");
	}, 1000);
	const handleAddGroup = async () => {
		setLoading("addGroup");
		try {
			const groupId = await createGroup(request, taskId);
			groupsRef.current[groupId] = [];
			setGroups({ ...groupsRef.current });
		} catch {}
		setLoading("");
	};
	const handleDeleteGroup = async () => {
		setLoading("deleteGroup");
		try {
			await deleteGroup(request, taskId, targetGroup.current);
			delete groupsRef.current[targetGroup.current];
			setGroups({ ...groupsRef.current });
			const newSelectedUser: UserInfo[] = [];
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			Object.entries(groupsRef.current).forEach(([_, members]) => {
				members.forEach((u) => newSelectedUser.push(u.user));
			});
			selectedUserRef.current = newSelectedUser;
			setSelectedUser(selectedUserRef.current);
		} catch {}
		setLoading("");
	};
	const handleAddMember = async (target: UserInfo) => {
		setLoading("member");
		try {
			const group_id = targetGroup.current;
			await addGroupMember(request, taskId, group_id, target.uid);
			groupsRef.current[group_id].push({ user: target, finished: false });
			setGroups({ ...groupsRef.current });
			selectedUserRef.current.push(target);
			setSelectedUser([...selectedUserRef.current]);
		} catch {}
		setLoading("");
	};
	const handleRemoveMember = async (group_id: number, uid: number) => {
		setLoading("member");
		try {
			await deleteGroupMember(request, taskId, group_id, uid);
			groupsRef.current[group_id] = groupsRef.current[group_id].filter(
				(u) => u.user.uid != uid,
			);
			setGroups({ ...groupsRef.current });
			selectedUserRef.current = selectedUserRef.current.filter(
				(u) => u.uid != uid,
			);
			setSelectedUser([...selectedUserRef.current]);
		} catch {}
		setLoading("");
	};
	useEffect(() => {
		const newSelectedUser: UserInfo[] = [];
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		Object.entries(groupsRef.current).forEach(([_, members]) => {
			members.forEach((u) => newSelectedUser.push(u.user));
		});
		selectedUserRef.current = newSelectedUser;
		setSelectedUser(selectedUserRef.current);
		return () => {
			handleSearch.cancel();
		};
	}, []);
	return (
		<>
			<Paper {...rest} className={classNames(className, "p-4 pt-2")}>
				<div className="text-lg items-center flex">
					<div>任务指派</div>
					<Button
						startIcon={<PlaylistAdd />}
						className={classNames("ml-2", {
							hidden: taskType != "group",
						})}
						onClick={handleAddGroup}
						loading={loading == "addGroup"}
						disabled={loading != ""}
					>
						添加分组
					</Button>
				</div>
				{Object.entries(theGroups)
					.sort((a, b) => Number(a[0]) - Number(b[0]))
					.map(([group_id, members], index) => (
						<div key={group_id} className="mt-3">
							<div className="font-bold">分组 #{index + 1}</div>
							<div className="flex flex-wrap items-center">
								{members.map((member) => (
									<Tooltip
										title={`${member.user.email} ${member.finished ? "已完成" : "未完成"}`}
										key={member.user.uid}
									>
										<Chip
											avatar={<UserAvatar username={member.user.username} />}
											label={member.user.username}
											variant="outlined"
											onDelete={() =>
												handleRemoveMember(Number(group_id), member.user.uid)
											}
											className="m-1"
											color={member.finished ? "primary" : undefined}
										/>
									</Tooltip>
								))}
								<IconButton
									size="small"
									onClick={() => {
										targetGroup.current = Number(group_id);
										setAddDialog(true);
									}}
								>
									<Add />
								</IconButton>
								<IconButton
									size="small"
									onClick={() => {
										targetGroup.current = Number(group_id);
										setDeleteDialog(true);
									}}
									className={classNames({ hidden: taskType != "group" })}
								>
									<DeleteOutlineOutlined />
								</IconButton>
							</div>
						</div>
					))}
			</Paper>
			<Dialog open={addDialog} fullWidth maxWidth="xs">
				<DialogTitle>添加指派对象</DialogTitle>
				<DialogContent>
					<TextField
						variant="filled"
						label="输入用户名"
						size="small"
						fullWidth
						onChange={(e) => {
							setLoading("search");
							handleSearch(e.target.value);
						}}
					></TextField>
					<div className="mt-2">
						{loading !== "search" &&
							searchResult.length != 0 &&
							searchResult.map((user, index) => {
								const selected = selectedUser.find((u) => u.uid == user.uid);
								return (
									<div key={user.uid}>
										{index != 0 && <Divider />}
										<ButtonBase
											className="flex text-start hover:bg-background transition-all p-2 rounded"
											component={"div"}
											onClick={() => {
												if (!selected) handleAddMember(user);
											}}
										>
											<UserItem user={user} />
											<Checkbox
												color="primary"
												className="self-center ml-auto"
												checked={selected != undefined}
											/>
										</ButtonBase>
									</div>
								);
							})}
						{loading !== "search" && searchResult.length == 0 && (
							<div className="text-center text-gray-500">没有搜索结果</div>
						)}
						{loading === "search" && <CircularProgress className="m-2" />}
					</div>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => setAddDialog(false)}
						disabled={loading !== ""}
						loading={loading === "member"}
					>
						确定
					</Button>
				</DialogActions>
			</Dialog>
			<Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
				<DialogTitle>删除分组</DialogTitle>
				<DialogContent>
					<DialogContentText>
						确定删除分组吗？删除后其包含的成员将从当前任务中移除
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
						disabled={loading !== ""}
						loading={loading == "deleteGroup"}
						onClick={() => {
							setDeleteDialog(false);
							handleDeleteGroup();
						}}
					>
						删除
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default TaskMember;
