import React, { useState } from 'react'
import { Button } from 'semantic-ui-react'
import Joyride from 'react-joyride'

const Tour = () => {
  const [runTour, setRunTour] = useState(false)

  return (
    <>
      <Button onClick={() => setRunTour(true)} size="mini">
        Start tour
      </Button>
      <Joyride
        debug
        continuous
        showProgress
        showSkipButton
        scrollToFirstStep
        showProgress
        steps={[
          {
            target: '.tour-time-range',
            content: 'Filter results by year',
            disableBeacon: true
          },
          {
            target: '.tour-comparison-group',
            content: 'Compare statistics between study programmes'
          },
          {
            target: '.tour-menu-attempts',
            content: 'Change stuff'
          },
          {
            target: '.tour-arrow-upwards',
            content: 'Access the detailed overview of population of a specific year'
          }
        ]}
        run={runTour}
      />
    </>
  )
}

export default Tour
