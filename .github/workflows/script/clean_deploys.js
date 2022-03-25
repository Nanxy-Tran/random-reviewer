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
                        .map((release) => {
                            const uploadTime = release?.latest_release?.upload_time ?? '';
                            if (!uploadTime) return;

                            const formattedReleaseTime = new Date(release.latest_release.upload_time);

                            if (isOverDue(formattedReleaseTime)) {
                                return release.id;
                            }
                        })
                        .filter((releaseMessage) => releaseMessage),
                );
            });
        });

        req.on('error', (error) => {
            console.error(error);
            reject([]);
        });

        req.end(() => console.log(`Fetching deployments !!!!...`));
    });
}

async function deleteDeployments(deploymentID) {
    return new Promise((resolve, reject) => {
        const delReq = https.request(
            {
                ...defaultOptions,
                method: 'DELETE',
                path: `/users/deployments/${deploymentID}`,
            },
            (res) => {
                let body = '';
                res.on('data', function (chunk) {
                    body += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve(`Successfully delete deployment id ${deploymentID}`);
                    } else {
                        console.log(res.statusMessage);
                        console.log(res.statusCode);
                        console.log(JSON.parse(body));
                        reject(undefined)
                    }
                });
            },
        );

        delReq.on('error', (error) => {
            console.log(`Failed to remove deployment ID: ${deploymentID}, error: ${error.message}`);
            reject(error);
        });

        delReq.end(() => console.log(`Deleting deployment ID: ${deploymentID} !!!!...`));
    });
}

async function run() {
    console.log(IGNORE_BRANCH)
    const overDueDeps = await getDeployments();
    console.log(overDueDeps);

    for(let i = 0; i < 5; i++) {
        const result = await deleteDeployments(overDueDeps[i]);
        console.log(result)
    }

}

run().then(r => console.log('Process completed exit code 0') );
