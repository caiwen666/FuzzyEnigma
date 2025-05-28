"use client";

import Appbar from "@/components/Appbar";
import theme from "@/config/theme";
import { UserInfo } from "@/entity/user";
import { useContextStore } from "@/store/context";
import { DefaultProps } from "@/utils/type";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import { SnackbarProvider } from "notistack";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { zhCN } from "@mui/x-date-pickers/locales";
import "dayjs/locale/zh-cn";

interface Props extends DefaultProps {
	user?: UserInfo;
	permission?: string[];
}

const Wrapper: React.FC<Props> = (props) => {
	const setContext = useContextStore((state) => state.setContext);
	if (props.user) {
		setContext(props.user, props.permission || []);
	}
	return (
		<AppRouterCacheProvider>
			<LocalizationProvider
				dateAdapter={AdapterDayjs}
				localeText={
					zhCN.components.MuiLocalizationProvider.defaultProps.localeText
				}
				adapterLocale={"zh-cn"}
			>
				<ThemeProvider theme={theme}>
					<SnackbarProvider maxSnack={3}>
						<Appbar></Appbar>
						<div className="mt-12 z-0 pb-16">{props.children}</div>
					</SnackbarProvider>
				</ThemeProvider>
			</LocalizationProvider>
		</AppRouterCacheProvider>
	);
};

export default Wrapper;
