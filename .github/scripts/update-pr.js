const { context, GitHub } = require('@actions/github');

async function updatePullRequest() {
    const githubToken = process.env.GITHUB_TOKEN;
    const octokit = new GitHub(githubToken);
  
    const prNumber = context.payload.pull_request.number;
    const prOwner = context.payload.repository.owner.login;
    const prRepo = context.payload.repository.name;
    const prBody = context.payload.pull_request.body;
  
    console.log(prNumber, prOwner, prRepo, prBody);
    
    const changesetUpdates = `${prBody}\nUpdate changeset information here`;
  
    await octokit.pulls.update({
      owner: prOwner,
      repo: prRepo,
      pull_number: prNumber,
      body: changesetUpdates,
    });
  
    console.log('Pull request updated with changeset information.');
  }
  
  updatePullRequest().catch(error => {
    console.error('Error updating pull request:', error);
    process.exit(1);
  });