import { SearchParams } from "./url";

export type DefaultProps = React.HTMLAttributes<HTMLDivElement>;
export interface WithParamsProps {
	searchParams: Promise<SearchParams>;
}
