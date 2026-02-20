import fetch from "node-fetch";
async function test() {
    const res = await fetch("http://127.0.0.1:4000/model/new", {
        method: "POST",
        headers: {
            "Authorization": "Bearer sk-StartKeyWithSkAndMakeItLongEnough32Chars",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model_name: "test-credential-link",
            litellm_params: {
                model: "gpt-4o",
                api_key: "os.environ/google"
            }
        })
    });
    console.log(await res.text());
}
test();
