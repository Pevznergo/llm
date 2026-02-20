const fetch = require('node-fetch');

async function test() {
    const res = await fetch("http://localhost:4000/credentials", {
        headers: {
            "Authorization": "Bearer sk-1234" // LITELLM_MASTER_KEY from env or just mock
        }
    });
    console.log(await res.text());
}
test();
