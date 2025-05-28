"use client";

import PageTitle from "@/components/PageTitle";
import ResourceItem from "@/components/ResourceItem";
import TaskItem from "@/components/TaskItem";
import UserItem from "@/components/UserItem";
import { Resource } from "@/entity/resource";
import { TaskDetail, taskPriorityText, taskTypeText } from "@/entity/task";
import { useContextStore } from "@/store/context";
import { formatRemainingTime } from "@/utils";
import {
	AccessAlarmOutlined,
	CheckOutlined,
	CloseOutlined,
	Edit,
	UpdateOutlined,
} from "@mui/icons-material";
import {
	Button,
	ButtonBase,
	Chip,
	CircularProgress,
	Divider,
	Grid,
	Paper,
} from "@mui/material";
import classNames from "classnames";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { finishTask } from "@/api/task";
import request from "@/utils/request/client";
import { enqueueSnackbar } from "notistack";
import { getRecommendResource } from "@/api/resource";

interface Props {
	task: TaskDetail;
}

const TaskDetailIndex: React.FC<Props> = (props) => {
	const { task, description, resources, myGroup, prevTask } = props.task;
	const [remainingTime, setRemainingTime] = useState(0);
	const context = useContextStore();
	const [finished, setFinished] = useState(props.task.finished);
	const [recommend, setRecommend] = useState<Resource[] | null>(null);
	const [loading, setLoading] = useState("");
	const handleFinish = async () => {
		setLoading("finish");
		try {
			await finishTask(request, task.id);
			setFinished(true);
			enqueueSnackbar("成功完成任务", {
				variant: "success",
				autoHideDuration: 3000,
			});
		} catch {}
		setLoading("");
	};
	useEffect(() => {
		const interval = () => {
			let r = task.info.deadline - new Date().getTime();
			if (r < 0) r = -1;
			setRemainingTime(r);
		};
		const getRecommend = async () => {
			try {
				const res = await getRecommendResource(request, task.id);
				setRecommend(res);
			} catch {
				setRecommend([]);
			}
		};
		const timer = setInterval(() => {
			interval();
		}, 1000);
		interval();
		getRecommend();
		return () => {
			clearInterval(timer);
		};
	}, []);
	const editable =
		context.user?.uid === task.publisher.uid ||
		context.permission?.includes("manage_all_task");
	return (
		<>
			<PageTitle
				title="任务详情"
				back
				buttons={
					editable
						? [
								{
									text: "编辑任务",
									href: `/task/edit?id=${task.id}`,
									icon: <Edit />,
								},
							]
						: undefined
				}
			/>
			<Paper className="mt-5 overflow-hidden">
				<div className="p-3">
					<UserItem user={task.publisher} />
				</div>
				<Divider />
				<div className="p-3 pb-0">
					<div className="flex items-center">
						<Chip label={taskTypeText(task.info.type)} color="primary" />
						<Chip
							label={`${taskPriorityText(task.info.priority)}优先级`}
							className={classNames("ml-2 text-white", {
								"bg-orange": task.info.priority === "high",
								"bg-indigo": task.info.priority === "medium",
								"bg-green": task.info.priority === "low",
							})}
						/>
					</div>
					<div className="p-2">
						<div className="font-bold text-2xl text-title">
							{task.info.title}
						</div>
						<div className="my-2">{description}</div>
						{prevTask && (
							<>
								<div className="mt-3 font-bold text-title">前置任务</div>
								<ButtonBase
									component="a"
									className="justify-start w-full p-2 mt-1 hover:bg-background hover:bg-opacity-75 transition-all"
									href={`/task/detail?id=${prevTask.id}`}
								>
									<TaskItem task={prevTask} />
								</ButtonBase>
							</>
						)}
					</div>
				</div>
				<Divider />
				<div className="flex p-4">
					<div>
						{remainingTime >= 0 ? (
							<div className="font-bold text-title ml-1">
								剩余 {formatRemainingTime(remainingTime)}
							</div>
						) : (
							<div className="font-bold text-red ml-1">任务已结束</div>
						)}
						<div className="flex flex-wrap">
							<div className="text-xs m-1 flex items-center">
								<AccessAlarmOutlined className="text-sm"></AccessAlarmOutlined>
								<span className="ml-0.5">
									截止日期：
									{dayjs(task.info.deadline).format("YYYY-MM-DD HH:mm")}
								</span>
							</div>
							<Divider
								orientation="vertical"
								flexItem
								variant="middle"
							></Divider>
							<div className="text-xs m-1 flex items-center">
								<UpdateOutlined className="text-sm"></UpdateOutlined>
								<span className="ml-0.5">预计用时：{task.info.cost}min</span>
							</div>
						</div>
					</div>
					{finished ? (
						<Button
							startIcon={<CheckOutlined />}
							className="self-center ml-auto"
							disabled={true}
						>
							已完成
						</Button>
					) : remainingTime > 0 ? (
						myGroup ? (
							<Button
								variant="contained"
								className="self-center ml-auto"
								onClick={handleFinish}
								disabled={loading !== ""}
								loading={loading === "finish"}
							>
								完成
							</Button>
						) : (
							<Button
								startIcon={<CloseOutlined />}
								className="self-center ml-auto"
								disabled={true}
							>
								未参加任务
							</Button>
						)
					) : (
						<Button
							startIcon={<CloseOutlined />}
							className="self-center ml-auto"
							disabled={true}
						>
							已过期
						</Button>
					)}
				</div>
			</Paper>
			{task.info.type === "group" && myGroup && (
				<Paper className="mt-2 overflow-hidden p-3">
					<div className="text-lg font-bold text-title">我的小组</div>
					<Grid container spacing={2} className="mt-3">
						{myGroup.members.map((v) => (
							<Grid size={{ xs: 12, sm: 6, md: 4 }} key={v.uid}>
								<UserItem user={v} />
							</Grid>
						))}
					</Grid>
				</Paper>
			)}
			{resources.length > 0 && (
				<>
					<Paper className="mt-2 overflow-hidden">
						<div className="text-lg font-bold text-title pt-3 px-3">
							任务资源
						</div>
						{resources.map((v, index) => (
							<div key={v.id}>
								{index !== 0 && <Divider />}
								<ResourceItem key={v.id} resource={v} />
							</div>
						))}
					</Paper>
					<Paper className="mt-2 overflow-hidden">
						<div className="text-lg font-bold text-title pt-3 px-3">
							推荐资源
						</div>
						{recommend === null ? (
							<CircularProgress className="m-4" />
						) : recommend.length === 0 ? (
							<div className="m-4">暂无推荐</div>
						) : (
							recommend.map((v, index) => (
								<div key={v.id}>
									{index !== 0 && <Divider />}
									<ResourceItem key={v.id} resource={v} />
								</div>
							))
						)}
					</Paper>
				</>
			)}
		</>
	);
};

export default TaskDetailIndex;
