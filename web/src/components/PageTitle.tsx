"use client";

import { DefaultProps } from "@/utils/type";
import { ArrowBack } from "@mui/icons-material";
import { Button, IconButton } from "@mui/material";
import classNames from "classnames";

interface PageTitleButton {
	text: string;
	icon?: React.ReactNode;
	href?: string;
}

interface Props extends DefaultProps {
	title: string;
	buttons?: PageTitleButton[];
	back?: boolean;
}

const PageTitle: React.FC<Props> = (props) => {
	const { title, buttons, back, className, ...rest } = props;
	return (
		<div className={classNames("pt-6 flex items-center", className)} {...rest}>
			{back && (
				<IconButton onClick={() => history.back()} className="mr-2">
					<ArrowBack />
				</IconButton>
			)}
			<div className="text-title text-2xl">{title}</div>
			{buttons &&
				buttons.map((button, index) => (
					<Button
						key={index}
						className="ml-4"
						startIcon={button.icon}
						href={button.href}
					>
						{button.text}
					</Button>
				))}
		</div>
	);
};

export default PageTitle;
