import NormalContainter from "@/components/NormalContainter";

interface Props {
	children: React.ReactNode;
}
const Layout: React.FC<Props> = (props) => {
	return <NormalContainter>{props.children}</NormalContainter>;
};
export default Layout;
