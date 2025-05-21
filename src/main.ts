import * as core from '@actions/core'
import * as github from '@actions/github'
import {removeIgnoreTaskLitsText, createTaskListText, hasTaskList} from './utils'

async function run(): Promise<void> {
  try {
    const body = github.context.payload.pull_request?.body

    const token = core.getInput('repo-token', {required: true})
    const githubApi = github.getOctokit(token)
    const appName = 'Task Completed Checker'

    if (!body || !hasTaskList(body)) {
      core.info('no task list and skip the process.')
      await githubApi.rest.checks.create({
        name: appName,
        // eslint-disable-next-line @typescript-eslint/camelcase
        head_sha: github.context.payload.pull_request?.head.sha,
        status: 'completed',
        conclusion: 'success',
        // eslint-disable-next-line @typescript-eslint/camelcase
        completed_at: new Date().toISOString(),
        output: {
          title: appName,
          summary: 'No task list',
          text: 'No task list'
        },
        owner: github.context.repo.owner,
        repo: github.context.repo.repo
      })
      return
    }

    const result = removeIgnoreTaskLitsText(body)

    core.debug('creates a list of tasks which removed ignored task: ')
    core.debug(result)

    const isTaskCompleted = result.match(/(- \[[ ]\].+)/g) === null

    const text = createTaskListText(result)

    core.debug('creates a list of completed tasks and uncompleted tasks: ')
    core.debug(text)

    await githubApi.rest.checks.create({
      name: appName,
      // eslint-disable-next-line @typescript-eslint/camelcase
      head_sha: github.context.payload.pull_request?.head.sha,
      status: 'completed',
      conclusion: isTaskCompleted ? 'success' : 'failure',
      // eslint-disable-next-line @typescript-eslint/camelcase
      completed_at: new Date().toISOString(),
      output: {
        title: appName,
        summary: isTaskCompleted
          ? 'All tasks are completed!'
          : 'Some tasks are uncompleted!',
        text
      },
      owner: github.context.repo.owner,
      repo: github.context.repo.repo
    })
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

run()
