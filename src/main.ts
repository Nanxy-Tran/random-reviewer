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

  const addAuthor = async () => {
    core.info(context.actor);
    await octokit.issues.addAssignees({
      ...context.repo,
      issue_number: context.issue.number,
      assignees: [context.actor],
    });
  };

  if (!reviewers || reviewers.length < 1)
    throw new Error("List of reviewers is not provided !");

  const addReviewers = async (reviewers, numberReviewers, isRandomReview) => {
    await octokit.pulls.requestReviewers({
      ...context.repo,
      reviewers: isRandomReview
        ? randomReviewers(reviewers, numberReviewers)
        : removeAuthor(reviewers),
      pull_number: context.payload.pull_request?.number,
    });
  };

  const removeAuthor = (reviewers) =>
    reviewers.filter((reviewer) => reviewer !== context.actor);

  const randomReviewers = (reviewers, numberReviewers) => {
    reviewers = removeAuthor(reviewers);
    let result: any = [];
    while (result.length < numberReviewers)
      result.push(reviewers[Math.floor(Math.random() * reviewers.length)]);
    return result;
  };

  await addAuthor();
  await addReviewers(reviewers, numberReviewers, isRandomReview);
};

main().catch((err) => core.setFailed(err));
