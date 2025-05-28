"use client";

import { DefaultProps } from "@/utils/type";
import classNames from "classnames";
import { useEffect, useState } from "react";
import "../config/github-markdown-light.min.css";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const markdownit = require("markdown-it");
const md = markdownit();

interface Props extends DefaultProps {
	value: string;
}

const MarkdownPreview: React.FC<Props> = (props) => {
	const { value, className, ...rest } = props;
	const [html, setHtml] = useState(md.render(value));
	useEffect(() => {
		setHtml(md.render(props.value));
	}, [props.value]);
	return (
		<div
			className={classNames("markdown-body", className)}
			dangerouslySetInnerHTML={{ __html: html }}
			{...rest}
		></div>
	);
};

export default MarkdownPreview;
