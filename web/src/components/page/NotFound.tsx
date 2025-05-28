"use client";

import ErrorPageTemplate from "./ErrorPageTemplate";

const NotFound = () => {
	return (
		<ErrorPageTemplate
			title="页面不存在"
			info="你访问的页面不存在，请检查网址是否有误"
		/>
	);
};

export default NotFound;
