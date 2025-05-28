"use client";

import { deleteUser, updateUserPermission } from "@/api/user";
import PageTitle from "@/components/PageTitle";
import { permissionText, UserInfo } from "@/entity/user";
import { DeleteOutlined, EditOutlined } from "@mui/icons-material";
import {
	TableContainer,
	Paper,
	Table,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
	Chip,
	Checkbox,
	IconButton,
	Button,
	ButtonGroup,
	Tooltip,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	DialogActions,
	Autocomplete,
	TextField,
} from "@mui/material";
import React, { useState } from "react";
import request from "@/utils/request/client";
import { enqueueSnackbar } from "notistack";
import { PERMISSIONS } from "@/config";
import { useContextStore } from "@/store/context";

type ListItem = { info: UserInfo; permissions: string[] };

interface Props {
	list: ListItem[];
}

const UserManager: React.FC<Props> = (props) => {
	const [list, setList] = useState(props.list);
	const [selected, setSelected] = useState<ListItem[]>([]);
	const [singleDelete, setSingleDelete] = useState<ListItem | null>(null);
	const [deleteDialog, setDeleteDialog] = useState(false);
	const [singleRole, setSingleRole] = useState<ListItem | null>(null);
	const [loading, setLoading] = useState("");
	const [tags, setTags] = useState<string[]>([]);
	const context = useContextStore();
	return (
		<>
			<PageTitle title="用户管理" back />
			<ButtonGroup variant="contained" className="mt-5">
				<Button
					startIcon={<DeleteOutlined />}
					onClick={() => {
						if (selected.length === 0) return;
						setDeleteDialog(true);
					}}
				>
					删除
				</Button>
			</ButtonGroup>
			<TableContainer component={Paper} className="mt-2">
				<Table>
					<TableHead>
						<TableRow>
							<TableCell padding="checkbox">
								<Checkbox
									indeterminate={
										selected.length > 0 && selected.length !== list.length
									}
									checked={
										selected.length > 0 && selected.length == list.length
									}
									onChange={() => {
										if (selected.length === list.length) {
											setSelected([]);
										} else {
											const newSelected = [];
											for (const v of list) {
												newSelected.push(v);
											}
											setSelected(newSelected);
										}
									}}
								/>
							</TableCell>
							<TableCell>UID</TableCell>
							<TableCell>用户名</TableCell>
							<TableCell>电子邮箱</TableCell>
							<TableCell>权限</TableCell>
							<TableCell align="right">操作</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{list.map((item) => {
							const uid = item.info.uid;
							const isSelected =
								selected.find((v) => v.info.uid === uid) !== undefined;
							return (
								<TableRow key={item.info.uid}>
									<TableCell padding="checkbox">
										<Checkbox
											checked={isSelected}
											onChange={() => {
												if (isSelected) {
													setSelected(
														selected.filter((v) => v.info.uid !== uid),
													);
												} else {
													setSelected([...selected, item]);
												}
											}}
										/>
									</TableCell>
									<TableCell>{uid}</TableCell>
									<TableCell>{item.info.username}</TableCell>
									<TableCell>{item.info.email}</TableCell>
									<TableCell className="max-w-32">
										<div className="flex flex-wrap">
											{item.permissions.map((permission) => (
												<Tooltip
													title={permissionText(permission)}
													key={permission}
												>
													<Chip
														size="small"
														label={permission}
														className="m-1"
													/>
												</Tooltip>
											))}
										</div>
									</TableCell>
									<TableCell align="right">
										{context.permission?.includes("root") && (
											<IconButton
												size="small"
												onClick={() => {
													setSingleRole(item);
													setTags(item.permissions);
												}}
											>
												<EditOutlined />
											</IconButton>
										)}
										{context.user?.uid !== uid && (
											<IconButton
												size="small"
												onClick={() => setSingleDelete(item)}
											>
												<DeleteOutlined />
											</IconButton>
										)}
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</TableContainer>
			<Dialog
				open={singleDelete !== null}
				onClose={() => setSingleDelete(null)}
			>
				<DialogTitle>删除用户</DialogTitle>
				<DialogContent>
					<DialogContentText>
						确定要删除该用户吗？该操作不可逆
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button
						disabled={loading !== ""}
						onClick={() => {
							setSingleDelete(null);
						}}
					>
						取消
					</Button>
					<Button
						disabled={loading !== ""}
						loading={loading === "delete" + singleDelete?.info.uid}
						onClick={async () => {
							const target = singleDelete!.info.uid;
							setLoading("delete" + target);
							try {
								await deleteUser(request, target);
								setList(list.filter((v) => v.info.uid !== target));
								enqueueSnackbar("删除成功", {
									variant: "success",
									autoHideDuration: 3000,
								});
							} catch {}
							setLoading("");
							setSingleDelete(null);
						}}
					>
						删除
					</Button>
				</DialogActions>
			</Dialog>
			<Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
				<DialogTitle>删除用户</DialogTitle>
				<DialogContent>
					<DialogContentText>
						确定要删除这 {selected.length} 个用户吗？该操作不可逆
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button
						disabled={loading !== ""}
						onClick={() => {
							setDeleteDialog(false);
						}}
					>
						取消
					</Button>
					<Button
						disabled={loading !== ""}
						loading={loading === "delete_all"}
						onClick={async () => {
							setLoading("delete_all");
							const ok: number[] = [];
							try {
								for (const item of selected) {
									const target = item.info.uid;
									await deleteUser(request, target);
									ok.push(target);
								}
								enqueueSnackbar("删除成功", {
									variant: "success",
									autoHideDuration: 3000,
								});
							} catch {}
							setList(list.filter((v) => !ok.includes(v.info.uid)));
							setLoading("");
							setDeleteDialog(false);
						}}
					>
						删除
					</Button>
				</DialogActions>
			</Dialog>
			<Dialog
				open={singleRole !== null}
				onClose={() => setSingleRole(null)}
				fullWidth
				maxWidth="sm"
			>
				<DialogTitle>设置权限</DialogTitle>
				<DialogContent>
					<Autocomplete
						className="mt-2"
						multiple
						value={tags}
						onChange={(event, newValue) => {
							setTags([...newValue]);
						}}
						options={PERMISSIONS.map((v) => v.value)}
						renderValue={(values, getItemProps) =>
							values.map((option, index) => {
								const { key, ...itemProps } = getItemProps({ index });
								return <Chip key={key} label={option} {...itemProps} />;
							})
						}
						renderInput={(params) => (
							<TextField {...params} label="权限" fullWidth />
						)}
					/>
				</DialogContent>
				<DialogActions>
					<Button
						disabled={loading !== ""}
						onClick={() => {
							setSingleRole(null);
						}}
					>
						取消
					</Button>
					<Button
						disabled={loading !== ""}
						loading={loading === "update"}
						onClick={async () => {
							const target = singleRole!.info.uid;
							setLoading("update");
							try {
								await updateUserPermission(request, target, tags);
								setList(
									list.map((v) => {
										if (v.info.uid === target) {
											return { ...v, permissions: tags };
										}
										return v;
									}),
								);
								enqueueSnackbar("修改成功", {
									variant: "success",
									autoHideDuration: 3000,
								});
								setSingleRole(null);
							} catch {}
							setLoading("");
						}}
					>
						应用
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default UserManager;
