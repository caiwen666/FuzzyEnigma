"use client";

import PageTitle from "@/components/PageTitle";
import TaskItem from "@/components/TaskItem";
import { Task } from "@/entity/task";
import { Add, Delete, Edit } from "@mui/icons-material";
import {
	Button,
	ButtonBase,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Divider,
	Paper,
} from "@mui/material";
import { useRef, useState } from "react";
import request from "@/utils/request/client";
import { deleteTask } from "@/api/task";
import { enqueueSnackbar } from "notistack";
import classNames from "classnames";

interface Props {
	list: Task[];
}

const TaskManager: React.FC<Props> = (props) => {
	const [loading, setLoading] = useState("");
	const [deleteDialog, setDeleteDialog] = useState(false);
	const deleteTarget = useRef(0);
	const { list } = props;
	const [taskList, setTaskList] = useState(list);
	const [deletePrev, setDeletePrev] = useState<null | Task[]>(null);
	const buttons = [
		{
			text: "创建任务",
			icon: <Add />,
			href: "/task/create",
		},
	];
	const handleDelete = async () => {
		setLoading("delete" + deleteTarget.current);
		try {
			const res = await deleteTask(request, deleteTarget.current);
			if (res !== null) {
				setDeletePrev(res);
			} else {
				setTaskList((prev) =>
					prev.filter((item) => item.id !== deleteTarget.current),
				);
				enqueueSnackbar("删除成功", {
					variant: "success",
					autoHideDuration: 3000,
				});
			}
		} catch {}
		setLoading("");
	};
	return (
		<div>
			<PageTitle title="管理任务" back buttons={buttons}></PageTitle>
			<Paper className="mt-5 overflow-hidden">
				{taskList.length === 0 && (
					<div className="p-12 text-center text-sm text-gray-500">暂无任务</div>
				)}
				{taskList.length !== 0 &&
					taskList.map((item, index) => (
						<div key={item.id}>
							{index !== 0 && <Divider />}
							<div className="p-3 pb-2">
								<TaskItem task={item} />
								<div className="mt-2">
									<Button
										startIcon={<Edit />}
										size="small"
										href={`/task/edit?id=${item.id}`}
										disabled={loading !== ""}
									>
										编辑
									</Button>
									<Button
										startIcon={<Delete />}
										size="small"
										className="ml-2"
										onClick={() => {
											setDeleteDialog(true);
											deleteTarget.current = item.id;
										}}
										disabled={loading !== ""}
										loading={loading === "delete" + item.id}
									>
										删除
									</Button>
								</div>
							</div>
						</div>
					))}
			</Paper>
			<Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
				<DialogTitle>删除任务</DialogTitle>
				<DialogContent>
					<DialogContentText>
						确定要删除该任务吗？删除后无法恢复。
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
						onClick={() => {
							setDeleteDialog(false);
							handleDelete();
						}}
						disabled={loading !== ""}
					>
						删除
					</Button>
				</DialogActions>
			</Dialog>
			<Dialog
				open={deletePrev !== null}
				fullWidth
				maxWidth="sm"
				onClose={() => setDeletePrev(null)}
			>
				<DialogTitle>删除失败</DialogTitle>
				<DialogContent>
					<DialogContentText>该任务被下列任务依赖，无法删除</DialogContentText>
					{deletePrev?.map((item, index) => (
						<div key={item.id} className={classNames({ "mt-2": index === 0 })}>
							{index !== 0 && <Divider />}
							<ButtonBase
								className="w-full justify-start p-2"
								component="a"
								href={`/task/edit?id=${item.id}`}
								target="_blank"
							>
								<TaskItem task={item} />
							</ButtonBase>
						</div>
					))}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeletePrev(null)}>确定</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
};

export default TaskManager;
