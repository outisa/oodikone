import { callController } from '../apiConnection'
import { DEFAULT_LANG } from '../constants'

const initial = () => ({
  language: DEFAULT_LANG,
  namesVisible: false,
  collapsedHeaders: [],
  studentlistVisible: false,
  chartHeight: 600,
})

export const switchLanguage = (username, language) => {
  const route = '/language'
  const prefix = 'SWITCH_LANGUAGE_'
  const data = { username, language }
  const method = 'post'
  return callController(route, prefix, data, method)
}

const reducer = (state = initial(), action) => {
  switch (action.type) {
    case 'INIT_LANGUAGE':
      return {
        ...state,
        language: action.language,
      }
    case 'SWITCH_LANGUAGE_SUCCESS':
      return {
        ...state,
        language: action.response.language,
      }
    case 'HIDE_STUDENT_NAMES':
      return {
        ...state,
        namesVisible: false,
      }
    case 'SHOW_STUDENT_NAMES':
      return {
        ...state,
        namesVisible: true,
      }
    case 'TOGGLE_STUDENT_NAME_VISIBILITY':
      return {
        ...state,
        namesVisible: !state.namesVisible,
      }
    case 'TOGGLE_STUDENT_LIST_VISIBILITY':
      return {
        ...state,
        studentlistVisible: !state.studentlistVisible,
      }
    case 'MODIFY_COURSES_COLLAPSED_HEADERS':
      if (state.collapsedHeaders.find(h => h === action.headerName)) {
        return {
          ...state,
          collapsedHeaders: state.collapsedHeaders.filter(h => h !== action.headerName),
        }
      }
      return {
        ...state,
        collapsedHeaders: state.collapsedHeaders.concat(action.headerName),
      }
    case 'SET_CHART_HEIGHT':
      return {
        ...state,
        chartHeight: action.size,
      }
    default:
      return state
  }
}

export const initLanguage = language => ({
  type: 'INIT_LANGUAGE',
  language,
})

export const hideStudentNames = () => ({
  type: 'HIDE_STUDENT_NAMES',
})

export const showStudentNames = () => ({
  type: 'SHOW_STUDENT_NAMES',
})

export const setChartHeight = size => ({
  type: 'SET_CHART_HEIGHT',
  size,
})

export const toggleStudentNameVisibility = () => ({
  type: 'TOGGLE_STUDENT_NAME_VISIBILITY',
})

export const toggleStudentListVisibility = () => ({
  type: 'TOGGLE_STUDENT_LIST_VISIBILITY',
})

export const collapseCoursesHeader = headerName => {
  return {
    type: 'MODIFY_COURSES_COLLAPSED_HEADERS',
    headerName,
  }
}

export default reducer
