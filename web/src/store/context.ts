import { UserInfo } from "@/entity/user";
import { create } from "zustand";

interface ContextStore {
	user?: UserInfo;
	permission?: string[];
	setContext: (user: UserInfo, permission: string[]) => void;
}

export const useContextStore = create<ContextStore>((set) => ({
	user: undefined,
	setContext: (user: UserInfo, permission: string[]) => {
		set({ user, permission });
	},
}));
