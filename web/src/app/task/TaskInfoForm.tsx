"use client";

import { Task, TaskInfo } from "@/entity/task";
import { DefaultProps } from "@/utils/type";
import {
	Button,
	ButtonBase,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Divider,
	FormControl,
	Grid,
	InputAdornment,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	TextField,
} from "@mui/material";
import classNames from "classnames";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { Add, Update } from "@mui/icons-material";
import { TaskFormSchema } from "@/config/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import TaskItem from "@/components/TaskItem";
import {
	createTask,
	deleteTask,
	getCreatedTaskList,
	updateTask,
} from "@/api/task";
import request from "@/utils/request/client";
import { enqueueSnackbar } from "notistack";

interface Props extends DefaultProps {
	taskID?: number;
	task?: TaskInfo;
	description?: string;
	prev?: Task | null;
}

const TaskForm: React.FC<Props> = (props) => {
	const { className, task, description, prev, taskID, ...rest } = props;
	const {
		control,
		trigger,
		getValues,
		setValue,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(TaskFormSchema),
		mode: "onChange",
	});
	const [loading, setLoading] = useState("");
	const [prevTask, setPrevTask] = useState<Task | null>(null);
	const prevTaskRef = useRef<Task | null>(prevTask);
	const [createdTask, setCreatedTask] = useState<Task[]>([]);
	const [prevTaskDialog, setPrevTaskDialog] = useState(false);
	const [deleteDialog, setDeleteDialog] = useState(false);
	const [deletePrev, setDeletePrev] = useState<null | Task[]>(null);
	const handleUpdate = async () => {
		const valid = await trigger();
		if (!valid) return;
		const { title, priority, type, deadline, cost, description } = getValues();
		const _deadline = deadline instanceof Date ? deadline : deadline.$d;
		const info: TaskInfo = {
			title,
			priority,
			type,
			deadline: _deadline.getTime(),
			cost: Number(cost),
		};
		setLoading("primary");
		try {
			await updateTask(
				request,
				taskID!,
				info,
				description === undefined ? "" : description,
			);
			enqueueSnackbar("更新成功", {
				variant: "success",
				autoHideDuration: 3000,
			});
		} catch {}
		setLoading("");
	};
	const handleCreate = async () => {
		const valid = await trigger();
		if (!valid) return;
		const { title, priority, type, deadline, cost, description } = getValues();
		const _deadline = deadline instanceof Date ? deadline : deadline.$d;
		const info: TaskInfo = {
			title,
			priority,
			type,
			deadline: _deadline.getTime(),
			cost: Number(cost),
		};
		setLoading("primary");
		try {
			const id = await createTask(
				request,
				info,
				prevTaskRef.current === null ? null : prevTaskRef.current.id,
				description === undefined ? "" : description,
			);
			window.location.replace("/task/edit?id=" + id);
		} catch {}
		setLoading("");
	};
	const handleDelete = async () => {
		setLoading("delete");
		try {
			const res = await deleteTask(request, taskID!);
			if (res !== null) {
				setDeletePrev(res);
			} else {
				enqueueSnackbar("删除成功", {
					variant: "success",
					autoHideDuration: 3000,
				});
				window.location.replace("/task/manager");
			}
		} catch {}
		setLoading("");
	};
	const handleLoadTaskList = async () => {
		setLoading("list");
		try {
			const list = await getCreatedTaskList(request);
			setCreatedTask(list);
		} catch {
			setCreatedTask([]);
		}
		setLoading("");
	};
	useEffect(() => {
		setValue("title", task?.title ?? "");
		setValue("priority", task?.priority ?? "low");
		setValue("type", task?.type ?? "homework");
		setValue("deadline", task?.deadline ? new Date(task.deadline) : new Date());
		setValue("cost", task?.cost ? task.cost.toString() : "");
		setValue("description", description ?? "");
		prevTaskRef.current = prev ?? null;
		setPrevTask(prevTaskRef.current);
	}, [task, description, prev]);
	return (
		<>
			<Paper className={classNames("p-4", className)} {...rest}>
				<div className="text-lg">基本信息</div>
				<Grid container spacing={1} className="mt-2">
					<Grid size={{ xs: 12, sm: 8 }}>
						<Controller
							name="title"
							control={control}
							defaultValue=""
							render={({ field }) => (
								<TextField
									{...field}
									variant="filled"
									label="任务名称"
									size="small"
									fullWidth
									error={!!errors.title}
									helperText={errors.title?.message}
								/>
							)}
						/>
					</Grid>
					<Grid size={{ xs: 12, sm: 4 }}>
						<Controller
							name="priority"
							control={control}
							defaultValue="low"
							render={({ field }) => (
								<FormControl fullWidth size="small" variant="filled">
									<InputLabel>优先级</InputLabel>
									<Select
										{...field}
										value={field.value}
										onChange={(e) => {
											field.onChange(e);
											trigger("priority");
										}}
									>
										<MenuItem value={"low"}>低</MenuItem>
										<MenuItem value={"medium"}>中</MenuItem>
										<MenuItem value={"high"}>高</MenuItem>
									</Select>
								</FormControl>
							)}
						/>
					</Grid>
					<Grid size={{ xs: 12, sm: 4 }}>
						<Controller
							name="type"
							control={control}
							defaultValue="homework"
							render={({ field }) => (
								<FormControl fullWidth size="small" variant="filled">
									<InputLabel>任务类型</InputLabel>
									<Select
										{...field}
										value={field.value}
										onChange={(e) => {
											field.onChange(e);
											trigger("type");
										}}
										disabled={taskID !== undefined}
									>
										<MenuItem value={"homework"}>课程作业</MenuItem>
										<MenuItem value={"review"}>考试复习</MenuItem>
										<MenuItem value={"discussion"}>研讨准备</MenuItem>
										<MenuItem value={"extra"}>竞赛拓展</MenuItem>
										<MenuItem value={"group"}>小组任务</MenuItem>
									</Select>
								</FormControl>
							)}
						/>
					</Grid>
					<Grid size={{ xs: 12, sm: 4 }}>
						<Controller
							name="deadline"
							control={control}
							defaultValue={new Date()}
							render={({ field }) => (
								<DateTimePicker
									{...field}
									value={dayjs(field.value)}
									onChange={(e) => {
										field.onChange(e);
										trigger("deadline");
									}}
									slotProps={{
										textField: {
											variant: "filled",
											label: "截止日期",
											size: "small",
											fullWidth: true,
										},
									}}
								/>
							)}
						/>
					</Grid>
					<Grid size={{ xs: 12, sm: 4 }}>
						<Controller
							name="cost"
							control={control}
							defaultValue=""
							render={({ field }) => (
								<TextField
									{...field}
									variant="filled"
									label="预计耗时"
									size="small"
									fullWidth
									error={!!errors.cost}
									helperText={errors.cost?.message}
									slotProps={{
										input: {
											endAdornment: (
												<InputAdornment position="end">分钟</InputAdornment>
											),
										},
									}}
								/>
							)}
						/>
					</Grid>
				</Grid>
				<TextField
					onClick={() => {
						setPrevTaskDialog(true);
						handleLoadTaskList();
					}}
					variant="filled"
					label="前置任务"
					size="small"
					fullWidth
					className="mt-2"
					slotProps={{
						input: {
							readOnly: true,
						},
					}}
					value={prevTask ? prevTask.info.title : ""}
					disabled={taskID !== undefined}
				/>
				<Controller
					name="description"
					control={control}
					defaultValue=""
					render={({ field }) => (
						<TextField
							{...field}
							variant="filled"
							label="任务描述"
							size="small"
							fullWidth
							multiline
							rows={4}
							className="mt-2"
						/>
					)}
				/>
				<div className="flex mt-4">
					{task ? (
						<Button
							variant="contained"
							startIcon={<Update />}
							onClick={handleUpdate}
							loading={loading === "primary"}
							disabled={loading !== ""}
						>
							更新
						</Button>
					) : (
						<Button
							variant="contained"
							startIcon={<Add />}
							onClick={handleCreate}
							loading={loading === "primary"}
							disabled={loading !== ""}
						>
							添加
						</Button>
					)}
					{task && (
						<Button
							className="ml-2"
							onClick={() => setDeleteDialog(true)}
							disabled={loading !== ""}
							loading={loading === "delete"}
						>
							删除
						</Button>
					)}
				</div>
			</Paper>
			<Dialog
				open={prevTaskDialog}
				onClose={() => setPrevTaskDialog(false)}
				fullWidth
				maxWidth="sm"
			>
				<DialogTitle>选择前置任务</DialogTitle>
				<DialogContent>
					{loading === "list" && <CircularProgress />}
					{loading === "" && createdTask.length === 0 && (
						<div>没有已创建的任务</div>
					)}
					{loading === "" &&
						createdTask.length > 0 &&
						createdTask.map((task, index) => (
							<div key={task.id}>
								{index !== 0 && <Divider />}
								<ButtonBase
									className={classNames(
										"p-2 transition-all w-full justify-start",
										{
											"hover:bg-background": prevTask?.id !== task.id,
											"bg-primary bg-opacity-20 hover:bg-opacity-30":
												prevTask?.id === task.id,
										},
									)}
									component="div"
									onClick={() => {
										prevTaskRef.current = task;
										setPrevTask(prevTaskRef.current);
									}}
								>
									<TaskItem task={task} />
								</ButtonBase>
							</div>
						))}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setPrevTaskDialog(false)}>确定</Button>
				</DialogActions>
			</Dialog>
			<Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
				<DialogTitle>删除任务</DialogTitle>
				<DialogContent>
					<div>
						确定删除任务吗？<span className="font-bold">该操作不可撤销！</span>
					</div>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeleteDialog(false)}>取消</Button>
					<Button
						onClick={() => {
							setDeleteDialog(false);
							handleDelete();
						}}
						loading={loading === "delete"}
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
		</>
	);
};

export default TaskForm;
