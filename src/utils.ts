export function removeIgnoreTaskListText(text: string): string {
  return text.replace(
    /<!-- ignore-task-list-start -->[\s| ]*(- \[[x| ]\] .+[\s| ]*)+<!-- ignore-task-list-end -->/g,
    ''
  )
}

export function createTaskListText(body: string): string {
  const completedTasks = body.match(/(- \[[x]\].+)/g)
  const uncompletedTasks = body.match(/(- \[[ ]\].+)/g)

  let text = ''

  if (completedTasks !== null) {
    for (let index = 0; index < completedTasks.length; index++) {
      if (index === 0) {
        text += '## :white_check_mark: Completed Tasks\n'
      }
      text += `${completedTasks[index]}\n`
    }
  }

  if (uncompletedTasks !== null) {
    for (let index = 0; index < uncompletedTasks.length; index++) {
      if (index === 0) {
        text += '## :x: Uncompleted Tasks\n'
      }
      text += `${uncompletedTasks[index]}\n`
    }
  }

  return text
}
