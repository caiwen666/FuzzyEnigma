import { createNEMO } from "@rescale/nemo";
import { NextRequest, NextResponse } from "next/server";
import { getServerRequest } from "./utils/request/server";
import { getUserInfo } from "./api/user";
import { match } from "path-to-regexp";

const withAuth = async (request: NextRequest) => {
	console.log("withAuth");
	const jump = new URL(
		"/user/login?callback=" + request.nextUrl.href,
		request.nextUrl.origin,
	);
	if (request.cookies.has("session")) {
		const session = request.cookies.get("session")?.value;
		if (!session) {
			return NextResponse.redirect(jump);
		}
		const r = await getServerRequest(session);
		try {
			const info = await getUserInfo(r);
			request.headers.set("uid", info.basic_info.uid.toString());
			request.headers.set("username", info.basic_info.username);
			request.headers.set("email", info.basic_info.email);
			request.headers.set("permission", JSON.stringify(info.permission));
			request.headers.set("session", session);
		} catch {
			return NextResponse.redirect(jump);
		}
	} else {
		return NextResponse.redirect(jump);
	}
};

const globalMiddleware = async (request: NextRequest) => {
	const withAuthRouter = [
		match("/", { end: true }),
		match("/task/:rest", { end: false }),
		match("/resource/:rest", { end: false }),
		match("/user/manager", { end: true }),
	];
	const pathname = request.nextUrl.pathname;
	for (const matchFunc of withAuthRouter) {
		const result = matchFunc(pathname);
		if (!!result) {
			// console.log("match", pathname);
			return await withAuth(request);
		}
	}
};

export default createNEMO(
	// {
	// 	"/((?!api|_next|favicon.ico|robots.txt|manifest.json|.*\\.(?:png|jpg|jpeg|svg|webp|ico|css|js|map|json)).*)":
	// 		[
	// 			async (request, { storage }) => {
	// 				console.log("static", request.nextUrl);
	// 				storage.set("static", true);
	// 			},
	// 		],
	// 	"/": [
	// 		async (request, { storage }) => {
	// 			if (storage.has("static")) return;
	// 			return withAuth(request);
	// 		},
	// 	],
	// 	"/task/:path*": [
	// 		async (request, { storage }) => {
	// 			if (storage.has("static")) return;
	// 			console.log("task");
	// 			return withAuth(request);
	// 		},
	// 	],
	// },
	{},
	{
		before: globalMiddleware,
	},
);
