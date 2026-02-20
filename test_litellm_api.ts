import { litellmFetch } from "./lib/litellm";

async function test() {
    try {
        const res = await litellmFetch("/credential/list");
        console.log("Credentials:", res);
    } catch (e) {
        console.error("Failed /credential/list", e.message);
    }
}
test();
