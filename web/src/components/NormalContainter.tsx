import React from "react";
import classNames from "classnames";

/// 响应式容器
const NormalContainter: React.FC<React.HTMLAttributes<HTMLDivElement>> = (
	props,
) => {
	const { className, children, ...rest } = props;
	return (
		<div
			className={classNames("max-w-screen-lg m-auto px-2 sm:px-6", className)}
			{...rest}
		>
			{children}
		</div>
	);
};

export default NormalContainter;
