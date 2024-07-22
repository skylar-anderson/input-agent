import type { ChatCompletionCreateParams } from "openai/resources/chat";
import { retrieveDiffContents } from "../../utils/github";;
const meta: ChatCompletionCreateParams.Function = {
  name: "retrieveDiffFromPullRequest",
  description: `Retrieves the diff content for a particular pull request.`,
  parameters: {
    type: "object",
    properties: {
      repository: {
        type: "string",
        description:
          "Required. The owner and name of a repository represented as :owner/:name. Do not guess. Confirm with the user if you are unsure.",
      },
      pullRequestId: {
        type: "string",
        description: `The pull request ID to retrieve the diff from.`,
      },
    },
    required: ["repository", "pullRequestId"],
  },
};

async function run(repository: string, pullRequestId: string) {
  const [owner, repo] = repository.split("/");
  const url = `https://github.com/${owner}/${repo}/pull/${pullRequestId}.diff`;

  try {
    const diffContents = await retrieveDiffContents(url);
    return diffContents;
  } catch (error) {
    console.log("Failed to fetch diff content!");
    console.log(error);
    return "An error occured when trying to fetch diff content.";
  }
}

export default { run, meta };
