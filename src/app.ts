import { createApp } from "./createApp.js";
import { serverProps } from "./utils/envUtil.js";

const app = createApp();
app.listen(serverProps().port, serverProps().hostname, () => {
    console.log(`Server running at http://${serverProps().hostname}:${serverProps().port}/`);
});
