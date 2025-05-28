"use client";

import PageTitle from "@/components/PageTitle";
import { TaskDetail } from "@/entity/task";
import { DefaultProps } from "@/utils/type";
import { Paper, Tabs, Tab } from "@mui/material";
import { useState } from "react";
import TaskInfoForm from "../TaskInfoForm";
import TaskMemberForm from "../TaskMemberForm";
import TaskAttachmentForm from "../TaskAttachmentForm";

interface Props extends DefaultProps {
	task: TaskDetail;
}

const TaskEdit: React.FC<Props> = (props) => {
	const { task } = props;
	const [tab, setTab] = useState("info");
	return (
		<>
			<PageTitle
				title="编辑任务"
				back
				buttons={[
					{
						text: "查看任务",
						href: `/task/detail?id=${task.task.id}`,
					},
				]}
			/>
			<Paper className="mt-5 overflow-hidden">
				<Tabs
					value={tab}
					onChange={(e, v) => setTab(v)}
					// aria-label="basic tabs example"
				>
					<Tab label="基本信息" value={"info"} />
					<Tab label="任务指派" value={"member"} />
					<Tab label="任务附件" value={"attachment"} />
				</Tabs>
			</Paper>
			<TaskInfoForm
				hidden={tab !== "info"}
				className={"mt-2"}
				taskID={task.task.id}
				task={task.task.info}
				prev={task.prevTask}
				description={task.description}
			/>
			<TaskMemberForm
				hidden={tab !== "member"}
				className={"mt-2"}
				groups={task.allGroup!}
				taskId={task.task.id}
				taskType={task.task.info.type}
			/>
			<TaskAttachmentForm
				hidden={tab !== "attachment"}
				className="mt-2"
				taskID={task.task.id}
				list={task.resources}
			/>
		</>
	);
};

export default TaskEdit;
