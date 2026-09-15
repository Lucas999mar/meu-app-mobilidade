const fs = require('fs');

async function updateProject() {
    try {
        const auth = JSON.parse(fs.readFileSync('C:/Users/lucas/AppData/Roaming/com.vercel.cli/Data/auth.json'));
        const token = auth.token;
        const projectId = "prj_zyewPsNGcc9RonWu02XF8iIYahHX";
        const teamId = "team_Tq3TugCmlY1PDkPjxLRUsveQ";

        const res = await fetch(`https://api.vercel.com/v9/projects/${projectId}?teamId=${teamId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rootDirectory: "apps/admin",
                framework: "nextjs"
            })
        });

        const data = await res.json();
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

updateProject();
