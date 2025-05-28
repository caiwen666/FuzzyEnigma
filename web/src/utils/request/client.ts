"use client";

import { API_URL_REMOTE, EnableDebugLog } from "@/config";
import axios from "axios";
import { enqueueSnackbar } from "notistack";
import "client-only";
import { getCookie } from "../cookie";
import { formatToString } from "..";

const instance = axios.create({
	baseURL: API_URL_REMOTE,
	timeout: 10000,
});

instance.interceptors.response.use(
	(result) => {
		const { code, msg, data } = result.data;
		if (code === 200) return data;
		enqueueSnackbar(msg, { variant: "error", autoHideDuration: 3000 });
		return Promise.reject(msg);
	},
	(err) => {
		const msg = "请求失败：" + formatToString(err);
		enqueueSnackbar(msg, { variant: "error", autoHideDuration: 3000 });
		if (EnableDebugLog) {
			console.error(msg);
		}
		return Promise.reject(msg);
	},
);

instance.interceptors.request.use(
	(config) => {
		config.headers["Authorization"] = getCookie("session");
		return config;
	},
	(err) => {
		const msg = "请求失败：" + formatToString(err);
		enqueueSnackbar(msg, { variant: "error", autoHideDuration: 3000 });
		if (EnableDebugLog) {
			console.error(msg);
		}
		return Promise.reject(msg);
	},
);

export default instance;
