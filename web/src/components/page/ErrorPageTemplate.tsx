"use client";

import { DoNotDisturbAlt } from "@mui/icons-material";
import NormalContainter from "../NormalContainter";
import { Button } from "@mui/material";
import React from "react";

interface Props {
	title: string;
	info: string;
}

const ErrorPageTemplate: React.FC<Props> = (props) => {
	const { title, info } = props;
	return (
		<NormalContainter>
			<div className="text-title text-center pt-20">
				<DoNotDisturbAlt className="text-8xl mx-auto" />
				<div className="text-2xl mt-4">{title}</div>
				<div className="text-sm">{info}</div>
				<Button className="mt-2" onClick={() => history.back()}>
					返回
				</Button>
			</div>
		</NormalContainter>
	);
};

export default ErrorPageTemplate;
