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

  const addAuthor = async () => {
    core.info(context.actor);
    await octokit.issues.addAssignees({
      ...context.repo,
      issue_number: context.issue.number,
      assignees: [context.actor],
    });
  };

  const addReviewers = async (reviewers, numberReviewers, isRandomReview) => {
    await octokit.pulls.requestReviewers({
      ...context.repo,
      reviewers: isRandomReview
        ? randomReviewers(reviewers, numberReviewers)
        : reviewers,
      pull_number: context.payload.pull_request?.number,
    });
  };

  const randomReviewers = (reviewers, numberReviewers) => {
    const author = context.actor;
    const availableReviewers = reviewers.filter(
      (reviewer) => reviewer !== author
    );
    let result: any = [];
    while (result.length < numberReviewers)
      result.push(
        availableReviewers[
          Math.floor(Math.random() * availableReviewers.length)
        ]
      );
    return result;
  };

  await addAuthor();
  await addReviewers(reviewers, numberReviewers, isRandomReview);
};

main().catch((err) => core.setFailed(err));
