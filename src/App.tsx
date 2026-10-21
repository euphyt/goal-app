import { useEffect, useState } from 'react'
import {
  Layers,
  Compass,
  CircleCheck,
  ListChecks,
  CalendarDays,
  Sun,
  Moon,
  NotebookPen,
  BookOpen,
  Bell,
  ChevronDown,
  ArrowUpRight,
  ArrowLeft,
  Dumbbell,
  Sparkles,
  Brain,
  Heart,
  PartyPopper,
} from 'lucide-react'
import './App.css'
type Theme =
  | 'light'
  | 'dark'
  | 'earthy'
  | 'nature'
  | 'sunshine'
  | 'blue-sky'
  | 'ocean'

type Page =
  | 'home'
  | 'priorities'
  | 'daily'
  | 'weekly'
  | 'wins'
  | 'win-entry'
  | 'calendar'
  | 'notes'
  | 'reminders'
  | 'books'
  | 'profile'

type TextSize = 'standard' | 'large'
type TaskKind = 'daily' | 'weekly'
type WinCategory = 'Physical' | 'Spiritual' | 'Mental' | 'Soul'

type Goal = {
  id: string
  title: string
  months: number
  target: string
  milestones: string[]
  scheduled: boolean
}

type Task = {
  id: string
  text: string
  period: string
  completed: boolean
  goalId?: string
  milestoneIndex?: number

}

type Win = {
  id: string
  category: WinCategory
  text: string
  date: string
}

type CalendarEvent = {
  id: string
  title: string
  date: string
  time: string
}

type Note = {
  id: string
  body: string
}

type Reminder = {
  id: string
  text: string
  due: string
  completed: boolean
}

type Book = {
  id: string
  title: string
  author: string
  status: 'reading' | 'wishlist'
}

const winCategories: WinCategory[] = [
  'Physical',
  'Spiritual',
  'Mental',
  'Soul',
]

const categoryIcons = {
  Physical: Dumbbell,
  Spiritual: Sparkles,
  Mental: Brain,
  Soul: Heart,
}

function dateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function shortDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function fullDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
}

function mondayOf(date: Date) {
  const result = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  )

  result.setDate(
    result.getDate() - ((result.getDay() + 6) % 7)
  )

  return result
}

function TaskList({
  tasks,
  onToggle,
  onRemove,
  goals = [],
}: {
  tasks: Task[]
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  goals?: Goal[]
}) {
  return (
    <>
      <p className="task-count" aria-live="polite">
        {tasks.filter((task) => task.completed).length}
        {' of '}
        {tasks.length} completed
      </p>

      {tasks.length === 0 && (
        <p className="empty-message">No tasks added yet.</p>
      )}

      <ul className="task-list">
        {tasks.map((task) => (
          <li key={task.id} className="task-row">
            <label className="task-label">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => onToggle(task.id)}
              />
<span>
  <span className={task.completed ? 'completed' : ''}>
    {task.text}
  </span>

  {task.goalId && (
    <small className="task-goal-label">
      {goals.find((goal) => goal.id === task.goalId)?.title}
    </small>
  )}
</span>
            </label>

            <button
              type="button"
              className="text-button"
              aria-label={`Remove ${task.text}`}
              onClick={() => onRemove(task.id)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}

function App() {
  // Navigation
  const [page, setPage] = useState<Page>('home')
  const [showAddForm, setShowAddForm] = useState(false)
  const [navVisible, setNavVisible] = useState(true)
  const [navHovered, setNavHovered] = useState(false)

  // Clock
  const [now, setNow] = useState(() => new Date())

  // Profile and appearance
  const [userName, setUserName] = useState('Euphy')
  const [profileName, setProfileName] = useState('Euphy')
  const [profileBio, setProfileBio] = useState('')
  const [savedBio, setSavedBio] = useState('')
  const [profileMessage, setProfileMessage] = useState('')
  const [theme, setTheme] = useState<Theme>('light')
  const [textSize, setTextSize] = useState<TextSize>('standard')
  const [reminderAlerts, setReminderAlerts] = useState(true)

  // Priorities
  const [planningTab, setPlanningTab] = useState<
    'priorities' | 'goals'
  >('priorities')
  const [priorities, setPriorities] = useState<string[]>([])
  const [newPriority, setNewPriority] = useState('')
  const [priorityError, setPriorityError] = useState('')
  const [editingPriority, setEditingPriority] = useState<
    string | null
  >(null)
  const [priorityEditText, setPriorityEditText] = useState('')

  // Goals
  const [goals, setGoals] = useState<Goal[]>([])
  const [goalTitle, setGoalTitle] = useState('')
  const [goalMonths, setGoalMonths] = useState(3)
  const [goalMilestones, setGoalMilestones] = useState('')
  const [activeGoal, setActiveGoal] = useState<string | null>(null)

// Add these three states here:
const [reviewGoalId, setReviewGoalId] = useState<string | null>(null)
const [plannedTasks, setPlannedTasks] = useState<Task[]>([])
const [planMessage, setPlanMessage] = useState('')

  // Tasks
  const [dailyTasks, setDailyTasks] = useState<Task[]>([])
  const [weeklyTasks, setWeeklyTasks] = useState<Task[]>([])
  const [newDailyTask, setNewDailyTask] = useState('')
  const [newWeeklyTask, setNewWeeklyTask] = useState('')
  const [weekOffset, setWeekOffset] = useState(0)

  // Daily wins
  const [selectedCategory, setSelectedCategory] =
    useState<WinCategory>('Physical')
  const [wins, setWins] = useState<Win[]>([])
  const [newWin, setNewWin] = useState('')
  const [winFormOpen, setWinFormOpen] = useState(false)
  const [celebration, setCelebration] = useState(0)

  // Calendar
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  )
  const [selectedDate, setSelectedDate] = useState(
    () => dateKey(new Date())
  )
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [eventTitle, setEventTitle] = useState('')
  const [eventTime, setEventTime] = useState('')

  // Notes
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNoteId, setSelectedNoteId] = useState<
    string | null
  >(null)

  // Reminders
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [reminderText, setReminderText] = useState('')
  const [reminderDue, setReminderDue] = useState('')

  // Books
  const [books, setBooks] = useState<Book[]>([])
  const [bookTitle, setBookTitle] = useState('')
  const [bookAuthor, setBookAuthor] = useState('')
  const [bookStatus, setBookStatus] =
    useState<Book['status']>('reading')

  // Update the clock.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  // Apply light or night mode.
  useEffect(() => {
    document.documentElement.dataset.theme = theme

    return () => {
      delete document.documentElement.dataset.theme
    }
  }, [theme])

  // Clear the celebration after a short moment.
  useEffect(() => {
    if (!celebration) return

    const timer = window.setTimeout(() => {
      setCelebration(0)
    }, 3000)

    return () => window.clearTimeout(timer)
  }, [celebration])

  // Floating navigation behavior.
  useEffect(() => {
    let hideTimer: number | undefined
    let previousScrollY = window.scrollY

    function clearHideTimer() {
      if (hideTimer !== undefined) {
        window.clearTimeout(hideTimer)
      }
    }

    function navigationIsInUse() {
      const nav = document.querySelector('.floating-nav')

      return Boolean(
        navHovered ||
          nav?.contains(document.activeElement) ||
          nav?.querySelector('details[open]')
      )
    }

    function scheduleHide() {
      clearHideTimer()

      hideTimer = window.setTimeout(() => {
        if (navigationIsInUse()) {
          scheduleHide()
        } else {
          setNavVisible(false)
        }
      }, 2500)
    }

    function revealNavigation() {
      setNavVisible(true)
      scheduleHide()
    }

    function handleHomeScroll() {
      setNavVisible(
        window.scrollY <= 20 || navigationIsInUse()
      )
    }

    function handleInnerScroll() {
      const currentScrollY = window.scrollY

      if (currentScrollY < previousScrollY) {
        revealNavigation()
      } else if (
        currentScrollY > previousScrollY &&
        !navigationIsInUse()
      ) {
        clearHideTimer()
        setNavVisible(false)
      }

      previousScrollY = currentScrollY
    }

    function handlePointerMove(event: PointerEvent) {
      if (
        event.pointerType === 'mouse' &&
        event.clientY <= 90
      ) {
        revealNavigation()
      }
    }

    if (page === 'home') {
      handleHomeScroll()

      window.addEventListener('scroll', handleHomeScroll, {
        passive: true,
      })

      return () => {
        window.removeEventListener('scroll', handleHomeScroll)
      }
    }

    if (navHovered) {
      setNavVisible(true)
    } else {
      scheduleHide()
    }

    window.addEventListener('scroll', handleInnerScroll, {
      passive: true,
    })
    window.addEventListener('pointermove', handlePointerMove)

    return () => {
      clearHideTimer()
      window.removeEventListener('scroll', handleInnerScroll)
      window.removeEventListener('pointermove', handlePointerMove)
    }
  }, [page, navHovered])

  // Dates and derived lists
  const hour = now.getHours()

  const greeting =
    hour < 12
      ? 'Good morning'
      : hour < 17
        ? 'Good afternoon'
        : 'Good evening'

  const date = fullDate(now)
  const todayKey = dateKey(now)

  const dayName = now.toLocaleDateString('en-US', {
    weekday: 'long',
  })

  const currentMonday = mondayOf(now)
  const currentWeekKey = dateKey(currentMonday)
  const currentSunday = new Date(currentMonday)
  currentSunday.setDate(currentSunday.getDate() + 6)

  const monday = new Date(currentMonday)
  monday.setDate(monday.getDate() + weekOffset * 7)

  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)

  const weekKey = dateKey(monday)
  const weekRange = `${shortDate(monday)} - ${shortDate(sunday)}`
  const currentWeekRange =
    `${shortDate(currentMonday)} - ${shortDate(currentSunday)}`

  const todaysTasks = dailyTasks.filter(
    (task) => task.period === todayKey
  )

  const thisWeeksTasks = weeklyTasks.filter(
    (task) => task.period === weekKey
  )

  const categoryWins = wins.filter(
    (win) => win.category === selectedCategory
  )

  const selectedNote = notes.find(
    (note) => note.id === selectedNoteId
  )

  const dueReminders = reminders.filter(
    (reminder) =>
      !reminder.completed &&
      new Date(reminder.due).getTime() <= now.getTime()
  )

  const monthYear = calendarMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const daysInMonth = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth() + 1,
    0
  ).getDate()

  const firstDayOffset = (calendarMonth.getDay() + 6) % 7

  const selectedEvents = events
    .filter((event) => event.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time))

  const selectedDateTasks = dailyTasks.filter(
    (task) => task.period === selectedDate
  )

  const homeCards = [
    {
      page: 'priorities' as const,
      title: 'Priorities',
      description: 'Make space for what matters this season.',
      detail: `${priorities.length} season priorities`,
      icon: Compass,
    },
    {
      page: 'daily' as const,
      title: `To Do ${dayName}`,
      description: 'A little focus for the day ahead.',
      detail: `${
        todaysTasks.filter((task) => !task.completed).length
      } tasks remaining`,
      icon: CircleCheck,
    },
    {
      page: 'weekly' as const,
      title: 'To Do Weekly',
      description: 'Give your week a thoughtful direction.',
      detail: currentWeekRange,
      icon: ListChecks,
    },
    {
      page: 'calendar' as const,
      title: 'Calendar',
      description: 'See your plans, with room to breathe.',
      detail: `${
        events.filter((event) => event.date === todayKey).length
      } plans today`,
      icon: CalendarDays,
    },
    {
      page: 'wins' as const,
      title: 'Daily Wins',
      description: 'Notice the good, however small.',
      detail: 'Your reflection space',
      icon: Sun,
    },
    {
      page: 'notes' as const,
      title: 'Notes',
      description: 'Keep the thoughts worth returning to.',
      detail: `${notes.length} personal notes`,
      icon: NotebookPen,
    },
    {
      page: 'books' as const,
      title: 'Books',
      description: 'Make time for a new perspective.',
      detail: `${
        books.filter((book) => book.status === 'reading').length
      } books in progress`,
      icon: BookOpen,
    },
    {
      page: 'reminders' as const,
      title: 'Reminders',
      description: 'Let the small things find their time.',
      detail: `${
        reminders.filter(
          (reminder) =>
            !reminder.completed &&
            new Date(reminder.due).getTime() > now.getTime()
        ).length
      } upcoming reminders`,
      icon: Bell,
    },
  ]

  // Navigation actions
  function navigate(nextPage: Page) {
    document
      .querySelectorAll<HTMLDetailsElement>('.nav-dropdown')
      .forEach((dropdown) => {
        dropdown.open = false
      })

    const nav = document.querySelector('.floating-nav')
    const focusedElement = document.activeElement

    if (
      focusedElement instanceof HTMLElement &&
      nav?.contains(focusedElement)
    ) {
      focusedElement.blur()
    }

    setPage(nextPage)
    setShowAddForm(false)
    setEditingPriority(null)
    setPriorityError('')
    setNewWin('')
    setWinFormOpen(false)
    setCelebration(0)
    setNavHovered(false)
    setNavVisible(nextPage === 'home')

    if (nextPage === 'profile') {
      setProfileName(userName)
      setProfileBio(savedBio)
      setProfileMessage('')
    }

    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  // Priority actions
  function addPriority() {
    const text = newPriority.trim()
    if (!text) return

    const alreadyExists = priorities.some(
      (priority) => priority.toLowerCase() === text.toLowerCase()
    )

    if (alreadyExists) {
      setPriorityError('This priority is already in your list.')
      return
    }

    setPriorities((current) => [...current, text])
    setNewPriority('')
    setPriorityError('')
    setShowAddForm(false)
  }

  function savePriorityEdit(original: string) {
    const text = priorityEditText.trim()
    if (!text) return

    const alreadyExists = priorities.some(
      (priority) =>
        priority !== original &&
        priority.toLowerCase() === text.toLowerCase()
    )

    if (alreadyExists) {
      setPriorityError('Another priority already has this name.')
      return
    }

    setPriorities((current) =>
      current.map((priority) =>
        priority === original ? text : priority
      )
    )

    setEditingPriority(null)
    setPriorityError('')
  }

  // Goal actions
  function addGoal() {
    const title = goalTitle.trim()
    if (!title) return

    const target = new Date(now)
    const originalDay = target.getDate()

    target.setDate(1)
    target.setMonth(target.getMonth() + goalMonths)

    const lastDay = new Date(
      target.getFullYear(),
      target.getMonth() + 1,
      0
    ).getDate()

    target.setDate(Math.min(originalDay, lastDay))

    const goal: Goal = {
      id: crypto.randomUUID(),
      title,
      months: goalMonths,
      target: dateKey(target),
      milestones: goalMilestones
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      scheduled: false,
    }

    setGoals((current) => [...current, goal])
    setActiveGoal(goal.id)
    setGoalTitle('')
    setGoalMilestones('')
    setShowAddForm(false)
  }function scheduleGoal(goal: Goal) {
  setPlanMessage('')
  setReviewGoalId(null)
  setPlannedTasks([])

  if (goal.milestones.length === 0) {
    setPlanMessage('Add at least one milestone first.')
    return
  }

  if (goal.milestones.some((step) => !step.trim())) {
    setPlanMessage('Please finish writing each milestone first.')
    return
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const target = new Date(`${goal.target}T12:00:00`)

  if (Number.isNaN(target.getTime())) {
    setPlanMessage('This goal needs a valid target date.')
    return
  }

  if (target < today) {
    setPlanMessage(
      'This goal’s target date has passed. Create a goal with a future target date.'
    )
    return
  }

  const firstMonday = mondayOf(today)
  const lastMonday = mondayOf(target)

  function dayNumber(value: Date) {
    return (
      Date.UTC(
        value.getFullYear(),
        value.getMonth(),
        value.getDate()
      ) / 86400000
    )
  }

  const weeksAvailable = Math.max(
    0,
    Math.round(
      (dayNumber(lastMonday) - dayNumber(firstMonday)) / 7
    )
  )

  const suggestions: Task[] = []

  goal.milestones.forEach((milestone, index) => {
    const alreadyAdded = weeklyTasks.some(
      (task) =>
        task.goalId === goal.id &&
        task.milestoneIndex === index
    )

    if (alreadyAdded) return

    const week = new Date(firstMonday)

    const weekOffset =
      goal.milestones.length === 1
        ? 0
        : Math.floor(
            (index * weeksAvailable) /
              (goal.milestones.length - 1)
          )

    week.setDate(week.getDate() + weekOffset * 7)

    suggestions.push({
      id: crypto.randomUUID(),
      text: milestone.trim(),
      period: dateKey(week),
      completed: false,
      goalId: goal.id,
      milestoneIndex: index,
    })
  })

  if (suggestions.length === 0) {
    setPlanMessage(
      'All milestones are already in your weekly plan.'
    )
    return
  }

  setPlannedTasks(suggestions)
  setReviewGoalId(goal.id)

    const lastWeek = Math.max(
      0,
      Math.round(
        (dayNumber(lastMonday) - dayNumber(firstMonday)) / 7
      )
    )

    const tasks: Task[] = goal.milestones.map((text, index) => {
      const taskDate = new Date(firstMonday)

      const offset =
        goal.milestones.length === 1
          ? 0
          : Math.floor(
              (index * lastWeek) / (goal.milestones.length - 1)
            )

      taskDate.setDate(taskDate.getDate() + offset * 7)

      return {
        id: crypto.randomUUID(),
        text,
        period: dateKey(taskDate),
        completed: false,
        goalId: goal.id,
      }
    })

    setWeeklyTasks((current) => [...current, ...tasks])

    setGoals((current) =>
      current.map((item) =>
        item.id === goal.id
          ? { ...item, scheduled: true }
          : item
      )
    )
    
  }
function acceptGoalPlan() {
  if (!reviewGoalId) return

  setWeeklyTasks((current) => {
    const additions = plannedTasks.filter(
      (planned) =>
        !current.some(
          (task) =>
            task.goalId === planned.goalId &&
            task.milestoneIndex === planned.milestoneIndex
        )
    )

    return [...current, ...additions]
  })

  setGoals((current) =>
    current.map((goal) =>
      goal.id === reviewGoalId
        ? { ...goal, scheduled: true }
        : goal
    )
  )

  setReviewGoalId(null)
  setPlannedTasks([])
  setPlanMessage('Your weekly steps have been added.')
}

function updateMilestone(
  goalId: string,
  index: number,
  text: string
) {
  setGoals((current) =>
    current.map((goal) =>
      goal.id === goalId
        ? {
            ...goal,
            milestones: goal.milestones.map((step, stepIndex) =>
              stepIndex === index ? text : step
            ),
          }
        : goal
    )
  )

  setWeeklyTasks((current) =>
    current.map((task) =>
      task.goalId === goalId && task.milestoneIndex === index
        ? { ...task, text }
        : task
    )
  )

  setReviewGoalId(null)
  setPlannedTasks([])
  setPlanMessage('')
}

function removeMilestone(goalId: string, index: number) {
  setGoals((current) =>
    current.map((goal) =>
      goal.id === goalId
        ? {
            ...goal,
            milestones: goal.milestones.filter(
              (_, stepIndex) => stepIndex !== index
            ),
          }
        : goal
    )
  )

  setWeeklyTasks((current) =>
    current
      .filter(
        (task) =>
          !(
            task.goalId === goalId &&
            task.milestoneIndex === index
          )
      )
      .map((task) => {
        if (
          task.goalId === goalId &&
          task.milestoneIndex !== undefined &&
          task.milestoneIndex > index
        ) {
          return {
            ...task,
            milestoneIndex: task.milestoneIndex - 1,
          }
        }

        return task
      })
  )

  setReviewGoalId(null)
  setPlannedTasks([])
  setPlanMessage('')
}
  // Task actions
  function addTask(kind: TaskKind) {
    const text =
      kind === 'daily'
        ? newDailyTask.trim()
        : newWeeklyTask.trim()

    if (!text) return

    const task: Task = {
      id: crypto.randomUUID(),
      text,
      period: kind === 'daily' ? todayKey : weekKey,
      completed: false,
    }

    if (kind === 'daily') {
      setDailyTasks((current) => [...current, task])
      setNewDailyTask('')
    } else {
      setWeeklyTasks((current) => [...current, task])
      setNewWeeklyTask('')
    }

    setShowAddForm(false)
  }

  function toggleTask(kind: TaskKind, id: string) {
    const update = (current: Task[]) =>
      current.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed }
          : task
      )

    if (kind === 'daily') {
      setDailyTasks(update)
    } else {
      setWeeklyTasks(update)
    }
  }

  function removeTask(kind: TaskKind, id: string) {
    const update = (current: Task[]) =>
      current.filter((task) => task.id !== id)

    if (kind === 'daily') {
      setDailyTasks(update)
    } else {
      setWeeklyTasks(update)
    }
  }

  // Daily win actions
  function addWin() {
    const text = newWin.trim()
    if (!text) return

    setWins((current) => [
      {
        id: crypto.randomUUID(),
        category: selectedCategory,
        text,
        date: new Date().toISOString(),
      },
      ...current,
    ])

    setNewWin('')
    setWinFormOpen(false)
    setCelebration(Date.now())
  }

  // Calendar actions
  function changeMonth(amount: number) {
    setCalendarMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + amount,
          1
        )
    )
  }

  function addEvent() {
    const title = eventTitle.trim()
    if (!title || !selectedDate) return

    setEvents((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        title,
        date: selectedDate,
        time: eventTime,
      },
    ])

    setEventTitle('')
    setEventTime('')
    setShowAddForm(false)
  }

  // Note actions
  function createNote() {
    const note: Note = {
      id: crypto.randomUUID(),
      body: '',
    }

    setNotes((current) => [note, ...current])
    setSelectedNoteId(note.id)
  }

  function updateNote(value: string) {
    setNotes((current) =>
      current.map((note) =>
        note.id === selectedNoteId
          ? { ...note, body: value }
          : note
      )
    )
  }

  function deleteNote() {
    if (!selectedNoteId) return
    if (!window.confirm('Delete this note?')) return

    setNotes((current) =>
      current.filter((note) => note.id !== selectedNoteId)
    )

    setSelectedNoteId(null)
  }

  // Reminder actions
  function addReminder() {
    const text = reminderText.trim()
    if (!text || !reminderDue) return

    const dueDate = new Date(reminderDue)
    if (Number.isNaN(dueDate.getTime())) return

    setReminders((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        text,
        due: dueDate.toISOString(),
        completed: false,
      },
    ])

    setReminderText('')
    setReminderDue('')
    setShowAddForm(false)
  }

  function toggleReminder(id: string) {
    setReminders((current) =>
      current.map((reminder) =>
        reminder.id === id
          ? { ...reminder, completed: !reminder.completed }
          : reminder
      )
    )
  }

  // Book actions
  function addBook() {
    const title = bookTitle.trim()
    if (!title) return

    setBooks((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        title,
        author: bookAuthor.trim(),
        status: bookStatus,
      },
    ])

    setBookTitle('')
    setBookAuthor('')
    setShowAddForm(false)
  }

  return (
<main
  className={`app-main text-${textSize} ${
    page === 'home' ? 'home-page' : 'inner-page'
  }`}
>  
        {/* Theme button */}
      <button
        type="button"
        className="theme-toggle"
        aria-label={
          theme === 'light'
            ? 'Switch to night mode'
            : 'Switch to light mode'
        }
        title={
          theme === 'light'
            ? 'Switch to night mode'
            : 'Switch to light mode'
        }
        onClick={() =>
          setTheme((current) =>
            current === 'light' ? 'dark' : 'light'
          )
        }
      >
        {theme === 'light' ? (
          <Sun size={18} strokeWidth={1.7} aria-hidden="true" />
        ) : (
          <Moon size={18} strokeWidth={1.7} aria-hidden="true" />
        )}
      </button>

      {/* Touch and keyboard navigation helper */}
      <button
        type="button"
        className="nav-reveal-button"
        aria-label="Show navigation"
        aria-controls="main-navigation"
        onClick={() => setNavVisible(true)}
        onFocus={() => setNavVisible(true)}
      >
        Menu
      </button>

      {/* Floating navigation */}
      <nav
        id="main-navigation"
        className={`floating-nav ${
          navVisible || navHovered ? 'nav-visible' : 'nav-hidden'
        }`}
        aria-label="Main navigation"
        onPointerEnter={(event) => {
          if (event.pointerType !== 'mouse') return
          setNavHovered(true)
          setNavVisible(true)
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse') {
            setNavHovered(false)
          }
        }}
        onFocusCapture={() => setNavVisible(true)}
        onKeyDown={(event) => {
          if (event.key !== 'Escape') return

          const dropdown = (
            event.target as HTMLElement
          ).closest<HTMLDetailsElement>('details')

          if (dropdown) {
            dropdown.open = false
            dropdown.querySelector('summary')?.focus()
          }
        }}
      >
        <button
          type="button"
          className="nav-logo"
          aria-label="Go to home"
          onClick={() => navigate('home')}
        >
          <Layers size={24} aria-hidden="true" />
        </button>

        <button
          type="button"
          className={`nav-link ${page === 'home' ? 'active' : ''}`}
          aria-current={page === 'home' ? 'page' : undefined}
          onClick={() => navigate('home')}
        >
          Home
        </button>

        <details className="nav-dropdown">
          <summary
            className={`nav-link ${
              ['priorities', 'daily', 'weekly', 'calendar'].includes(
                page
              )
                ? 'active'
                : ''
            }`}
          >
            Plan
            <ChevronDown size={16} aria-hidden="true" />
          </summary>

          <div className="dropdown-panel">
            <button
              type="button"
              onClick={() => navigate('priorities')}
            >
              Priorities
            </button>
            <button
              type="button"
              onClick={() => navigate('daily')}
            >
              Daily To Do
            </button>
            <button
              type="button"
              onClick={() => navigate('weekly')}
            >
              Weekly To Do
            </button>
            <button
              type="button"
              onClick={() => navigate('calendar')}
            >
              Calendar
            </button>
          </div>
        </details>

        <button
          type="button"
          className={`nav-link ${
            page === 'wins' || page === 'win-entry' ? 'active' : ''
          }`}
          onClick={() => navigate('wins')}
        >
          Daily Wins
        </button>

        <details className="nav-dropdown">
          <summary
            className={`nav-link ${
              page === 'notes' || page === 'books' ? 'active' : ''
            }`}
          >
            Library
            <ChevronDown size={16} aria-hidden="true" />
          </summary>

          <div className="dropdown-panel">
            <button
              type="button"
              onClick={() => navigate('notes')}
            >
              Notes
            </button>
            <button
              type="button"
              onClick={() => navigate('books')}
            >
              Books
            </button>
          </div>
        </details>

        <button
          type="button"
          className={`nav-link ${
            page === 'reminders' ? 'active' : ''
          }`}
          onClick={() => navigate('reminders')}
        >
          Reminders
        </button>

        <button
          type="button"
          className={`nav-link ${
            page === 'profile' ? 'active' : ''
          }`}
          aria-current={page === 'profile' ? 'page' : undefined}
          onClick={() => navigate('profile')}
        >
          Profile
          <span className="nav-avatar" aria-hidden="true">
            {initials(userName)}
          </span>
        </button>
      </nav>

      {/* Home */}
      {page === 'home' && (
        <div className="home-content">  
          <header className="dashboard-header">
            <h2>
              {greeting}, {userName}
            </h2>
            <p className="dashboard-date">{date}</p>
          </header>

          <div className="dashboard-grid">
            {homeCards.map((card) => {
              const Icon = card.icon

              return (
                <button
                  key={card.page}
                  type="button"
                  className="dashboard-card navigation-card"
                  onClick={() => navigate(card.page)}
                >
                  <span className="card-icon">
                    <Icon
                      size={25}
                      strokeWidth={1.7}
                      aria-hidden="true"
                    />
                  </span>

                  <span className="card-heading-row">
                    <span className="card-title">
                      {card.title}
                    </span>
                    <ArrowUpRight
                      size={18}
                      className="card-arrow"
                      aria-hidden="true"
                    />
                  </span>

                  <span className="card-description">
                    {card.description}
                  </span>

                  <span className="card-detail">
                    {card.detail}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* In-app reminder alert */}
      {reminderAlerts && dueReminders.length > 0 && (
        <div className="reminder-alert" role="status">
          <strong>Reminders due</strong>

          {dueReminders.map((reminder) => (
            <div key={reminder.id} className="task-row">
              <span>{reminder.text}</span>
              <button
                type="button"
                className="text-button"
                onClick={() => toggleReminder(reminder.id)}
              >
                Mark done
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Inner pages */}
      {page !== 'home' && (
        <section className="dashboard-section">
          <button
            type="button"
            className="back-button"
            aria-label={
              page === 'win-entry'
                ? 'Back to Daily Wins'
                : 'Back to home'
            }
            title={
              page === 'win-entry'
                ? 'Back to Daily Wins'
                : 'Back to home'
            }
            onClick={() =>
              navigate(page === 'win-entry' ? 'wins' : 'home')
            }
          >
            <ArrowLeft size={22} aria-hidden="true" />
          </button>

          {/* Profile and settings */}
          {page === 'profile' && (
            <>
              <h2 className="page-title">Profile</h2>
              <p className="page-description">
                Your information and personal preferences.
              </p>

              <form
                className="settings-panel entry-form profile-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  const name = profileName.trim()
                  if (!name) return

                  setUserName(name)
                  setProfileName(name)
                  setSavedBio(profileBio.trim())
                  setProfileBio(profileBio.trim())
                  setProfileMessage('Profile updated.')
                }}
              >
                <h3>Your information</h3>

                <div
                  className="profile-initials"
                  aria-hidden="true"
                >
                  {initials(profileName) || initials(userName)}
                </div>

                <label>
                  Preferred name
                  <input
                    value={profileName}
                    onChange={(event) => {
                      setProfileName(event.target.value)
                      setProfileMessage('')
                    }}
                    autoComplete="given-name"
                    maxLength={80}
                    required
                  />
                </label>

                <label>
                  About you
                  <textarea
                    value={profileBio}
                    onChange={(event) => {
                      setProfileBio(event.target.value)
                      setProfileMessage('')
                    }}
                    placeholder="A little about yourself…"
                    rows={4}
                    maxLength={500}
                  />
                </label>

                <button
                  type="submit"
                  className="add-action"
                  disabled={!profileName.trim()}
                >
                  Update profile
                </button>

                {profileMessage && (
                  <p role="status">{profileMessage}</p>
                )}
              </form>

              <h3 className="entries-heading">Settings</h3>

              <section className="settings-panel">
                <h3>Appearance</h3>

                <div className="setting-row">
  <div>
    <label htmlFor="appearance-theme">Theme</label>
    <p>Choose the atmosphere for your space.</p>
  </div>

  <select
    id="appearance-theme"
    value={theme}
    onChange={(event) =>
      setTheme(event.target.value as Theme)
    }
  >
    <option value="light">Classic</option>
    <option value="dark">Night mode</option>
    <option value="earthy">Earthy</option>
    <option value="nature">Nature</option>
    <option value="sunshine">Sunshine</option>
    <option value="blue-sky">Blue Sky</option>
    <option value="ocean">Ocean</option>
  </select>
</div>

                <div className="setting-row">
                  <div>
                    <label htmlFor="text-size">Text size</label>
                    <p>Choose a comfortable reading size.</p>
                  </div>

                  <select
                    id="text-size"
                    value={textSize}
                    onChange={(event) =>
                      setTextSize(event.target.value as TextSize)
                    }
                  >
                    <option value="standard">Standard</option>
                    <option value="large">Large</option>
                  </select>
                </div>
              </section>

              <section className="settings-panel">
                <h3>Reminders</h3>

                <div className="setting-row">
                  <div>
                    <label htmlFor="reminder-alerts">
                      In-app reminder alerts
                    </label>
                    <p>
                      Show due reminders while the app is open.
                    </p>
                  </div>

                  <input
                    id="reminder-alerts"
                    type="checkbox"
                    checked={reminderAlerts}
                    onChange={(event) =>
                      setReminderAlerts(event.target.checked)
                    }
                  />
                </div>
              </section>

              <p className="settings-note">
                Appearance changes apply immediately.
                Profile changes apply when you select Update profile.
              </p>
            </>
          )}

          {/* Planning tabs */}
          {page === 'priorities' && (
            <div
              className="planning-tabs"
              aria-label="Planning views"
            >
              <button
                type="button"
                aria-pressed={planningTab === 'priorities'}
                onClick={() => {
                  setPlanningTab('priorities')
                  setShowAddForm(false)
                }}
              >
                Priorities
              </button>

              <button
                type="button"
                aria-pressed={planningTab === 'goals'}
                onClick={() => {
                  setPlanningTab('goals')
                  setShowAddForm(false)
                }}
              >
                Goals
              </button>
            </div>
          )}

          {/* Seasonal priorities */}
          {page === 'priorities' &&
            planningTab === 'priorities' && (
              <>
                <div className="page-title-row">
                  <div>
                    <h2 className="page-title">Priorities</h2>
                    <p className="page-description">this season</p>
                  </div>

                  <button
                    type="button"
                    className="add-action"
                    aria-expanded={showAddForm}
                    onClick={() => {
                      setShowAddForm(!showAddForm)
                      setPriorityError('')
                    }}
                  >
                    {showAddForm ? 'Cancel' : '+ Add priority'}
                  </button>
                </div>

                <div className="season-banner">
                  <div>
                    <span className="small-label">
                      THIS SEASON
                    </span>
                    <h3>What matters right now</h3>
                    <p>
                      Choose the things you want to give your time
                      and energy to.
                    </p>
                  </div>

                  <div className="season-actions">
                    <span className="season-count">
                      {priorities.length} priorities
                    </span>

                    <button
                      type="button"
                      className="add-action"
                      aria-expanded={showAddForm}
                      onClick={() => {
                        setShowAddForm(!showAddForm)
                        setPriorityError('')
                      }}
                    >
                      {showAddForm ? 'Cancel' : '+ Add priority'}
                    </button>
                  </div>
                </div>

                {showAddForm && (
                  <form
                    className="priority-form"
                    onSubmit={(event) => {
                      event.preventDefault()
                      addPriority()
                    }}
                  >
                    <input
                      autoFocus
                      aria-label="New seasonal priority"
                      placeholder="What matters to you this season?"
                      value={newPriority}
                      onChange={(event) => {
                        setNewPriority(event.target.value)
                        setPriorityError('')
                      }}
                      maxLength={100}
                      required
                    />

                    <button
                      type="submit"
                      className="add-action"
                      disabled={!newPriority.trim()}
                    >
                      Add priority
                    </button>
                  </form>
                )}

                {priorityError && (
                  <p className="form-error" role="alert">
                    {priorityError}
                  </p>
                )}

                {priorities.length === 0 && (
                  <p className="empty-message">
                    Add your first priority for this season.
                  </p>
                )}

                <div className="priorities-grid">
                  {priorities.map((priority) => (
                    <article
                      key={priority}
                      className="priority-card"
                    >
                      <div className="priority-card-toolbar">
                        <Compass size={22} aria-hidden="true" />

                        <button
                          type="button"
                          className="text-button"
                          aria-label={`Edit ${priority}`}
                          onClick={() => {
                            setEditingPriority(priority)
                            setPriorityEditText(priority)
                            setPriorityError('')
                          }}
                        >
                          Edit
                        </button>
                      </div>

                      {editingPriority === priority ? (
                        <form
                          className="priority-edit-form"
                          onSubmit={(event) => {
                            event.preventDefault()
                            savePriorityEdit(priority)
                          }}
                        >
                          <input
                            autoFocus
                            aria-label="Edit priority"
                            value={priorityEditText}
                            onChange={(event) =>
                              setPriorityEditText(
                                event.target.value
                              )
                            }
                            maxLength={100}
                            required
                          />

                          <div className="priority-edit-actions">
                            <button
                              type="submit"
                              className="add-action"
                              disabled={!priorityEditText.trim()}
                            >
                              Save
                            </button>

                            <button
                              type="button"
                              className="text-button"
                              onClick={() => {
                                setEditingPriority(null)
                                setPriorityError('')
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <h3>{priority}</h3>
                      )}

                      <button
                        type="button"
                        className="text-button priority-remove"
                        aria-label={`Remove ${priority}`}
                        onClick={() => {
                          setPriorities((current) =>
                            current.filter(
                              (item) => item !== priority
                            )
                          )
                          setEditingPriority(null)
                          setPriorityError('')
                        }}
                      >
                        Remove
                      </button>
                    </article>
                  ))}
                </div>
              </>
            )}

          {/* Goals */}
          {page === 'priorities' && planningTab === 'goals' && (
            <>
              <div className="page-title-row">
                <div>
                  <h2 className="page-title">Goals</h2>
                  <p className="page-description">
                    A little direction for the months ahead.
                  </p>
                </div>

                <button
                  type="button"
                  className="add-action"
                  aria-expanded={showAddForm}
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  {showAddForm ? 'Cancel' : '+ Add goal'}
                </button>
              </div>

              {showAddForm && (
                <form
                  className="entry-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    addGoal()
                  }}
                >
                  <label>
                    Your goal
                    <input
                      autoFocus
                      value={goalTitle}
                      onChange={(event) =>
                        setGoalTitle(event.target.value)
                      }
                      placeholder="What would you love to work toward?"
                      maxLength={200}
                      required
                    />
                  </label>

                  <label>
                    Timeframe
                    <select
                      value={goalMonths}
                      onChange={(event) =>
                        setGoalMonths(Number(event.target.value))
                      }
                    >
                      <option value={3}>3 months</option>
                      <option value={6}>6 months</option>
                      <option value={12}>Yearly</option>
                    </select>
                  </label>

                  <label>
                    Milestones — one per line
                    <textarea
                      value={goalMilestones}
                      onChange={(event) =>
                        setGoalMilestones(event.target.value)
                      }
                      placeholder="Write the smaller steps you want to take…"
                      rows={5}
                      maxLength={10000}
                    />
                  </label>

                  <button
                    type="submit"
                    className="add-action"
                    disabled={!goalTitle.trim()}
                  >
                    Save goal
                  </button>
                </form>
              )}

              {goals.length === 0 && (
                <p className="empty-message">
                  Your goals will live here. Start with something
                  meaningful.
                </p>
              )}
{planMessage && (
  <p className="plan-message" role="status">
    {planMessage}
  </p>
)}

<ul className="goal-list">
  {goals.map((goal) => {
    const linkedTasks = weeklyTasks.filter(
      (task) => task.goalId === goal.id
    )

    const completedCount = goal.milestones.filter(
      (_, index) =>
        linkedTasks.some(
          (task) =>
            task.milestoneIndex === index && task.completed
        )
    ).length

    const progress =
      goal.milestones.length === 0
        ? 0
        : Math.round(
            (completedCount / goal.milestones.length) * 100
          )

    return (
      <li key={goal.id}>
        <button
          type="button"
          className="goal-heading"
          aria-expanded={activeGoal === goal.id}
          onClick={() => {
            setActiveGoal(
              activeGoal === goal.id ? null : goal.id
            )
            setReviewGoalId(null)
            setPlanMessage('')
          }}
        >
          <span>{goal.title}</span>

          <small>
            {goal.months === 12
              ? 'Yearly'
              : `${goal.months} months`}
            {' · '}
            {new Date(
              `${goal.target}T12:00:00`
            ).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </small>

          <ChevronDown size={18} aria-hidden="true" />
        </button>

        <div className="goal-progress">
          <progress
            value={progress}
            max={100}
            aria-label={`${goal.title}: ${progress}% complete`}
          />

          <small>
            {completedCount} of {goal.milestones.length} steps
            completed
          </small>
        </div>

        {activeGoal === goal.id && (
          <div className="goal-detail">
            <h3>Milestones</h3>

            <p className="page-description">
              Edit a step directly below. Changes also update its
              linked weekly task.
            </p>

            {goal.milestones.length === 0 && (
              <p className="empty-message">
                Start with one small step.
              </p>
            )}

            <ol className="milestone-list">
              {goal.milestones.map((text, index) => {
                const linkedTask = linkedTasks.find(
                  (task) => task.milestoneIndex === index
                )

                return (
                  <li key={`${goal.id}-${index}`}>
                    <div className="milestone-content">
                      <input
                        aria-label={`Milestone ${index + 1}`}
                        value={text}
                        onChange={(event) =>
                          updateMilestone(
                            goal.id,
                            index,
                            event.target.value
                          )
                        }
                        placeholder="Write a milestone…"
                        maxLength={200}
                      />

                      <small>
                        {linkedTask
                          ? linkedTask.completed
                            ? 'Completed'
                            : `Week of ${shortDate(
                                new Date(
                                  `${linkedTask.period}T12:00:00`
                                )
                              )}`
                          : 'Not yet in your weekly plan'}
                      </small>
                    </div>

                    <button
                      type="button"
                      className="text-button"
                      aria-label={`Remove milestone ${index + 1}`}
                      onClick={() =>
                        removeMilestone(goal.id, index)
                      }
                    >
                      Remove
                    </button>
                  </li>
                )
              })}
            </ol>

            <form
              className="priority-form"
              onSubmit={(event) => {
                event.preventDefault()

                const form = event.currentTarget
                const text = String(
                  new FormData(form).get('milestone') || ''
                ).trim()

                if (!text) return

                setGoals((current) =>
                  current.map((item) =>
                    item.id === goal.id
                      ? {
                          ...item,
                          milestones: [
                            ...item.milestones,
                            text,
                          ],
                        }
                      : item
                  )
                )

                setReviewGoalId(null)
                setPlanMessage('')
                form.reset()
              }}
            >
              <input
                name="milestone"
                aria-label={`Add a milestone to ${goal.title}`}
                placeholder="+ Write another milestone"
                maxLength={200}
                required
              />

              <button type="submit" className="add-action">
                Add step
              </button>
            </form>

            <div className="goal-actions">
              <button
                type="button"
                className="add-action"
                disabled={goal.milestones.length === 0}
                onClick={() => scheduleGoal(goal)}
              >
                + Plan weekly steps
              </button>

              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setGoals((current) =>
                    current.filter(
                      (item) => item.id !== goal.id
                    )
                  )

                  setWeeklyTasks((current) =>
                    current.filter(
                      (task) => task.goalId !== goal.id
                    )
                  )

                  setReviewGoalId(null)
                  setPlanMessage('')
                }}
              >
                Remove goal and its weekly steps
              </button>
            </div>

            {reviewGoalId === goal.id && (
              <section
                className="plan-review"
                aria-label="Review weekly steps"
              >
                <h3>Review your weekly steps</h3>

                <p className="page-description">
                  These dates distribute your milestones across
                  the remaining weeks. Change a date to move a
                  step into another week.
                </p>

                {plannedTasks.map((task) => (
                  <div key={task.id} className="plan-step">
                    <span>{task.text}</span>

                    <label>
                      Week starting
                      <input
                        type="date"
                        value={task.period}
                        min={dateKey(mondayOf(now))}
                        max={dateKey(
                          mondayOf(
                            new Date(
                              `${goal.target}T12:00:00`
                            )
                          )
                        )}
                        onChange={(event) => {
                          if (!event.target.value) return

                          const selectedMonday = dateKey(
                            mondayOf(
                              new Date(
                                `${event.target.value}T12:00:00`
                              )
                            )
                          )

                          const earliest = dateKey(mondayOf(now))
                          const latest = dateKey(
                            mondayOf(
                              new Date(
                                `${goal.target}T12:00:00`
                              )
                            )
                          )

                          if (
                            selectedMonday < earliest ||
                            selectedMonday > latest
                          ) {
                            return
                          }

                          setPlannedTasks((current) =>
                            current.map((item) =>
                              item.id === task.id
                                ? {
                                    ...item,
                                    period: selectedMonday,
                                  }
                                : item
                            )
                          )
                        }}
                      />
                    </label>
                  </div>
                ))}

                <p className="page-description">
                  Dates are grouped into Monday–Sunday weeks.
                  Nothing is added until you accept.
                </p>

                <div className="goal-actions">
                  <button
                    type="button"
                    className="add-action"
                    onClick={acceptGoalPlan}
                  >
                    Add to weekly plan
                  </button>

                  <button
                    type="button"
                    className="text-button"
                    onClick={() => {
                      setReviewGoalId(null)
                      setPlannedTasks([])
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </section>
            )}
          </div>
        )}
      </li>
    )
  })}
</ul>
              
            </>
          )}

          {/* Daily and weekly tasks */}
          {(page === 'daily' || page === 'weekly') && (
            <>
              <div className="page-title-row">
                <div>
                  <h2 className="page-title">
                    {page === 'daily'
                      ? `To Do ${dayName}`
                      : 'To Do Weekly'}
                  </h2>

                  <p className="page-description">
                    {page === 'daily' ? date : weekRange}
                  </p>
                </div>

                <button
                  type="button"
                  className="add-action"
                  aria-expanded={showAddForm}
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  {showAddForm ? 'Cancel' : '+ Add task'}
                </button>
              </div>

              {page === 'weekly' && (
                <div className="week-navigation">
                  <button
                    type="button"
                    className="text-button"
                    onClick={() =>
                      setWeekOffset((current) => current - 1)
                    }
                  >
                    ← Previous week
                  </button>

                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setWeekOffset(0)}
                    aria-pressed={weekKey === currentWeekKey}
                  >
                    This week
                  </button>

                  <button
                    type="button"
                    className="text-button"
                    onClick={() =>
                      setWeekOffset((current) => current + 1)
                    }
                  >
                    Next week →
                  </button>
                </div>
              )}

              {showAddForm && (
                <form
                  className="priority-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    addTask(page === 'daily' ? 'daily' : 'weekly')
                  }}
                >
                  <input
                    autoFocus
                    aria-label="New task"
                    placeholder="Write your next step…"
                    value={
                      page === 'daily'
                        ? newDailyTask
                        : newWeeklyTask
                    }
                    onChange={(event) => {
                      if (page === 'daily') {
                        setNewDailyTask(event.target.value)
                      } else {
                        setNewWeeklyTask(event.target.value)
                      }
                    }}
                    maxLength={200}
                    required
                  />

                  <button
                    type="submit"
                    className="add-action"
                    disabled={
                      !(page === 'daily'
                        ? newDailyTask
                        : newWeeklyTask
                      ).trim()
                    }
                  >
                    Add task
                  </button>
                </form>
              )}

              <TaskList
                tasks={
                  page === 'daily' ? todaysTasks : thisWeeksTasks
                }
                onToggle={(id) =>
                  toggleTask(
                    page === 'daily' ? 'daily' : 'weekly',
                    id
                  )
                }
                onRemove={(id) =>
                  removeTask(
                    page === 'daily' ? 'daily' : 'weekly',
                    id
                  )
                }
              />
            </>
          )}

          {/* Daily wins categories */}
          {page === 'wins' && (
            <>
              <h2 className="page-title">Daily Wins</h2>

              <p className="page-description">
                Take a moment to notice what went well.
              </p>

              <div className="wins-grid">
                {winCategories.map((category) => {
                  const Icon = categoryIcons[category]
                  const count = wins.filter(
                    (win) => win.category === category
                  ).length

                  return (
                    <button
                      key={category}
                      type="button"
                      className="win-category"
                      onClick={() => {
                        setSelectedCategory(category)
                        navigate('win-entry')
                      }}
                    >
                      <span className="win-icon">
                        <Icon
                          size={32}
                          strokeWidth={1.5}
                          aria-hidden="true"
                        />
                      </span>

                      <span>{category}</span>
                      <small>{count} wins to remember</small>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* Daily win writing page */}
          {page === 'win-entry' && (
            <>
              <h2 className="page-title">{selectedCategory}</h2>
              <p className="page-description">{date}</p>

              <button
                type="button"
                className="add-action"
                aria-expanded={winFormOpen}
                onClick={() => setWinFormOpen(!winFormOpen)}
              >
                {winFormOpen ? 'Cancel' : '+ Add a win'}
              </button>

              {celebration > 0 && (
                <div
                  key={celebration}
                  className="win-celebration"
                  role="status"
                >
                  <PartyPopper size={24} aria-hidden="true" />
                  <span>
                    A little win, worth celebrating. Added to your
                    wins.
                  </span>
                </div>
              )}

              {winFormOpen && (
                <form
                  className="win-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    addWin()
                  }}
                >
                  <label htmlFor="new-win">
                    What is a win you want to remember today?
                  </label>

                  <textarea
                    id="new-win"
                    autoFocus
                    value={newWin}
                    onChange={(event) =>
                      setNewWin(event.target.value)
                    }
                    placeholder="Write your daily win…"
                    rows={7}
                    maxLength={5000}
                    required
                  />

                  <button
                    type="submit"
                    className="add-action"
                    disabled={!newWin.trim()}
                  >
                    Add win
                  </button>
                </form>
              )}

              <h3 className="entries-heading">Previous wins</h3>

              {categoryWins.length === 0 && (
                <p className="empty-message">
                  Your wins will appear here.
                </p>
              )}

              <ul className="win-list">
                {categoryWins.map((win) => (
                  <li key={win.id} className="win-entry">
                    <p className="win-text">{win.text}</p>

                    <small className="card-subtitle">
                      {fullDate(new Date(win.date))}
                    </small>

                    <button
                      type="button"
                      className="text-button"
                      aria-label={`Remove win: ${win.text.slice(0, 50)}`}
                      onClick={() =>
                        setWins((current) =>
                          current.filter(
                            (item) => item.id !== win.id
                          )
                        )
                      }
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Calendar */}
          {page === 'calendar' && (
            <>
              <div className="page-title-row">
                <h2 className="page-title">Calendar</h2>

                <button
                  type="button"
                  className="add-action"
                  aria-expanded={showAddForm}
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  {showAddForm ? 'Cancel' : '+ Add event'}
                </button>
              </div>

              <div className="calendar-toolbar">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => changeMonth(-1)}
                >
                  ← Previous
                </button>

                <h3>{monthYear}</h3>

                <button
                  type="button"
                  className="text-button"
                  onClick={() => changeMonth(1)}
                >
                  Next →
                </button>

                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setCalendarMonth(
                      new Date(
                        now.getFullYear(),
                        now.getMonth(),
                        1
                      )
                    )
                    setSelectedDate(todayKey)
                  }}
                >
                  Today
                </button>
              </div>

              <div
                className="calendar-grid"
                aria-label={monthYear}
              >
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(
                  (day) => (
                    <div key={day} className="calendar-weekday">
                      {day}
                    </div>
                  )
                )}

                {Array.from(
                  { length: firstDayOffset },
                  (_, index) => (
                    <div
                      key={`empty-${index}`}
                      aria-hidden="true"
                    />
                  )
                )}

                {Array.from({ length: daysInMonth }, (_, index) => {
                  const day = index + 1

                  const key = dateKey(
                    new Date(
                      calendarMonth.getFullYear(),
                      calendarMonth.getMonth(),
                      day
                    )
                  )

                  const eventCount = events.filter(
                    (event) => event.date === key
                  ).length

                  return (
                    <button
                      key={key}
                      type="button"
                      className={`calendar-day ${
                        key === todayKey ? 'today' : ''
                      } ${key === selectedDate ? 'selected' : ''}`}
                      aria-pressed={key === selectedDate}
                      aria-current={
                        key === todayKey ? 'date' : undefined
                      }
                      aria-label={`${key}, ${eventCount} events`}
                      onClick={() => setSelectedDate(key)}
                    >
                      <span>{day}</span>

                      {eventCount > 0 && (
                        <small className="calendar-event-dot">
                          •
                        </small>
                      )}
                    </button>
                  )
                })}
              </div>

              <h3 className="entries-heading">
                {fullDate(new Date(`${selectedDate}T12:00:00`))}
              </h3>

              {showAddForm && (
                <form
                  className="entry-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    addEvent()
                  }}
                >
                  <label>
                    Event title
                    <input
                      autoFocus
                      value={eventTitle}
                      onChange={(event) =>
                        setEventTitle(event.target.value)
                      }
                      placeholder="What are you planning?"
                      maxLength={200}
                      required
                    />
                  </label>

                  <label>
                    Date
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(event) => {
                        if (event.target.value) {
                          setSelectedDate(event.target.value)
                        }
                      }}
                      required
                    />
                  </label>

                  <label>
                    Time (optional)
                    <input
                      type="time"
                      value={eventTime}
                      onChange={(event) =>
                        setEventTime(event.target.value)
                      }
                    />
                  </label>

                  <button
                    type="submit"
                    className="add-action"
                    disabled={!eventTitle.trim()}
                  >
                    Add event
                  </button>
                </form>
              )}

              {selectedEvents.length === 0 && (
                <p className="empty-message">
                  No events for this date.
                </p>
              )}

              <ul className="task-list">
                {selectedEvents.map((event) => (
                  <li key={event.id} className="task-row">
                    <span>
                      {event.time || 'All day'} · {event.title}
                    </span>

                    <button
                      type="button"
                      className="text-button"
                      aria-label={`Remove ${event.title}`}
                      onClick={() =>
                        setEvents((current) =>
                          current.filter(
                            (item) => item.id !== event.id
                          )
                        )
                      }
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>

              <h3 className="entries-heading">Daily tasks</h3>

              <TaskList
                tasks={selectedDateTasks}
                onToggle={(id) => toggleTask('daily', id)}
                onRemove={(id) => removeTask('daily', id)}
              />
            </>
          )}

          {/* Notes */}
          {page === 'notes' && (
            <>
              <div className="page-title-row">
                <h2 className="page-title">Notes</h2>

                <button
                  type="button"
                  className="add-action"
                  onClick={createNote}
                >
                  + New note
                </button>
              </div>

              <div
                className={`notes-layout ${
                  selectedNote ? 'has-selection' : ''
                }`}
              >
                <div className="notes-sidebar">
                  {notes.length === 0 && (
                    <p className="empty-message">
                      A space for whatever is on your mind.
                    </p>
                  )}

                  {notes.map((note) => {
                    const lines = note.body.trim().split('\n')
                    const title =
                      lines[0]?.slice(0, 70) || 'New note'
                    const preview = lines
                      .slice(1)
                      .join(' ')
                      .slice(0, 80)

                    return (
                      <button
                        key={note.id}
                        type="button"
                        className={`note-preview ${
                          selectedNoteId === note.id
                            ? 'selected'
                            : ''
                        }`}
                        aria-pressed={selectedNoteId === note.id}
                        onClick={() =>
                          setSelectedNoteId(note.id)
                        }
                      >
                        <strong>{title}</strong>
                        <small>
                          {preview || 'Start writing…'}
                        </small>
                      </button>
                    )
                  })}
                </div>

                {selectedNote ? (
                  <div className="note-editor">
                    <button
                      type="button"
                      className="text-button notes-list-back"
                      onClick={() => setSelectedNoteId(null)}
                    >
                      ← All notes
                    </button>

                    <label
                      className="sr-only"
                      htmlFor="note-body"
                    >
                      Write your note
                    </label>

                    <textarea
                      id="note-body"
                      value={selectedNote.body}
                      onChange={(event) =>
                        updateNote(event.target.value)
                      }
                      placeholder="Just start writing…"
                      rows={16}
                      maxLength={20000}
                    />

                    <button
                      type="button"
                      className="text-button"
                      onClick={deleteNote}
                    >
                      Delete note
                    </button>
                  </div>
                ) : (
                  <p className="empty-message">
                    Select a note or start a new one.
                  </p>
                )}
              </div>
            </>
          )}

          {/* Reminders */}
          {page === 'reminders' && (
            <>
              <div className="page-title-row">
                <div>
                  <h2 className="page-title">Reminders</h2>
                  <p className="page-description">
                    Due reminders appear while this app is open.
                  </p>
                </div>

                <button
                  type="button"
                  className="add-action"
                  aria-expanded={showAddForm}
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  {showAddForm ? 'Cancel' : '+ Add reminder'}
                </button>
              </div>

              {showAddForm && (
                <form
                  className="entry-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    addReminder()
                  }}
                >
                  <label>
                    What should you remember?
                    <input
                      autoFocus
                      value={reminderText}
                      onChange={(event) =>
                        setReminderText(event.target.value)
                      }
                      placeholder="Write your reminder…"
                      maxLength={200}
                      required
                    />
                  </label>

                  <label>
                    Date and time
                    <input
                      type="datetime-local"
                      value={reminderDue}
                      onChange={(event) =>
                        setReminderDue(event.target.value)
                      }
                      required
                    />
                  </label>

                  <button
                    type="submit"
                    className="add-action"
                    disabled={
                      !reminderText.trim() || !reminderDue
                    }
                  >
                    Add reminder
                  </button>
                </form>
              )}

              {reminders.length === 0 && (
                <p className="empty-message">
                  No reminders yet.
                </p>
              )}

              <ul className="task-list">
                {[...reminders]
                  .sort(
                    (a, b) =>
                      new Date(a.due).getTime() -
                      new Date(b.due).getTime()
                  )
                  .map((reminder) => (
                    <li key={reminder.id} className="task-row">
                      <label className="task-label">
                        <input
                          type="checkbox"
                          checked={reminder.completed}
                          onChange={() =>
                            toggleReminder(reminder.id)
                          }
                        />

                        <span>
                          <span
                            className={
                              reminder.completed
                                ? 'completed'
                                : ''
                            }
                          >
                            {reminder.text}
                          </span>

                          <small className="card-subtitle">
                            {new Date(
                              reminder.due
                            ).toLocaleString()}
                          </small>
                        </span>
                      </label>

                      <button
                        type="button"
                        className="text-button"
                        aria-label={`Remove ${reminder.text}`}
                        onClick={() =>
                          setReminders((current) =>
                            current.filter(
                              (item) =>
                                item.id !== reminder.id
                            )
                          )
                        }
                      >
                        Remove
                      </button>
                    </li>
                  ))}
              </ul>
            </>
          )}

          {/* Books */}
          {page === 'books' && (
            <>
              <div className="page-title-row">
                <h2 className="page-title">Books</h2>

                <button
                  type="button"
                  className="add-action"
                  aria-expanded={showAddForm}
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  {showAddForm ? 'Cancel' : '+ Add book'}
                </button>
              </div>

              {showAddForm && (
                <form
                  className="entry-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    addBook()
                  }}
                >
                  <label>
                    Book title
                    <input
                      autoFocus
                      value={bookTitle}
                      onChange={(event) =>
                        setBookTitle(event.target.value)
                      }
                      placeholder="What would you like to read?"
                      maxLength={200}
                      required
                    />
                  </label>

                  <label>
                    Author (optional)
                    <input
                      value={bookAuthor}
                      onChange={(event) =>
                        setBookAuthor(event.target.value)
                      }
                      maxLength={200}
                    />
                  </label>

                  <label>
                    Add to
                    <select
                      value={bookStatus}
                      onChange={(event) =>
                        setBookStatus(
                          event.target.value as Book['status']
                        )
                      }
                    >
                      <option value="reading">
                        Currently Reading
                      </option>
                      <option value="wishlist">
                        Wishlist
                      </option>
                    </select>
                  </label>

                  <button
                    type="submit"
                    className="add-action"
                    disabled={!bookTitle.trim()}
                  >
                    Add book
                  </button>
                </form>
              )}

              <div className="book-columns">
                {(['reading', 'wishlist'] as const).map((status) => (
                  <section key={status}>
                    <h3>
                      {status === 'reading'
                        ? 'Currently Reading'
                        : 'Wishlist'}
                    </h3>

                    {!books.some(
                      (book) => book.status === status
                    ) && (
                      <p className="empty-message">
                        No books here yet.
                      </p>
                    )}

                    {books
                      .filter((book) => book.status === status)
                      .map((book) => (
                        <article
                          key={book.id}
                          className="book-card"
                        >
                          <h4>{book.title}</h4>

                          {book.author && <p>{book.author}</p>}

                          <div className="book-actions">
                            <button
                              type="button"
                              className="text-button"
                              onClick={() =>
                                setBooks((current) =>
                                  current.map((item) =>
                                    item.id === book.id
                                      ? {
                                          ...item,
                                          status:
                                            item.status ===
                                            'reading'
                                              ? 'wishlist'
                                              : 'reading',
                                        }
                                      : item
                                  )
                                )
                              }
                            >
                              {status === 'reading'
                                ? 'Move to wishlist'
                                : 'Start reading'}
                            </button>

                            <button
                              type="button"
                              className="text-button"
                              aria-label={`Remove ${book.title}`}
                              onClick={() =>
                                setBooks((current) =>
                                  current.filter(
                                    (item) =>
                                      item.id !== book.id
                                  )
                                )
                              }
                            >
                              Remove
                            </button>
                          </div>
                        </article>
                      ))}
                  </section>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </main>
  )
}

export default App