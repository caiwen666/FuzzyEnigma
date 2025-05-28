import { DefaultProps } from "@/utils/type";
import UserAavatar from "./UserAvatar";
import { UserInfo } from "@/entity/user";

interface Props extends DefaultProps {
	user: UserInfo;
}

const UserItem: React.FC<Props> = (props) => {
	const { user, ...rest } = props;
	return (
		<div className="flex items-center w-full">
			<UserAavatar {...rest} username={user.username} className="flex-none" />
			<div className="ml-2 flex-1 w-full">
				<div className="font-bold w-full overflow-hidden truncate text-ellipsis pr-9">
					{user.username}
				</div>
				<div className="text-xs w-full overflow-hidden truncate text-ellipsis pr-9">
					{user.email}
				</div>
			</div>
		</div>
	);
};

export default UserItem;
