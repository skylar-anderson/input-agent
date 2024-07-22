import OpenAI from 'openai';
import listCommits from "./functions/listCommits";
import listIssues from "./functions/listIssues";
import listIssueComments from "./functions/listIssueComments";
import listPullRequestsForCommit from "./functions/listPullRequestsForCommit";
import retrieveDiffFromSHA from "./functions/retrieveDiffFromSHA";
import retrieveDiffFromPullRequest from "./functions/retrieveDiffFromPullRequest";
import searchWithBing from "./functions/searchWithBing";
import readFile from "./functions/readFile";
import listPullRequests from "./functions/listPullRequests";
import getIssue from "./functions/getIssue";
import getCommit from "./functions/getCommit";
import createIssue from "./functions/createIssue";
import createIssueComment from "./functions/createIssueComment";
import updateIssue from "./functions/updateIssue";

import createPullRequestReview from "./functions/createPullRequestReview";
import analyzeImage from "./functions/analyzeImage";
import type { ChatCompletionCreateParams } from "openai/resources/chat";
export const availableFunctions = {
  analyzeImage,
  createPullRequestReview,
  createIssue,
  createIssueComment,
  updateIssue,
  getIssue,
  getCommit,
  listPullRequests,
  readFile,
  searchWithBing,
  retrieveDiffFromSHA,
  retrieveDiffFromPullRequest,
  listCommits,
  listIssues,
  listIssueComments,
  listPullRequestsForCommit,
};

export type FunctionName = keyof typeof availableFunctions;

export function selectFunctions(
  functions: FunctionName[],
): ChatCompletionCreateParams.Function[] {
  let funcs = [] as ChatCompletionCreateParams.Function[];
  functions.forEach((name) => {
    if (availableFunctions[name]) {
      funcs.push(availableFunctions[name].meta);
    }
  });
  return funcs;
}

export function selectTools(functions: FunctionName[]): OpenAI.Chat.Completions.ChatCompletionTool[] {
  let tools = [] as OpenAI.Chat.Completions.ChatCompletionTool[];
  functions.forEach((name) => {
    if (availableFunctions[name]) {
      // @ts-ignore
      tools.push({ type: "function", function: availableFunctions[name].meta });
    }
  });
  return tools;
}

export async function runFunction(name: string, args: any) {
  switch (name) {
    case "analyzeImage":
      return await analyzeImage.run(args["imageUrl"]);
    case "createPullRequestReview":
      return await createPullRequestReview.run(
        args["repository"],
        args["pullNumber"],
        args["body"],
        args["event"],
        args["comments"],
      );
    case "createIssueComment":
      return await createIssueComment.run(
        args["repository"],
        args["body"],
        args["issueNumber"],
      );
    case "createIssue":
      return await createIssue.run(
        args["repository"],
        args["title"],
        args["body"],
        args["labels"],
        args["assignees"],
      );
    case "updateIssue":
      return await updateIssue.run(
        args["repository"],
        args["issueNumber"],
        args["title"],
        args["body"],
        args["labels"],
        args["assignees"],
        args["state"],
      );
    case "readFile":
      return await readFile.run(args["repository"], args["path"]);
    case "getCommit":
      return await getCommit.run(args["repository"], args["ref"]);
    case "getIssue":
      return await getIssue.run(args["repository"], args["issue_number"]);
    case "searchWithBing":
      return await searchWithBing.run(args["query"]);
    case "retrieveDiffFromPullRequest":
      return await retrieveDiffFromPullRequest.run(
        args["repository"],
        args["pullRequestId"],
      );
    case "retrieveDiffFromSHA":
      return await retrieveDiffFromSHA.run(args["repository"], args["sha"]);
    case "listPullRequestsForCommit":
      return await listPullRequestsForCommit.run(
        args["repository"],
        args["commit_sha"],
      );
    case "listCommits":
      return await listCommits.run(
        args["repository"],
        args["path"],
        args["author"],
        args["sha"],
        args["page"],
      );
    case "listIssues":
      return await listIssues.run(
        "issue",
        args["repository"],
        args["page"],
        args["assignee"],
        args["state"],
        args["label"],
      );
    case "listPullRequests":
      return await listIssues.run(
        "pull-request",
        args["repository"],
        args["page"],
        args["assignee"],
        args["state"],
      );
    case "listIssueComments":
      return await listIssueComments.run(
        args["repository"],
        args["issue_number"],
        args["page"],
      );
    default:
      throw new Error(`Unknown function: ${name}`);
  }
}
