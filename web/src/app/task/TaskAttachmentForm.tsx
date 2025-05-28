"use client";

import { AttachmentFormSchema } from "@/config/schema";
import { DefaultProps } from "@/utils/type";
import { zodResolver } from "@hookform/resolvers/zod";
import { Add } from "@mui/icons-material";
import {
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	FormControl,
	Grid,
	IconButton,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	TextField,
} from "@mui/material";
import classNames from "classnames";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import request from "@/utils/request/client";
import { createResource, deleteResource } from "@/api/resource";
import { Resource } from "@/entity/resource";
import { enqueueSnackbar } from "notistack";
import ResourceItem from "@/components/ResourceItem";

interface Props extends DefaultProps {
	taskID: number;
	list: Resource[];
}

const TaskAttachmentForm: React.FC<Props> = (props) => {
	const [loading, setLoading] = useState("");
	const { className, hidden, taskID, list, ...rest } = props;
	const {
		control,
		trigger,
		getValues,
		setValue,
		watch,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(AttachmentFormSchema),
		mode: "onChange",
	});
	const [addTagDialog, setAddTagDialog] = useState(false);
	const [tagText, setTagText] = useState("");
	const [tags, setTags] = useState<string[]>([]);
	const tagsRef = useRef(tags);
	const type = watch("type", "file");
	const fileRef = useRef<File | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [resources, setResources] = useState<Resource[]>(list);
	useEffect(() => {
		setValue("content", "");
	}, [type]);
	useEffect(() => {
		setValue("type", "file");
	}, []);
	const handleCreate = async () => {
		const valid = await trigger();
		if (!valid) return;
		const { type, name, content } = getValues();
		if (type === "file" && fileRef.current === null) {
			setValue("content", "");
			return;
		}
		setLoading("add");
		try {
			const id = await createResource(
				request,
				type,
				name,
				tagsRef.current,
				taskID,
				type === "file" ? fileRef.current! : content,
			);
			setResources((prev) => {
				const newResource: Resource = {
					id,
					name,
					type,
					tags: tagsRef.current,
					up: 0,
					down: 0,
					commentCount: 0,
				};
				return [...prev, newResource];
			});
			enqueueSnackbar("成功添加资源", {
				variant: "success",
				autoHideDuration: 3000,
			});
			setValue("name", "");
			setValue("content", "");
			tagsRef.current = [];
			setTags([]);
			fileRef.current = null;
		} catch {}
		setLoading("");
	};
	const handleDelete = async (resource_id: number) => {
		setLoading("deleteResource" + resource_id);
		try {
			await deleteResource(request, resource_id);
			enqueueSnackbar("成功删除资源", {
				variant: "success",
				autoHideDuration: 3000,
			});
			setResources((prev) => {
				return prev.filter((v) => v.id !== resource_id);
			});
		} catch {}
		setLoading("");
	};
	return (
		<div className={classNames({ hidden: hidden }, className)} {...rest}>
			<Paper className={classNames(className, "p-4")}>
				<div className="text-lg">添加附件</div>
				<div>
					<Grid container spacing={1} className="mt-2">
						<Grid size={{ xs: 12, sm: 4 }}>
							<Controller
								name="type"
								control={control}
								render={({ field }) => (
									<FormControl
										variant="filled"
										size="small"
										fullWidth
										error={!!errors.type}
									>
										<InputLabel>附件类型</InputLabel>
										<Select
											value={field.value ?? "file"}
											onChange={(e) => {
												field.onChange(e);
												trigger("type");
											}}
										>
											<MenuItem value={"file"}>文件</MenuItem>
											<MenuItem value={"link"}>链接</MenuItem>
										</Select>
									</FormControl>
								)}
							/>
						</Grid>
						<Grid size={{ xs: 12, sm: 8 }}>
							<Controller
								name="name"
								control={control}
								render={({ field }) => (
									<TextField
										variant="filled"
										label="附件名称"
										size="small"
										fullWidth
										error={!!errors.name}
										helperText={errors.name?.message}
										value={field.value ?? ""}
										onChange={(e) => {
											field.onChange(e);
											trigger("name");
										}}
									/>
								)}
							/>
						</Grid>
						<Grid size={{ xs: 12 }}>
							<Controller
								name="content"
								control={control}
								render={({ field }) => (
									<TextField
										variant="filled"
										label={type === "file" ? "文件" : "链接"}
										size="small"
										fullWidth
										error={!!errors.content}
										helperText={errors.content?.message}
										value={field.value ?? ""}
										onChange={(e) => {
											field.onChange(e);
											trigger("content");
										}}
										onClick={() => {
											if (type === "file") {
												if (fileInputRef.current) {
													fileInputRef.current.click();
												}
											}
										}}
										slotProps={{
											input: {
												readOnly: type === "file",
											},
										}}
									/>
								)}
							/>
						</Grid>
					</Grid>
				</div>
				<div className="text-lg mt-4">标签</div>
				<div className="flex flex-wrap my-1">
					{tags.map((v) => (
						<Chip
							label={v}
							key={v}
							onDelete={() => {
								tagsRef.current = tagsRef.current.filter(
									(target) => target !== v,
								);
								setTags([...tagsRef.current]);
							}}
							className="m-1"
						/>
					))}
					<IconButton
						size="small"
						className="ml-1 self-center"
						onClick={() => {
							setAddTagDialog(true);
							setTagText("");
						}}
					>
						<Add />
					</IconButton>
				</div>

				<Button
					className="flex-none self-center mt-2"
					variant="contained"
					startIcon={<Add />}
					disabled={loading !== ""}
					loading={loading === "add"}
					onClick={handleCreate}
				>
					添加
				</Button>
			</Paper>
			{resources.length > 0 && (
				<Paper className="mt-2">
					{resources.map((v, index) => (
						<div key={v.id}>
							{index !== 0 && <Divider />}
							<ResourceItem
								resource={v}
								onDelete={handleDelete}
								loading={loading}
							/>
						</div>
					))}
				</Paper>
			)}

			<Dialog open={addTagDialog} onClose={() => setAddTagDialog(false)}>
				<DialogTitle>添加标签</DialogTitle>
				<DialogContent>
					<TextField
						variant="outlined"
						label="标签名称"
						className="mt-2"
						value={tagText}
						error={
							tagText.length === 0 ||
							tags.find((v) => v == tagText) !== undefined
						}
						helperText={
							tagText.length === 0
								? "标签内容不能为空"
								: tags.find((v) => v == tagText) !== undefined
									? "标签名称已存在"
									: undefined
						}
						onChange={(e) => {
							setTagText(e.target.value);
						}}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setAddTagDialog(false)}>取消</Button>
					<Button
						onClick={() => {
							if (tagText.length === 0) return;
							if (tags.find((v) => v == tagText) !== undefined) return;
							tagsRef.current.push(tagText);
							setTags([...tagsRef.current]);
							setAddTagDialog(false);
						}}
					>
						添加
					</Button>
				</DialogActions>
			</Dialog>
			<input
				type="file"
				accept="*"
				className="hidden"
				onChange={(e) => {
					if (e.target.files && e.target.files.length > 0) {
						const file = e.target.files[0];
						setValue("content", file.name);
						fileRef.current = file;
						trigger("content");
					}
					e.target.value = "";
				}}
				ref={fileInputRef}
			/>
		</div>
	);
};

export default TaskAttachmentForm;
