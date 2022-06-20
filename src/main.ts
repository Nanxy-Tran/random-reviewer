import * as core from "@actions/core";
import * as github from "@actions/github";

const main = async () => {
  const context = github.context;
  if (context.payload.pull_request == null) {
    core.setFailed("No pull request found.");
    return;
  }

  const githubToken = core.getInput("token");

  const numberReviewers = core.getInput("numberReviewers");
  const isRandomReview = core.getInput("randomReview");
  const reviewers = core.getInput("reviewers").split(".");
  const octokit = github.getOctokit(githubToken);

  if (!reviewers || reviewers.length < 1)
    throw new Error("List of reviewers is not provided !");

  const removeAuthor = (reviewers) =>
    reviewers.filter((reviewer) => reviewer !== context.actor);

  const getUnique = (array: string[]) => [...new Set([...array])];

  const randomReviewers = (reviewers, numberReviewers) => {
    reviewers = removeAuthor(reviewers);
    let result: any = [];
    if (reviewers.length < numberReviewers) return reviewers;

    while (getUnique(result).length < numberReviewers) {
      let randomReviewer =
        reviewers[Math.floor(Math.random() * reviewers.length)];
      result.push(randomReviewer);
      core.info("Picked reviewer: " + randomReviewer);
    }

    return result;
  };

  const addAuthor = async () => {
    await octokit.issues.addAssignees({
      ...context.repo,
      issue_number: context.issue.number,
      assignees: [context.actor],
    });
    core.info(`Auto assign pull request to ${context.actor} successfully ! `);
  };

  const addReviewers = async (reviewers, numberReviewers) => {
    await octokit.pulls.requestReviewers({
      ...context.repo,
      reviewers:
        isRandomReview === "true"
          ? randomReviewers(reviewers, numberReviewers)
          : removeAuthor(reviewers),
      pull_number: context.payload.pull_request?.number,
    });
    core.info(`Auto assign pull request to reviewers successfully ! `);
    core.info(`Auto assign pull request to reviewers successfully ! `);


    core.info(
      "This PR is randomly assigned: " +
        isRandomReview +
        "type of isRandom" +
        typeof isRandomReview
    );
  };

  await addAuthor();
  await addReviewers(reviewers, numberReviewers);
};

main().catch((err) => core.setFailed(err));
