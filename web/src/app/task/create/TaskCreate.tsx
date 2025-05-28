"use client";

import PageTitle from "@/components/PageTitle";
import TaskInfoForm from "../TaskInfoForm";

const TaskCreate = () => {
	return (
		<>
			<PageTitle title="创建任务" back></PageTitle>
			<TaskInfoForm className="mt-5" />
		</>
	);
};

export default TaskCreate;
