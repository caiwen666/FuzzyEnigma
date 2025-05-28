export const clone = <T>(obj: T) => {
	return JSON.parse(JSON.stringify(obj)) as T;
};

export const formatToString = (v: unknown) => {
	if (v === undefined) return "undefined";
	if (v instanceof Error) return v.message;
	if (typeof v === "string") return v;
	if (typeof v === "object") return JSON.stringify(v, null, 2);
	return v!.toString();
};

export const formatRemainingTime = (
	time: number,
	space = true,
): string | null => {
	if (time <= 0) return null;
	const days = Math.floor(time / (1000 * 60 * 60 * 24));
	const hours = Math.floor((time % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	const minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60));
	const seconds = Math.floor((time % (1000 * 60)) / 1000);
	if (space) {
		return `${days} 天 ${hours} 小时 ${minutes} 分钟 ${seconds} 秒`;
	} else {
		return `${days}天${hours}小时${minutes}分钟${seconds}秒`;
	}
};
