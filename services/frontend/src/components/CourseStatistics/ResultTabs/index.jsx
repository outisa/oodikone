import React, { useState } from 'react'
import { Tab, Segment, Menu, Icon } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'
import qs from 'query-string'
import { useDispatch, useSelector } from 'react-redux'
import { getCourseStats } from 'redux/coursestats'
import { PassRate, PassRateSettings } from './Panes/passRate'
import { Distribution, DistributionSettings } from './Panes/distribution'
import { Tables, TablesSettings } from './Panes/tables'
import { useProgress, useTabs } from '../../../common/hooks'

import './resultTabs.css'

const PaneContent = ({
  component: Component,
  settings: SettingsComponent,
  initialSettings,
  datasets,
  availableStats,
  updateQuery,
  ...rest
}) => {
  const [settings, setSettings] = useState(initialSettings)
  const [splitDirection, setSplitDirection] = useState('row')

  const toggleSeparate = separate => {
    setSettings({ ...settings, separate })
    updateQuery(separate)
  }

  return (
    <Tab.Pane>
      <Segment basic>
        <div style={{ display: 'flex', marginBottom: '2em' }}>
          <SettingsComponent
            value={settings}
            onChange={setSettings}
            onSeparateChange={toggleSeparate}
            availableStats={availableStats}
          />
          <div style={{ flexGrow: 1 }} />
          {datasets.filter(i => i).length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1em' }}>
              <label>Split direction: </label>
              <Menu style={{ margin: 0 }}>
                <Menu.Item active={splitDirection === 'row'} onClick={() => setSplitDirection('row')}>
                  <Icon name="arrows alternate horizontal" />
                </Menu.Item>
                <Menu.Item active={splitDirection === 'column'} onClick={() => setSplitDirection('column')}>
                  <Icon name="arrows alternate vertical" />
                </Menu.Item>
              </Menu>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: splitDirection, gap: '2em' }}>
          {datasets
            .filter(i => i)
            .map(data => (
              <div key={data.name} style={{ flexGrow: 1, flexBasis: 1, width: '100%' }}>
                <h3>{data.name}</h3>
                <Component data={data} settings={settings} {...rest} />
              </div>
            ))}
        </div>
      </Segment>
    </Tab.Pane>
  )
}

const ResultTabs = ({ primary, comparison, history, separate, availableStats, location }) => {
  const [tab, setTab] = useTabs('cs_tab', 0, history)
  const { userHasAccessToAllStats } = primary
  const courseStats = useSelector(({ courseStats }) => courseStats)
  const { pending: loading } = courseStats
  const { onProgress } = useProgress(loading)
  const dispatch = useDispatch()

  const handleTabChange = (...params) => {
    setTab(...params)
  }

  const updateSeparate = separate => {
    const { courseCodes, ...params } = qs.parse(location.search)
    const query = {
      ...params,
      courseCodes: JSON.parse(courseCodes),
      separate,
    }
    dispatch(getCourseStats(query, onProgress))
    const queryToString = { ...query, courseCodes: JSON.stringify(query.courseCodes) }
    history.replace({ search: qs.stringify(queryToString) })
  }

  const paneTypes = [
    {
      label: 'Tables',
      icon: 'table',
      initialSettings: { showDetails: false, viewMode: 'STUDENT', separate },
      settings: TablesSettings,
      component: Tables,
    },
    {
      label: 'Pass rate chart',
      icon: 'balance',
      initialSettings: { viewMode: 'STUDENT', separate },
      settings: PassRateSettings,
      component: PassRate,
    },
    {
      label: 'Grade distribution chart',
      icon: 'chart bar',
      initialSettings: { isRelative: false, viewMode: 'STUDENT' },
      settings: DistributionSettings,
      component: Distribution,
    },
  ]

  const panes = paneTypes.map(
    ({ icon, label, initialSettings, component: Component, settings: SettingsComponent }) => ({
      menuItem: { icon, content: label, key: label },
      render: () => (
        <PaneContent
          component={Component}
          settings={SettingsComponent}
          updateQuery={updateSeparate}
          userHasAccessToAllStats={userHasAccessToAllStats}
          initialSettings={initialSettings}
          datasets={[primary, comparison]}
          availableStats={availableStats}
        />
      ),
    })
  )

  return (
    <Segment loading={loading} basic>
      <Tab id="CourseStatPanes" panes={panes} onTabChange={handleTabChange} activeIndex={tab} />
    </Segment>
  )
}

export default withRouter(ResultTabs)
