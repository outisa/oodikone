import React from 'react'
import { Container, Header, Image, Divider, List, Button } from 'semantic-ui-react'
import moment from 'moment'
import { images } from '../common'
import { useTitle } from '../common/hooks'
// import { ShepherdTourContext } from 'react-shepherd'

export default () => {
  useTitle()
  //const tour = useContext(ShepherdTourContext)

  return (
    <div>
      <Container text style={{ paddingTop: 50 }} textAlign="justified">
        <Header as="h1" textAlign="center">
          Oodikone
        </Header>
        <Header as="h3" style={{ textAlign: 'center' }}>
          Exploratory Research on Study Data
        </Header>

        <Divider section />
        {process.env.NODE_ENV === 'development' && (
          <>
            <Header as="h3" style={{ textAlign: 'center' }}>
              How do I view...
            </Header>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gridRowGap: '1rem',
                maxWidth: '30rem',
                margin: '0 auto'
              }}
            >
              <Button size="medium" /*onClick={tour.start}*/>The progress of graduated students over time?</Button>
              <Button size="medium">The statistics for a specific course?</Button>
              <Button size="medium">The total credit gain of all faculties?</Button>
            </div>

            <Divider section />
          </>
        )}

        <Header className="my-first-step" as="h4">
          Study Programme
        </Header>
        <List bulleted>
          <List.Item>
            <i>Search by Class:</i> Query a student population specified by a starting year and a study right. Oodikone
            will show you interactive statistics and visualizations for the population to be explored.
          </List.Item>
          <List.Item>
            <i>Overview:</i> View student progress and annual productivity for a given study programme.
          </List.Item>
        </List>

        <Divider section />

        <Header className="my-other-step" as="h4">
          Student Statistics
        </Header>
        <p>View detailed information for a given student.</p>

        <Divider section />

        <Header as="h4">Course Statistics</Header>
        <p>View statistics by course and year.</p>

        <Divider section />

        <Header as="h4">Trends</Header>
        <p>View many kinds visualizations of study progress and study programme status.</p>

        <Divider section />

        <Header as="h4">Feedback</Header>
        <p>
          For questions and suggestions, use either the feedback form or shoot an e-mail to{' '}
          <a href="mailto:grp-toska@helsinki.fi">grp-toska@helsinki.fi</a>.
        </p>

        <Divider section />

        <p>
          Oodikone was last updated on:{' '}
          {moment(process.env.BUILT_AT)
            .toDate()
            .toLocaleString()}
        </p>
      </Container>
      <Image src={images.toskaLogo} size="medium" centered style={{ bottom: 0 }} />
    </div>
  )
}
