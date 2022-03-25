const https = require('https');

//make this an functions
const defaultOptions = {
    hostname: '60fb78fb91156a0017b4c80c.mockapi.io',
    path: '/users/deployments',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
    },
};

const isOverDue = (buildTime) => {
    const SETTLED_MONTHS = 1;
    const OVERDUE_MILESTONE = new Date();
    OVERDUE_MILESTONE.setMonth(new Date().getMonth() - SETTLED_MONTHS);

    return buildTime.getTime() < OVERDUE_MILESTONE.getTime();
};

const filterOverdueDep = (deployment) => {
        const uploadTime = deployment?.latest_release?.upload_time ?? '';
        if (!uploadTime) return;

        const formattedReleaseTime = new Date(deployment.latest_release.upload_time);

        if (isOverDue(formattedReleaseTime)) {
            return deployment;
        }
    }


const IGNORE_BRANCH = [process.env.BRANCH_NAME];

async function getDeployments() {
    return new Promise((resolve, reject) => {
        const req = https.request(defaultOptions, (res) => {
            let body = '';
            res.on('data', function (chunk) {
                body += chunk;
            });

            res.on('end', () => {
                let releases = JSON.parse(body);
                console.log('Total deployments :', releases.length);
                resolve(
                    releases
                        .map(filterOverdueDep)
                        .filter((releaseMessage) => releaseMessage),
                );
            });
        });

        req.on('error', (error) => {
            console.error(error);
            reject([]);
        });

        req.end(() => console.log("\x1b[103m%\x1b[0m", '😤 Fetching deployments 😤...'));
    });
}

async function deleteDeployments(deployment) {
    return new Promise((resolve, reject) => {
        const delReq = https.request(
            {
                ...defaultOptions,
                method: 'DELETE',
                path: `/users/deployments/${deployment.id}`,
            },
            (res) => {
                let body = '';
                res.on('data', function (chunk) {
                    body += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve(`Successfully delete deployment name: ${deployment.name} ✅ \n`);
                    } else {
                        console.log("\x1b[41m%\x1b[0m", res.statusMessage);
                        console.log(res.statusCode);
                        reject(undefined)
                    }
                });
            },
        );

        delReq.on('error', (error) => {
            console.log(`Failed to remove deployment name: ${deployment.name}, error: ${error.message}`);
            reject(error);
        });

        delReq.end(() => console.log("\x1b[41m%\x1b[0m", `Deleting deployment name: ${deployment.name} !!!!... 🔥`));
    });
}

async function run() {
    console.log(IGNORE_BRANCH)
    const overDueDeps = await getDeployments();

    for(let i = 0; i < 5; i++) {
        const result = await deleteDeployments(overDueDeps[i]);
        console.log("\x1b[32m%\x1b[0m" , result)
    }

}

run().then(r => console.log('Process completed exit code 0') );
