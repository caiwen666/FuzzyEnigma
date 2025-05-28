import { Alert, Paper } from "@mui/material";
import LoginForm from "./LoginForm";
import { toValue } from "@/utils/url";
import { WithParamsProps } from "@/utils/type";

const Page: React.FC<WithParamsProps> = async (props) => {
	const searchParams = await props.searchParams;
	const callback = toValue(searchParams.callback);
	return (
		<div className={"flex my-32"}>
			<div className={"ml-auto mr-auto max-w-md w-full"}>
				{callback && (
					<Paper className={"mb-3"}>
						<Alert severity="info">访问的页面需要登录</Alert>
					</Paper>
				)}
				<Paper className={"overflow-hidden"}>
					<LoginForm callback={callback} />
				</Paper>
			</div>
		</div>
	);
};
export default Page;
