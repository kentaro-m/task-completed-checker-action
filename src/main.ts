import * as core from '@actions/core'
import * as github from '@actions/github'
import {createTaskListText, removeIgnoreTaskListText} from './utils'

async function run(): Promise<void> {
  const pullRequest = github.context.payload.pull_request
  const token = core.getInput('repo-token', {required: true})
  const body = pullRequest?.body ?? ''

  if (!body) {
    await createCheckForEmptyTaskList()
    return
  }

  const githubApi = github.getOctokit(token)
  const appName = 'Task Completed Checker'

  async function main(): Promise<void> {
    try {
      const taskList = removeIgnoreTaskListText(body)

      core.debug('Task list: ')
      core.debug(taskList)

      const allTasksAreCompleted = taskList.match(/(- \[[ ]\].+)/g) === null

      const resultText = createTaskListText(taskList)

      core.debug('Creating lists of completed and uncompleted Tasks: ')
      core.debug(resultText)

      await createResultCheck(resultText, allTasksAreCompleted)
      return
    } catch (error) {
      if (error instanceof Error) core.setFailed(error.message)
    }
  }

  async function createCheckForEmptyTaskList(): Promise<void> {
    core.info('No Task was found. Skipping process.')

    await githubApi.rest.checks.create({
      name: appName,
      head_sha: pullRequest?.head?.sha,
      status: 'completed',
      conclusion: 'success',
      completed_at: new Date().toISOString(),
      output: {
        title: appName,
        summary: 'No Task',
        text: 'No Task'
      },
      ...github.context.repo
    })
  }

  async function createResultCheck(
    checkText: string,
    allTasksAreCompleted: boolean
  ): Promise<void> {
    await githubApi.rest.checks.create({
      name: appName,
      head_sha: pullRequest?.head?.sha,
      status: 'completed',
      conclusion: allTasksAreCompleted ? 'success' : 'failure',
      completed_at: new Date().toISOString(),
      output: {
        title: appName,
        summary: allTasksAreCompleted
          ? 'All tasks are completed!'
          : 'Some tasks are uncompleted!',
        text: checkText
      },
      ...github.context.repo
    })
  }

  return main()
}

run()
