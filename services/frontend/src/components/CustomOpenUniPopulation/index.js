import React, { useState } from 'react'
import { withRouter, useLocation, useHistory } from 'react-router-dom'
import { Message, Icon, Loader } from 'semantic-ui-react'
import moment from 'moment'
import { useGetSavedSearchesQuery } from 'redux/openUniPopulations'
import OpenUniPopulationResults from './OpenUniPopulationResults'
import { useTitle } from '../../common/hooks'
import CustomOpenUniSearch from './CustomOpenUniSearch'

const CustomOpenUniPopulation = () => {
  useTitle('Custom open uni population')
  const [fieldValues, setValues] = useState({})
  const location = useLocation()
  const history = useHistory()
  const savedSearches = useGetSavedSearchesQuery()
  const isFetchingOrLoading = savedSearches.isLoading || savedSearches.isFetching
  const isError = savedSearches.isError || (savedSearches.isSuccess && !savedSearches.data)

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>
  if (isFetchingOrLoading) return <Loader active style={{ marginTop: '15em' }} />
  return (
    <div className="segmentContainer">
      <Message style={{ maxWidth: '800px', fontSize: '16px' }}>
        <Message.Header>Open uni student population</Message.Header>
        <p>
          Here you can create custom population using a list of courses. Clicking the blue button will open a modal
          where you can enter a list of courses. <br />
          <Icon fitted name="check" color="green" />: Student has passed the course. <br />
          <Icon fitted name="times" color="red" />: Student has failed the course. <br />
          <Icon fitted name="minus" color="grey" />: Student has enrolled, but has not received any grade from the
          course. <br />
          <b>Empty cell</b>: Student has no enrollments for the course. <br />
        </p>
      </Message>
      <CustomOpenUniSearch
        setValues={setValues}
        savedSearches={savedSearches.data}
        location={location}
        history={history}
      />
      <div style={{ paddingTop: '25px', paddingBottom: '10px', fontSize: '20px' }}>
        {fieldValues && fieldValues.courseList?.length > 0 && (
          <p>
            <span style={{ color: '#484848' }}>Beginning of the search for all fields:</span>
            <span style={{ paddingLeft: '10px', fontWeight: '600' }}>
              {moment(fieldValues.startdate).format('DD.MM.YYYY')}
            </span>
            <br />
            <span style={{ color: '#484848' }}>End of the search for enrollments:</span>
            <span style={{ paddingLeft: '30px', fontWeight: '600' }}>
              {moment(fieldValues.enddate).format('DD.MM.YYYY')}
            </span>
          </p>
        )}
      </div>
      <div style={{ paddingTop: '25px' }}>
        {fieldValues && fieldValues.courseList?.length > 0 && <OpenUniPopulationResults fieldValues={fieldValues} />}
      </div>
    </div>
  )
}

export default withRouter(CustomOpenUniPopulation)
