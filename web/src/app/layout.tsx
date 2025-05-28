import { headers } from "next/headers";
import "./globals.css";
import Wrapper from "./wrapper";
import { UserInfo } from "@/entity/user";

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const header = await headers();
	const uid = header.get("uid");
	const username = header.get("username");
	const email = header.get("email");
	const permission = JSON.parse(header.get("permission") ?? "[]");
	let user: undefined | UserInfo;
	if (uid) {
		user = {
			uid: Number(uid),
			username: username!,
			email: email!,
		};
	}
	return (
		<html>
			<body>
				<Wrapper user={user} permission={permission}>
					{children}
				</Wrapper>
			</body>
		</html>
	);
}
