import { Paper } from "@mui/material";
import RegisterForm from "./RegisterForm";

const Page: React.FC = async () => {
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
