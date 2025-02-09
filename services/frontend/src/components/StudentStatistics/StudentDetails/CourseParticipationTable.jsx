import React, { Fragment } from 'react'
import { func, shape } from 'prop-types'
import { Divider, Icon, Header, Item } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import useLanguage from 'components/LanguagePicker/useLanguage'
import { byDateDesc, reformatDate, getTextInWithOpen, resolveStudyPlan } from '../../../common'
import StudentCourseTable from '../StudentCourseTable'

// Some courses are without AY in the beginning in the studyplan even though the credits are registered with AY.
const isInStudyPlan = (plan, code) =>
  plan && (plan.included_courses.includes(code) || plan.included_courses.includes(code.replace('AY', '')))

const CourseParticipationTable = ({ student, clearCourseStats, studyrightid }) => {
  const { language } = useLanguage()

  if (!student) return null
  const courseHeaders = ['Date', 'Course', 'Grade', 'Credits', '']

  const courseRowsByAcademicYear = {}

  const studyRight = student.studyrights.find(s => s.studyrightid === studyrightid)
  const plan = resolveStudyPlan(student.studyplans, studyRight)

  student.courses.sort(byDateDesc).forEach(c => {
    const { date, grade, credits, isOpenCourse, course, isStudyModuleCredit, passed, credittypecode } = c
    const isIncluded = isInStudyPlan(plan, course.code)

    let icon = null

    if (isStudyModuleCredit) {
      icon = <Icon name="certificate" color="purple" />
    } else if (c.credittypecode === 9) {
      icon = <Icon name="clipboard check" title="Credit transfer" color="green" />
    } else if (passed) {
      icon = <Icon name="check" color="green" />
    } else {
      icon = <Icon name="times" color="red" />
    }

    if (!courseRowsByAcademicYear[`${new Date(date).getFullYear()}-${new Date(date).getFullYear() + 1}`]) {
      courseRowsByAcademicYear[`${new Date(date).getFullYear()}-${new Date(date).getFullYear() + 1}`] = []
    }
    if (!courseRowsByAcademicYear[`${new Date(date).getFullYear() - 1}-${new Date(date).getFullYear()}`]) {
      courseRowsByAcademicYear[`${new Date(date).getFullYear() - 1}-${new Date(date).getFullYear()}`] = []
    }

    if (new Date(date).getMonth() < 7) {
      courseRowsByAcademicYear[`${new Date(date).getFullYear() - 1}-${new Date(date).getFullYear()}`].push([
        isIncluded,
        reformatDate(date, 'DD.MM.YYYY'),
        `${
          isStudyModuleCredit
            ? `${getTextInWithOpen(course.name, language, isOpenCourse)} [Study Module]`
            : getTextInWithOpen(course.name, language, isOpenCourse)
        } ${credittypecode === 7 ? ` (${course.code}) (korotettu)` : `(${course.code})`}`,
        <div>
          {icon}
          {grade}
        </div>,
        credits,
        <Item
          as={Link}
          to={`/coursestatistics?courseCodes=["${course.code}"]&separate=false&unifyOpenUniCourses=false`}
        >
          <Icon name="level up alternate" onClick={() => clearCourseStats()} />
        </Item>,
      ])
    } else {
      courseRowsByAcademicYear[`${new Date(date).getFullYear()}-${new Date(date).getFullYear() + 1}`].push([
        isIncluded,
        reformatDate(date, 'DD.MM.YYYY'),
        `${
          isStudyModuleCredit
            ? `${getTextInWithOpen(course.name, language, isOpenCourse)} [Study Module]`
            : getTextInWithOpen(course.name, language, isOpenCourse)
        } ${credittypecode === 7 ? `, ${course.code} (korotettu)` : `(${course.code})`}`,
        <div>
          {icon}
          {grade}
        </div>,
        credits,
        <Item
          as={Link}
          to={`/coursestatistics?courseCodes=["${course.code}"]&separate=false&unifyOpenUniCourses=false`}
        >
          <Icon name="level up alternate" onClick={() => clearCourseStats()} />
        </Item>,
      ])
    }
  })

  const courseTables = Object.keys(courseRowsByAcademicYear).map(academicYear => {
    if (courseRowsByAcademicYear[academicYear] < 1) return null

    return (
      <Fragment key={academicYear}>
        <Header content={academicYear} />
        <StudentCourseTable
          headers={courseHeaders}
          rows={courseRowsByAcademicYear[academicYear]}
          noResultText="Student has courses marked"
        />
      </Fragment>
    )
  })

  return (
    <>
      <Divider horizontal style={{ padding: '20px' }}>
        <Header as="h4">Courses</Header>
      </Divider>
      {courseTables}
    </>
  )
}

CourseParticipationTable.propTypes = {
  student: shape({}).isRequired,
  clearCourseStats: func.isRequired,
}

export default CourseParticipationTable
