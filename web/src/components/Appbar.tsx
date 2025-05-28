"use client";

import { useEffect, useState } from "react";
import {
	Avatar,
	Divider,
	ListItemIcon,
	Menu,
	MenuItem,
	Paper,
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import "client-only";
import { WEBSITE_NAME } from "@/config";
import { useContextStore } from "@/store/context";
import {
	AssignmentOutlined,
	Logout,
	ManageAccountsOutlined,
} from "@mui/icons-material";
import UserItem from "./UserItem";
import request from "@/utils/request/client";
import { logout } from "@/api/user";
import Link from "next/link";

export default function Appbar() {
	const [isScrolled, setIsScrolled] = useState(false);
	const context = useContextStore();
	const isAdmin = context.permission?.includes("manage_user");
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);
	const handlePopMenu = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};
	const handleCloseMenu = () => {
		setAnchorEl(null);
	};
	const handleLogout = async () => {
		try {
			await logout(request);
			window.location.replace("/user/login?callback=" + window.location.href);
		} catch {}
	};
	useEffect(() => {
		const handleScroll = () => {
			if (window.scrollY > 0) {
				setIsScrolled(true);
			} else {
				setIsScrolled(false);
			}
		};
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	});
	return (
		<>
			<Paper
				className="h-12 bg-background z-50 flex text-sm fixed top-0 left-0 w-full backdrop-blur-md bg-opacity-70"
				elevation={isScrolled ? 4 : 0}
				square
			>
				<Link
					className="self-center font-bold text-lg ml-4 mr-4 text-title"
					href="/"
				>
					{WEBSITE_NAME}
				</Link>
				<IconButton
					className="ml-auto mr-2 self-center p-2"
					size="small"
					onClick={handlePopMenu}
				>
					{context.user && (
						<Avatar className={"w-6 h-6 text-sm bg-primary"}>
							{context.user.username.slice(0, 1).toUpperCase()}
						</Avatar>
					)}
					{/* <AccountCircleOutlined /> */}
				</IconButton>
			</Paper>
			{context.user && (
				<Menu
					anchorEl={anchorEl}
					open={open}
					onClose={handleCloseMenu}
					onClick={handleCloseMenu}
					slotProps={{
						paper: {
							elevation: 0,
							sx: {
								overflow: "visible",
								filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
								mt: 1.5,
								"&::before": {
									content: '""',
									display: "block",
									position: "absolute",
									top: 0,
									right: 14,
									width: 10,
									height: 10,
									bgcolor: "background.paper",
									transform: "translateY(-50%) rotate(45deg)",
									zIndex: 0,
								},
							},
						},
					}}
					transformOrigin={{ horizontal: "right", vertical: "top" }}
					anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
				>
					<MenuItem>
						<UserItem user={context.user!} />
					</MenuItem>
					<Divider />
					<MenuItem onClick={() => (window.location.href = "/task/manager")}>
						<ListItemIcon>
							<AssignmentOutlined fontSize="small" />
						</ListItemIcon>
						任务管理
					</MenuItem>
					{isAdmin && (
						<MenuItem onClick={() => (window.location.href = "/user/manager")}>
							<ListItemIcon>
								<ManageAccountsOutlined fontSize="small" />
							</ListItemIcon>
							用户管理
						</MenuItem>
					)}
					<MenuItem onClick={handleLogout}>
						<ListItemIcon>
							<Logout fontSize="small" />
						</ListItemIcon>
						退出登录
					</MenuItem>
				</Menu>
			)}
		</>
	);
}
