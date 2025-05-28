import { createTheme } from "@mui/material/styles";
import { zhCN } from "@mui/x-date-pickers/locales";

const theme = createTheme(
	{
		palette: {
			primary: {
				main: "#9c27b0", // 设置主色（例如：蓝色）
			},
			secondary: {
				main: "#9c27b0", // 设置副色（例如：紫色）
			},
			error: {
				main: "#f44336", // 错误颜色
			},
			warning: {
				main: "#ff9800", // 警告颜色
			},
			info: {
				main: "#2196f3", // 信息颜色
			},
			success: {
				main: "#4caf50", // 成功颜色
			},
		},
		breakpoints: {
			values: {
				xs: 0,
				sm: 640,
				md: 900,
				lg: 1200,
				xl: 1536,
			},
		},
	},
	zhCN,
);

export default theme;
