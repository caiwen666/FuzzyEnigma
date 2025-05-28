"use server";

import { API_URL_LOCAL } from "@/config";
import axios from "axios";
import "server-only";

export const getServerRequest = async (token: string) => {
	const instance = axios.create({
		baseURL: API_URL_LOCAL,
		timeout: 10000,
		withCredentials: true,
	});
	instance.interceptors.request.use((config) => {
		config.headers["Authorization"] = token;
		return config;
	});
	instance.interceptors.response.use((result) => {
		const { code, msg, data } = result.data;
		if (code === 200) return data;
		return Promise.reject(msg);
	});
	return instance;
};
