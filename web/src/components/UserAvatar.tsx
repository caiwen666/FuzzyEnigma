import { DefaultProps } from "@/utils/type";
import { Avatar } from "@mui/material";
import classNames from "classnames";

interface Props extends DefaultProps {
	username: string;
}

const UserAavatar: React.FC<Props> = (props) => {
	const { username, className, ...rest } = props;
	return (
		<Avatar
			{...rest}
			className={classNames("bg-primary text-white", className)}
		>
			{username.slice(0, 1).toUpperCase()}
		</Avatar>
	);
};

export default UserAavatar;
