import { Task, taskPriorityText, taskTypeText } from "@/entity/task";
import { DefaultProps } from "@/utils/type";
import {
	AccessAlarmOutlined,
	EmergencyOutlined,
	PersonOutlineOutlined,
	UpdateOutlined,
} from "@mui/icons-material";
import { Chip, Divider } from "@mui/material";
import dayjs from "dayjs";

interface Props extends DefaultProps {
	task: Task;
}

const TaskItem: React.FC<Props> = (props) => {
	const { task, className, ...rest } = props;
	return (
		<div {...rest} className={className}>
			<div className="flex items-center w-full">
				<Chip
					label={taskTypeText(task.info.type)}
					size="small"
					color="primary"
					className="flex-none"
				/>
				<div className="font-bold ml-2 flex-1 w-full overflow-hidden">
					<div className="truncate w-full text-ellipsis overflow-hidden pr-2">
						{task.info.title}
					</div>
				</div>
			</div>
			<div className="flex flex-wrap mt-1">
				<div className="text-xs m-1 flex items-center">
					<EmergencyOutlined className="text-sm"></EmergencyOutlined>
					<span className="ml-0.5">
						优先级：{taskPriorityText(task.info.priority)}
					</span>
				</div>
				<Divider orientation="vertical" flexItem variant="middle"></Divider>
				<div className="text-xs m-1 flex items-center">
					<AccessAlarmOutlined className="text-sm"></AccessAlarmOutlined>
					<span className="ml-0.5">
						截止日期：{dayjs(task.info.deadline).format("YYYY-MM-DD HH:mm")}
					</span>
				</div>
				<Divider orientation="vertical" flexItem variant="middle"></Divider>
				<div className="text-xs m-1 flex items-center">
					<PersonOutlineOutlined className="text-sm"></PersonOutlineOutlined>
					<span className="ml-0.5">发布者：{task.publisher.username}</span>
				</div>
				<Divider orientation="vertical" flexItem variant="middle"></Divider>
				<div className="text-xs m-1 flex items-center">
					<UpdateOutlined className="text-sm"></UpdateOutlined>
					<span className="ml-0.5">预计用时：{task.info.cost}min</span>
				</div>
			</div>
		</div>
	);
};

export default TaskItem;
