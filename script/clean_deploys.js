const https = require('https');

//make this an functions
const defaultOptions = {
    hostname: '60fb78fb91156a0017b4c80c.mockapi.io',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
    },
};

const sleep = (duration = 50) => {
    return new Promise(resolve => {
        setTimeout(resolve, duration)
    })
}

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


// const IGNORE_BRANCH = [process.env.BRANCH_NAME];

 function getDeployments(app) {
     return function () {
         return new Promise((resolve, reject) => {
             const req = https.request({...defaultOptions, path: `/users/${app}`}, (res) => {
                 let body = '';
                 res.on('data', function (chunk) {
                     body += chunk;
                 });

                 res.on('end', () => {
                     try {
                         let releases = JSON.parse(body);
                         console.log(`Total deployments for ${app}:`, releases.length);
                         resolve(
                             releases
                                 .map(filterOverdueDep)
                                 .filter((deployment) => deployment),
                         );
                     } catch (err) {
                         console.error(err)
                         reject([])
                     }

                 });
             });

             req.on('error', (error) => {
                 console.error(error);
                 reject([]);
             });

             req.end(() => console.log("\x1b[46m", `Fetching deployments for ${app} 😤...`, '\x1b[0m'));
         });
     }
 }

function deleteDeployments(app) {
     return function(deployment) {
         return new Promise((resolve, reject) => {
             const delReq = https.request(
                 {
                     ...defaultOptions,
                     method: 'DELETE',
                     path: `/users/${app}/${deployment.id}`,
                 },
                 (res) => {
                     res.resume();

                     res.on('end', () => {
                         console.log(res.statusCode)
                         if (res.statusCode === 200 || res.statusCode === 204) {
                             resolve(`Successfully delete deployment name: ${app}-${deployment.name} ✅ \n`);
                         } else {
                             console.log("\x1b[41m%\x1b[0m", res.statusMessage);
                             reject(undefined)
                         }
                     });
                 },
             );

             delReq.on('error', (error) => {
                 console.log(`Failed to remove deployment name: ${deployment.name}, error: ${error.message}`);
                 reject(error);
             });

             delReq.end(() => console.log("\x1b[31m", `Deleting deployment name: ${app}-${deployment.name} !!!!... 🔥`, '\x1b[0m'));
         });
     }
}

async function run() {
     const apps = ['android', 'ios' ];

     for(let j = 0; j < apps.length; j++) {
         const overDueDeps = await getDeployments(apps[j])();
         const deletingJobs = []

         for (let i = 0; i < overDueDeps.length; i++) {
             await sleep(750)
             deletingJobs.push(deleteDeployments(apps[j])(overDueDeps[i]))
             console.log(`runtime: ${i}`)
         }
         await Promise.allSettled(deletingJobs).then(jobs => jobs.forEach(job => console.log(job.value))).catch(err => console.log(err))
     }
}

run().then(r => console.log('Process completed exit code 0') );
