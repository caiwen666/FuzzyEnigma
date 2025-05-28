import { Paper } from "@mui/material";
import RegisterForm from "./RegisterForm";
import { SearchParams, toValue } from "@/utils/url";

interface Props {
	searchParams: Promise<SearchParams>;
}

const Page: React.FC<Props> = async (props) => {
	const searchParams = await props.searchParams;
	let preSession = toValue(searchParams.pre_session);
	// if (preSession) {
	// 	const res = await user_check_pre_session(preSession);
	// 	if (res === null) {
	// 		preSession = undefined;
	// 	}
	// }
	return (
		<div className={"flex my-32"}>
			<div className={"ml-auto mr-auto max-w-md w-full"}>
				<Paper className={"overflow-hidden"}>
					<RegisterForm />
				</Paper>
			</div>
		</div>
	);
};
export default Page;
