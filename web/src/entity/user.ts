import { PERMISSIONS } from "@/config";

export interface User {
	basic_info: UserInfo;
	permission: string[];
}

export interface UserInfo {
	uid: number;
	email: string;
	username: string;
}

export interface UserDetail {
	basic_info: UserInfo;
	permission: string[];
}

export const permissionText = (permission: string): string | undefined => {
	const v = PERMISSIONS.find((v) => v.value === permission);
	if (v) {
		return v.label;
	}
	return undefined;
};
