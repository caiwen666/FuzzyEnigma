export interface SearchParams {
	[key: string]: string | string[] | undefined;
}

export const toValue = (
	value: string | string[] | undefined,
): string | undefined => {
	if (Array.isArray(value)) {
		return value[0];
	}
	return value;
};
