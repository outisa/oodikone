import React, { useCallback, useState } from 'react'
import { withRouter, useHistory } from 'react-router-dom'
import { Segment, Header, Tab, Loader } from 'semantic-ui-react'
import { useGetFacultiesQuery } from 'redux/facultyStats'
import { useGetAuthorizedUserQuery } from 'redux/auth'
import { useTabs, useTitle } from '../../common/hooks'
import FacultySelector from './facultySelector'
import BasicOverview from './BasicOverview'
import ProgrammeOverview from './FacultyProgrammeOverview'
import TimesAndPathsView from './TimesAndPaths'
import UpdateView from './UpdateView'
import useLanguage from '../LanguagePicker/useLanguage'

const FacultyStatistics = props => {
  useTitle('Faculties')
  const history = useHistory()
  const { getTextIn } = useLanguage()
  const allFaculties = useGetFacultiesQuery()
  const faculties = allFaculties?.data

  const { match } = props
  const { facultyCode } = match.params
  const faculty = faculties && facultyCode && faculties.find(f => f.code === facultyCode)
  const facultyName = faculty && getTextIn(faculty.name)

  const { isAdmin, rights, iamRights } = useGetAuthorizedUserQuery()
  const [tab, setTab] = useTabs('p_tab', 0, history)
  const [academicYear, setAcademicYear] = useState(false)
  const [studyProgrammes, setStudyProgrammes] = useState(false)
  const [specialGroups, setSpecialGroups] = useState(false)
  const [graduatedGroup, setGraduatedGroup] = useState(false)
  const requiredRights = { rights, iamRights, isAdmin }

  const handleSelect = useCallback(
    faculty => {
      history.push(`/faculties/${faculty}`, { selected: faculty })
    },
    [history]
  )

  if (allFaculties.isLoading || allFaculties.isFetching) {
    return <Loader active style={{ marginTop: '10em' }} />
  }

  const getPanes = () => {
    const panes = [
      {
        menuItem: 'Basic information',
        render: () => (
          <BasicOverview
            faculty={faculty}
            academicYear={academicYear}
            setAcademicYear={setAcademicYear}
            studyProgrammes={studyProgrammes}
            setStudyProgrammes={setStudyProgrammes}
            specialGroups={specialGroups}
            setSpecialGroups={setSpecialGroups}
          />
        ),
      },
      {
        menuItem: 'Programmes and student populations',
        render: () => (
          <ProgrammeOverview
            faculty={faculty}
            graduatedGroup={graduatedGroup}
            setGraduatedGroup={setGraduatedGroup}
            specialGroups={specialGroups}
            setSpecialGroups={setSpecialGroups}
            requiredRights={requiredRights}
          />
        ),
      },
      {
        menuItem: 'Graduation times',
        render: () => (
          <TimesAndPathsView
            faculty={faculty}
            studyProgrammes={studyProgrammes}
            setStudyProgrammes={setStudyProgrammes}
          />
        ),
      },
    ]

    if (isAdmin) {
      panes.push({
        menuItem: 'Update statistics',
        render: () => <UpdateView faculty={faculty?.code} />,
      })
    }

    return panes
  }

  const panes = getPanes()

  if (!facultyCode)
    return (
      <div className="segmentContainer">
        <Header className="segmentTitle" size="large">
          Faculty statistics
        </Header>
        <Segment className="contentSegment">
          <FacultySelector faculties={faculties} selected={facultyCode !== undefined} handleSelect={handleSelect} />
        </Segment>
      </div>
    )

  return (
    <div className="segmentContainer" data-cy="FacultySegmentContainer">
      <Segment className="contentSegment">
        <div align="center" style={{ padding: '30px' }}>
          <Header textAlign="center">{facultyName}</Header>
          <span>{facultyCode}</span>
        </div>
        <Tab panes={panes} activeIndex={tab} onTabChange={setTab} />
      </Segment>
    </div>
  )
}

export default withRouter(FacultyStatistics)
