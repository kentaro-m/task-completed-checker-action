import * as core from '@actions/core'
import * as github from '@actions/github'
import {removeIgnoreTaskListText, createTaskListText} from './utils'

interface simplePR {
  body?: string | null
  number: number
  head: {
    sha: string
  }
}

async function run(): Promise<void> {
  const pullRequest: simplePR | undefined = github.context.payload
    .pull_request as simplePR | undefined
  const token = core.getInput('repo-token', {required: true})
  const body = pullRequest?.body ?? ''

  if (!body) {
    await createCheckForEmptyTaskList()
    return
  }

  const githubApi = github.getOctokit(token)
  const appName = 'Task Completed Checker'

  async function main() {
    try {
      const taskList = removeIgnoreTaskListText(body)

      core.debug('Task list: ')
      core.debug(taskList)

      const allTasksAreCompleted = taskList.match(/(- \[[ ]\].+)/g) === null

      const resultText = createTaskListText(taskList)

      core.debug('Creating lists of completed and uncompleted Tasks: ')
      core.debug(resultText)

      await createResultCheck(resultText, allTasksAreCompleted)
    } catch (error) {
      core.setFailed(error?.message ?? 'Unknown error')
    }
  }

  async function createCheckForEmptyTaskList() {
    core.info('No Task was found. Skipping process.')

    const check: RestEndpointMethodTypes['checks']['create']['parameters'] = {
      name: appName,
      // eslint-disable-next-line @typescript-eslint/camelcase
      head_sha: pullRequest?.head?.sha,
      status: 'completed',
      conclusion: 'success',
      // eslint-disable-next-line @typescript-eslint/camelcase
      completed_at: new Date().toISOString(),
      output: {
        title: appName,
        summary: 'No Task',
        text: 'No Task'
      },
      ...github.context.repo
    }

    await githubApi.rest.checks.create({})
  }

  async function createResultCheck(
    checkText: string,
    allTasksAreCompleted: boolean
  ) {
    await githubApi.rest.checks.create({
      name: appName,
      // eslint-disable-next-line @typescript-eslint/camelcase
      head_sha: pullRequest?.head?.sha,
      status: 'completed',
      conclusion: allTasksAreCompleted ? 'success' : 'failure',
      // eslint-disable-next-line @typescript-eslint/camelcase
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

  main()
}

run()
