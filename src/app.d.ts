// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare module '*.geojson' {
	const value: any;
	export default value;
}

declare module '*.geojson?raw' {
	const value: string;
	export default value;
}

declare module '*.json' {
	const value: any;
	export default value;
}

declare global {
	namespace App {
		interface Locals {
			session: { slackUserId: string; slackUserName: string; isAdmin: boolean } | null;
		}
	}
}

export {};
