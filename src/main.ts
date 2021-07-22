import * as core from '@actions/core'
import * as github from '@actions/github'
import {removeIgnoreTaskListText, createTaskListText} from './utils'

async function run(): Promise<void> {
  try {
    const body = github.context.payload.pull_request?.body

    const token = core.getInput('repo-token', {required: true})
    const githubApi = new github.GitHub(token)
    const appName = 'Task Completed Checker'

    if (!body) {
      core.info('no task list and skip the process.')
      await githubApi.checks.create({
        name: appName,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        head_sha: github.context.payload.pull_request?.head.sha,
        status: 'completed',
        conclusion: 'success',
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

    const result = removeIgnoreTaskListText(body)

    core.debug('creates a list of tasks which removed ignored task: ')
    core.debug(result)

    const isTaskCompleted = result.match(/([-*] \[[ ]\].+)/g) === null

    const text = createTaskListText(result)

    core.debug('creates a list of completed tasks and uncompleted tasks: ')
    core.debug(text)

    await githubApi.checks.create({
      name: appName,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      head_sha: github.context.payload.pull_request?.head.sha,
      status: 'completed',
      conclusion: isTaskCompleted ? 'success' : 'failure',
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    core.setFailed(error.message)
  }
}

void run()
