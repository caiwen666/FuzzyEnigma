"use client";

import { getTimeArrange, updateTimeArrange } from "@/api/task";
import MarkdownPreview from "@/components/MarkdownPreview";
import PageTitle from "@/components/PageTitle";
import TaskItem from "@/components/TaskItem";
import { Task } from "@/entity/task";
import { getTaskStatus } from "@/utils/task";
import { DefaultProps } from "@/utils/type";
import {
	FormatLineSpacingOutlined,
	LightbulbOutlined,
	WarningAmberOutlined,
	DirectionsBikeOutlined,
	HotelOutlined,
	RefreshOutlined,
} from "@mui/icons-material";
import {
	Paper,
	Tabs,
	Tab,
	ButtonBase,
	List,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	ListSubheader,
	IconButton,
	CircularProgress,
} from "@mui/material";
import classNames from "classnames";
import dayjs from "dayjs";
import request from "@/utils/request/client";
import { useEffect, useState } from "react";
import { enqueueSnackbar } from "notistack";
import { useContextStore } from "@/store/context";

interface TaskItemOnHomeProps extends DefaultProps {
	task: Task;
	grey: boolean;
}

const TaskItemOnHome: React.FC<TaskItemOnHomeProps> = (props) => {
	const { task, className, grey, ...rest } = props;
	const deadline = task.info.deadline;
	return (
		<Paper className={classNames("overflow-hidden flex", className)} {...rest}>
			<div
				className={classNames("w-1.5 flex-none", {
					"bg-black bg-opacity-40": grey,
					"bg-red": !grey && getTaskStatus(deadline) === "red",
					"bg-orange": !grey && getTaskStatus(deadline) === "orange",
					"bg-lime": !grey && getTaskStatus(deadline) === "lime",
					"bg-green": !grey && getTaskStatus(deadline) === "green",
				})}
			></div>
			<ButtonBase
				component="a"
				href={`/task/detail?id=${task.id}`}
				className="flex-1 p-2 pl-3 w-full items-start block hover:bg-background hover:bg-opacity-75 transition-all"
			>
				<TaskItem task={task} />
			</ButtonBase>
		</Paper>
	);
};

const TaskCategories = [
	{
		name: "所有任务",
		id: "all",
		icon: <FormatLineSpacingOutlined />,
	},
	{
		name: "重要且紧急",
		id: "important_and_urgent",
		icon: <WarningAmberOutlined />,
	},
	{
		name: "重要但不紧急",
		id: "important_but_not_urgent",
		icon: <LightbulbOutlined />,
	},
	{
		name: "紧急但不重要",
		id: "urgent_but_not_important",
		icon: <DirectionsBikeOutlined />,
	},
	{
		name: "不重要且不紧急",
		id: "not_important_and_not_urgent",
		icon: <HotelOutlined />,
	},
];

interface Props extends DefaultProps {
	list: { task: Task; finish: boolean }[];
}

interface UncompletedTaskCategory {
	all: Task[];
	important_and_urgent: Task[];
	important_but_not_urgent: Task[];
	urgent_but_not_important: Task[];
	not_important_and_not_urgent: Task[];
	[index: string]: Task[];
}

export const Home: React.FC<Props> = (props) => {
	const [tab, setTab] = useState("uncompleted");
	const { list } = props;
	const uncompleted_task: UncompletedTaskCategory = {
		all: [],
		important_and_urgent: [],
		important_but_not_urgent: [],
		urgent_but_not_important: [],
		not_important_and_not_urgent: [],
	};
	const completed_task: Task[] = [];
	const expired_task: Task[] = [];
	list.forEach((item) => {
		const status = getTaskStatus(item.task.info.deadline);
		if (item.finish) {
			completed_task.push(item.task);
		} else if (status === "expired") {
			expired_task.push(item.task);
		} else {
			uncompleted_task.all.push(item.task);
			const important = item.task.info.priority === "high";
			const urgent = status === "red" || status === "orange";
			if (important && urgent) {
				uncompleted_task.important_and_urgent.push(item.task);
			}
			if (important && !urgent) {
				uncompleted_task.important_but_not_urgent.push(item.task);
			}
			if (!important && urgent) {
				uncompleted_task.urgent_but_not_important.push(item.task);
			}
			if (!important && !urgent) {
				uncompleted_task.not_important_and_not_urgent.push(item.task);
			}
		}
	});
	const [taskCategory, setTaskCategory] = useState("all");
	const [loading, setLoading] = useState("");
	const [timeArrange, setTimeArrange] = useState<{
		content: string;
		created: number;
	} | null>(null);
	const handleLoadTimeArrange = async () => {
		setLoading("ai");
		try {
			const res = await getTimeArrange(request);
			setTimeArrange(res);
		} catch {}
		setLoading("");
	};
	const handleUpdateTimeArrange = async () => {
		setLoading("ai");
		try {
			await updateTimeArrange(request);
			await handleLoadTimeArrange();
			enqueueSnackbar("更新成功", {
				variant: "success",
				autoHideDuration: 3000,
			});
		} catch {}
		setLoading("");
	};
	const context = useContextStore();
	useEffect(() => {
		if (context.permission?.includes("ai")) {
			handleLoadTimeArrange();
		}
	}, [context]);
	return (
		<>
			<PageTitle title="首页" />
			{context.permission?.includes("ai") && (
				<Paper className="mt-5 overflow-hidden p-3">
					<div className="flex items-center">
						<div className="font-bold text-title text-lg">AI 时间规划</div>
						<IconButton
							className="ml-auto"
							size="small"
							disabled={loading !== ""}
							onClick={handleUpdateTimeArrange}
						>
							<RefreshOutlined />
						</IconButton>
					</div>
					{loading === "ai" && <CircularProgress className="m-3" />}
					{loading === "" && (
						<MarkdownPreview
							value={timeArrange?.content || "暂无数据"}
							className="mt-2"
						/>
					)}
					{timeArrange && (
						<div className="text-title text-xs mt-3">
							最后生成于：
							{dayjs(timeArrange.created).format("YYYY-MM-DD HH:mm:ss")}
						</div>
					)}
				</Paper>
			)}

			<Paper
				className={classNames("overflow-hidden", {
					"mt-2": context.permission?.includes("ai"),
					"mt-5": !context.permission?.includes("ai"),
				})}
			>
				<Tabs value={tab} onChange={(e, v) => setTab(v)}>
					<Tab label="未完成" value="uncompleted" />
					<Tab label="已完成" value="completed" />
					<Tab label="已过期" value="expired" />
				</Tabs>
			</Paper>

			<div hidden={tab !== "uncompleted"}>
				<div className="mt-2 flex flex-wrap sm:flex-nowrap">
					<div className="sm:flex-1 order-2 sm:order-1 mt-2 sm:mt-0 w-full sm:w-auto">
						{uncompleted_task[taskCategory].length === 0 ? (
							<div className="p-5">暂无任务</div>
						) : (
							uncompleted_task[taskCategory].map((item, index) => (
								<div
									key={index}
									className={classNames({ "mt-2": index !== 0 })}
								>
									<TaskItemOnHome key={item.id} task={item} grey={false} />
								</div>
							))
						)}
					</div>
					<div className="w-full flex-none sm:w-64 order-1 sm:ml-2 sm:order-2">
						<Paper className="overflow-hidden ">
							<List
								subheader={
									<ListSubheader component="div">任务分类</ListSubheader>
								}
							>
								{TaskCategories.map((item, index) => (
									<ListItemButton
										key={index}
										selected={taskCategory === item.id}
										onClick={() => setTaskCategory(item.id)}
									>
										<ListItemIcon
											className={classNames({
												"text-primary": taskCategory == item.id,
											})}
										>
											{item.icon}
										</ListItemIcon>
										<ListItemText
											primary={item.name}
											className={classNames({
												"text-primary": taskCategory == item.id,
											})}
										/>
									</ListItemButton>
								))}
							</List>
						</Paper>
					</div>
				</div>
			</div>
			<div hidden={tab !== "completed"} className="mt-2">
				{completed_task.length === 0 ? (
					<div className="p-5">暂无任务</div>
				) : (
					completed_task.map((item, index) => (
						<div key={index} className={classNames({ "mt-2": index !== 0 })}>
							<TaskItemOnHome task={item} grey={true} />
						</div>
					))
				)}
			</div>
			<div hidden={tab !== "expired"} className="mt-2">
				{expired_task.length === 0 ? (
					<div className="p-5">暂无任务</div>
				) : (
					expired_task.map((item, index) => (
						<div key={index} className={classNames({ "mt-2": index !== 0 })}>
							<TaskItemOnHome task={item} grey={true} />
						</div>
					))
				)}
			</div>
		</>
	);
};

export default Home;
