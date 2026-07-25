import { configFiles } from '../src/utils/configUtil.ts';

declare global {
  namespace Express {
        interface Console {
            serverError(module: string, error: any): void;
        }
    }
}
console.serverError = function (module: string, error: any) {
  console.error(
    `An error has occurred in module ${module} at ${new Date().toISOString()}. Error: ${error}`,
  );
};

async function test(type?: string, time?: number) {
    console.log(type, time as number);
    console.log(await configFiles.update("dab306ca-4edf-4bf3-b49a-128bc0362e2d", {"user_type": type, "time": time}));
}

await test("unlimit");