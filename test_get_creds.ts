import { getProviderCredentials } from "./app/actions/admin";
async function run() {
    try {
        const res = await getProviderCredentials();
        console.log("Result:", JSON.stringify(res, null, 2));
    } catch(e) {
        console.log("Error:", e.message);
    }
}
run();
