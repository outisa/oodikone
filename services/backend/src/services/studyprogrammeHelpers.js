const { studentnumbersWithAllStudyrightElements } = require('./populations')
const { codes } = require('../../config/programmeCodes')

// Helper functions
const getCorrectStudentnumbers = async ({
  codes,
  startDate,
  endDate,
  includeAllSpecials,
  includeTransferredTo,
  includeGraduated = true,
}) => {
  let studentnumbers = []
  const exchangeStudents = includeAllSpecials
  const nondegreeStudents = includeAllSpecials
  const transferredOutStudents = includeAllSpecials
  const transferredToStudents = includeTransferredTo
  const graduatedStudents = includeGraduated

  studentnumbers = await studentnumbersWithAllStudyrightElements({
    studyRights: codes,
    startDate,
    endDate,
    exchangeStudents,
    nondegreeStudents,
    transferredOutStudents,
    tag: null,
    transferredToStudents,
    graduatedStudents,
  })

  return studentnumbers
}

const resolveStudyRightCode = studyright_elements => {
  if (!studyright_elements) return null
  const studyRightElement = studyright_elements
    .filter(sre => sre.element_detail.type === 20)
    .sort((a, b) => new Date(b.startdate) - new Date(a.startdate))[0]
  if (studyRightElement) return studyRightElement.code
  return null
}

const formatStudyright = studyright => {
  const {
    studyrightid,
    startdate,
    studystartdate,
    enddate,
    givendate,
    graduated,
    active,
    prioritycode,
    extentcode,
    student,
    studyright_elements,
    cancelled,
    facultyCode,
  } = studyright

  return {
    studyrightid,
    startdate,
    studystartdate,
    enddate,
    givendate,
    graduated,
    active,
    prioritycode,
    extentcode,
    studentNumber: student.studentnumber,
    code: resolveStudyRightCode(studyright_elements),
    studyrightElements: studyright_elements,
    cancelled,
    facultyCode,
    name:
      studyright_elements?.length && studyright_elements[0].element_detail && studyright_elements[0].element_detail.name
        ? studyright_elements[0].element_detail.name
        : null,
  }
}

const formatStudent = student => {
  const { studentnumber, gender_code, home_country_en, creditcount, credits } = student
  return {
    studentNumber: studentnumber,
    genderCode: gender_code,
    homeCountryEn: home_country_en,
    creditcount,
    credits,
  }
}

const formatCredit = credit => {
  const { student_studentnumber, course_code, credits, attainment_date } = credit
  const code = course_code.replace('AY', '')
  return {
    id: `${student_studentnumber}-${code}`, // For getting unique credits for each course code and student number
    studentNumber: student_studentnumber,
    courseCode: code,
    credits,
    attainmentDate: attainment_date,
  }
}

const formatTransfer = transfer => {
  const { sourcecode, targetcode, transferdate, studyrightid } = transfer
  return {
    sourcecode,
    targetcode,
    transferdate,
    studyrightid,
  }
}

const getYearsArray = (since, isAcademicYear, yearsCombined) => {
  const years = []
  const allYears = 'Total'
  if (yearsCombined) years.push(allYears)
  const today = new Date()
  const until = isAcademicYear && today.getMonth() < 7 ? today.getFullYear() - 1 : today.getFullYear()
  for (let i = since; i <= until; i++) {
    const year = isAcademicYear ? `${i} - ${i + 1}` : i
    years.push(year)
  }
  return years
}

const getYearsObject = ({ years, emptyArrays = false }) => {
  let yearsObject = {}
  for (const year of years) {
    yearsObject = { ...yearsObject, [year]: emptyArrays ? [] : 0 }
  }
  return yearsObject
}

const getAcademicYearsObject = ({ years, emptyArrays = false }) => {
  let yearsObject = {}
  for (const year of years) {
    yearsObject = { ...yearsObject, [`${year} - ${year + 1}`]: emptyArrays ? [] : 0 }
  }
  return yearsObject
}

const getStatsBasis = years => {
  return {
    graphStats: new Array(years.length).fill(0),
    tableStats: getYearsObject({ years }),
  }
}
// Take studystartdate for master students with Bachelor-Master studyright.
const getCorrectStartDate = studyright => {
  return studyright.studyrightid.slice(-2) === '-2' && studyright.extentcode === 2
    ? studyright.studystartdate
    : studyright.startdate
}

const isMajorStudentCredit = (studyrights, attainmentDate, code) =>
  studyrights.some(studyright => {
    if (!studyright) return false
    if (studyright.code !== code) return false
    if ([6, 7, 9, 13, 14, 16, 18, 22, 23, 34, 99].includes(studyright.extentcode)) return false
    const startDate = getCorrectStartDate(studyright)
    if (!studyright.graduated) return new Date(attainmentDate) >= new Date(startDate)
    return new Date(attainmentDate) >= new Date(startDate) && new Date(attainmentDate) <= new Date(studyright.enddate)
  })

const isNonMajorCredit = (studyrights, attainmentDate) => {
  return studyrights.some(studyright => {
    if (!studyright) return false
    if ([6, 7, 9, 13, 14, 16, 18, 22, 23, 34, 99].includes(studyright.extentcode)) return false
    const startDate = getCorrectStartDate(studyright)
    if (!studyright.graduated) return new Date(attainmentDate) >= new Date(startDate)
    return new Date(attainmentDate) >= new Date(startDate) && new Date(attainmentDate) <= new Date(studyright.enddate)
  })
}

const isSpecialGroupCredit = (studyrights, attainment_date, transfers) =>
  studyrights.some(studyright => {
    if (!studyright) return true // If there is no studyright matching the credit, is not a major student credit
    const startDate = getCorrectStartDate(studyright)
    if (new Date(startDate) > new Date(attainment_date)) return true // Credits before the studyright started are not major student credits
    if (studyright.enddate && new Date(attainment_date) > new Date(studyright.enddate)) return true // Credits after studyright are not major student credits
    if ([6, 7, 9, 13, 14, 16, 18, 22, 23, 34, 99].includes(studyright.extentcode)) return true // Excludes non-degree studyrights and exchange students
    if (transfers.includes(studyright.studyrightid)) return true // Excludes both transfers in and out of the programme
    return false
  })

const getMedian = values => {
  if (values.length === 0) return 0
  values.sort((a, b) => a - b)
  const half = Math.floor(values.length / 2)
  if (values.length % 2) return values[half]
  return (values[half - 1] + values[half]) / 2.0
}

const defineYear = (date, isAcademicYear) => {
  if (!date) return ''
  const year = date.getFullYear()
  if (!isAcademicYear) return year
  // Some dates are given in utc time in database, some not.
  if (new Date(date).toISOString() < new Date(`${year}-07-31T21:00:00.000Z`).toISOString())
    return `${year - 1} - ${year}`
  return `${year} - ${year + 1}`
}

const getStartDate = (studyprogramme, isAcademicYear) => {
  if ((studyprogramme.includes('KH') || studyprogramme.includes('MH')) && isAcademicYear) return new Date('2017-08-01')
  if (studyprogramme.includes('KH') || studyprogramme.includes('MH')) return new Date('2017-01-01')
  if (isAcademicYear) return new Date('2017-08-01')
  return new Date('2017-01-01')
}

const alltimeStartDate = new Date('1900-01-01')
const alltimeEndDate = new Date()

// In the object programmes should be {bachelorCode: masterCode}
const combinedStudyprogrammes = { KH90_001: 'MH90_001' }

// There are 9 course_unit_types
// 1. urn:code:course-unit-type:regular
// 2. urn:code:course-unit-type:bachelors-thesis
// 3. urn:code:course-unit-type:masters-thesis
// 4. urn:code:course-unit-type:doctors-thesis
// 5. urn:code:course-unit-type:licentiate-thesis
// 6. urn:code:course-unit-type:bachelors-maturity-examination
// 7. urn:code:course-unit-type:masters-maturity-examination
// 8. urn:code:course-unit-type:communication-and-linguistic-studies
// 9. urn:code:course-unit-type:practical-training-homeland
// Four of these are thesis types

const getThesisType = studyprogramme => {
  if (studyprogramme.includes('MH') || studyprogramme.includes('ma'))
    return ['urn:code:course-unit-type:masters-thesis']
  if (studyprogramme.includes('KH') || studyprogramme.includes('ba'))
    return ['urn:code:course-unit-type:bachelors-thesis']
  if (/^(T)[0-9]{6}$/.test(studyprogramme))
    return ['urn:code:course-unit-type:doctors-thesis', 'urn:code:course-unit-type:licentiate-thesis']
  return ['urn:code:course-unit-type:doctors-thesis', 'urn:code:course-unit-type:licentiate-thesis']
}

const getPercentage = (value, total) => {
  if (typeof value !== 'number' || typeof total !== 'number') return 'NA'
  if (total === 0) return 'NA'
  if (value === 0) return '0 %'
  return `${((value / total) * 100).toFixed(1)} %`
}

const getEmptyArray = length => new Array(length).fill(0)

const getBachelorCreditGraphStats = years => ({
  lte15: {
    name: 'Less than 15 credits',
    data: getEmptyArray(years.length),
  },
  lte30: {
    name: '15-29 credits',
    data: getEmptyArray(years.length),
  },
  lte60: {
    name: '30-59 credits',
    data: getEmptyArray(years.length),
  },
  lte90: {
    name: '60-89 credits',
    data: getEmptyArray(years.length),
  },
  lte120: {
    name: '90-119 credits',
    data: getEmptyArray(years.length),
  },
  lte150: {
    name: '120-149 credits',
    data: getEmptyArray(years.length),
  },
  lte180: {
    name: '150-179 credits',
    data: getEmptyArray(years.length),
  },
  mte180: {
    name: '180 or more credits',
    data: getEmptyArray(years.length),
  },
})

const getBachelorMasterCreditGraphStats = years => ({
  lte200: {
    name: 'Less than 200 credits',
    data: getEmptyArray(years.length),
  },
  lte220: {
    name: '200-219 credits',
    data: getEmptyArray(years.length),
  },
  lte240: {
    name: '220-239 credits',
    data: getEmptyArray(years.length),
  },
  lte260: {
    name: '240-259 credits',
    data: getEmptyArray(years.length),
  },
  lte280: {
    name: '260-279 credits',
    data: getEmptyArray(years.length),
  },
  lte300: {
    name: '280-299 credits',
    data: getEmptyArray(years.length),
  },
  mte300: {
    name: '300 or more credits',
    data: getEmptyArray(years.length),
  },
})

const getVetenaryCreditGraphStats = years => ({
  lte210: {
    name: 'Less than 210 credits',
    data: getEmptyArray(years.length),
  },
  lte240: {
    name: '210-239 credits',
    data: getEmptyArray(years.length),
  },
  lte270: {
    name: '240-269 credits',
    data: getEmptyArray(years.length),
  },
  lte300: {
    name: '270-299 credits',
    data: getEmptyArray(years.length),
  },
  lte330: {
    name: '300-329 credits',
    data: getEmptyArray(years.length),
  },
  lte360: {
    name: '330-359 credits',
    data: getEmptyArray(years.length),
  },
  mte360: {
    name: '360 or more credits',
    data: getEmptyArray(years.length),
  },
})

const getCombinedVetenaryCreditGraphStats = years => ({
  lte30: {
    name: 'Less than 30 credits',
    data: getEmptyArray(years.length),
  },
  lte60: {
    name: '30-59 credits',
    data: getEmptyArray(years.length),
  },
  lte120: {
    name: '60-179 credits',
    data: getEmptyArray(years.length),
  },
  lte180: {
    name: '180-239 credits',
    data: getEmptyArray(years.length),
  },
  lte240: {
    name: '240-299 credits',
    data: getEmptyArray(years.length),
  },
  lte300: {
    name: '300-359 credits',
    data: getEmptyArray(years.length),
  },
  lte360: {
    name: '300-359 credits',
    data: getEmptyArray(years.length),
  },
  mte360: {
    name: '360 or more credits',
    data: getEmptyArray(years.length),
  },
})

const getMasterCreditGraphStats = years => ({
  lte15: {
    name: 'Less than 15 credits',
    data: getEmptyArray(years.length),
  },
  lte30: {
    name: '15-29 credits',
    data: getEmptyArray(years.length),
  },
  lte60: {
    name: '30-59 credits',
    data: getEmptyArray(years.length),
  },
  lte90: {
    name: '60-89 credits',
    data: getEmptyArray(years.length),
  },
  lte120: {
    name: '90-119 credits',
    data: getEmptyArray(years.length),
  },
  mte120: {
    name: '120 or more credits',
    data: getEmptyArray(years.length),
  },
})

const getDoctoralCreditGraphStats = years => ({
  lte10: {
    name: 'Less than 10 credits',
    data: getEmptyArray(years.length),
  },
  lte20: {
    name: '10-19 credits',
    data: getEmptyArray(years.length),
  },
  lte30: {
    name: '20-29 credits',
    data: getEmptyArray(years.length),
  },
  lte40: {
    name: '30-39 credits',
    data: getEmptyArray(years.length),
  },
  mte40: {
    name: '40 or more credits',
    data: getEmptyArray(years.length),
  },
})

const getCreditGraphStats = (studyprogramme, years, combinedVetenary, masterStudyRightOnly = false) => {
  if (combinedVetenary) return getCombinedVetenaryCreditGraphStats(years)
  if (studyprogramme.includes('KH')) return getBachelorCreditGraphStats(years)
  if (studyprogramme === 'MH90_001')
    return masterStudyRightOnly ? getBachelorCreditGraphStats(years) : getVetenaryCreditGraphStats(years)
  if (studyprogramme.includes('MH'))
    return masterStudyRightOnly ? getMasterCreditGraphStats(years) : getBachelorMasterCreditGraphStats(years)
  return getDoctoralCreditGraphStats(years)
}

const bachelorCreditThresholds = ['lte15', 'lte30', 'lte60', 'lte90', 'lte120', 'lte150', 'lte180', 'mte180']
const bachelorMasterCreditThresholds = ['lte200', 'lte220', 'lte240', 'lte260', 'lte280', 'lte300', 'mte300']
const masterCreditThresholds = ['lte15', 'lte30', 'lte60', 'lte90', 'lte120', 'mte120']
const doctoralCreditThresholds = ['lte10', 'lte20', 'lte30', 'lte40', 'mte40']
const bachelorCreditAmounts = [15, 30, 60, 90, 120, 150, 180, 180]
const bachelorMasterCreditAmounts = [200, 220, 240, 260, 280, 300, 300]
const masterCreditAmounts = [15, 30, 60, 90, 120, 120]
const doctoralCreditAmounts = [10, 20, 30, 40, 40]
const vetenaryCreditThresholds = ['lte210', 'lte240', 'lte270', 'lte300', 'lte330', 'lte360', 'mte360']
const vetenaryCreditAmounts = [210, 240, 270, 300, 330, 360, 360]
const combinedVetenaryThresholds = ['lte30', 'lte60', 'lte120', 'lte180', 'lte240', 'lte300', 'lte360', 'mte360']
const combinedVetenaryAmounts = [30, 60, 120, 180, 240, 300, 360, 360]

const getCreditThresholds = (studyprogramme, combinedVetenary, masterStudyRightOnly = false) => {
  if (combinedVetenary)
    return { creditThresholdKeys: combinedVetenaryThresholds, creditThresholdAmounts: combinedVetenaryAmounts }
  if (studyprogramme === 'MH90_001') {
    return masterStudyRightOnly
      ? { creditThresholdKeys: bachelorCreditThresholds, creditThresholdAmounts: bachelorCreditAmounts }
      : { creditThresholdKeys: vetenaryCreditThresholds, creditThresholdAmounts: vetenaryCreditAmounts }
  }
  if (studyprogramme.includes('KH')) {
    return { creditThresholdKeys: bachelorCreditThresholds, creditThresholdAmounts: bachelorCreditAmounts }
  }
  if (studyprogramme.includes('MH')) {
    return masterStudyRightOnly
      ? { creditThresholdKeys: masterCreditThresholds, creditThresholdAmounts: masterCreditAmounts }
      : { creditThresholdKeys: bachelorMasterCreditThresholds, creditThresholdAmounts: bachelorMasterCreditAmounts }
  }
  return { creditThresholdKeys: doctoralCreditThresholds, creditThresholdAmounts: doctoralCreditAmounts }
}

const tableTitles = {
  basics: {
    SPECIAL_EXCLUDED: ['', 'Started studying', 'Graduated'],
    SPECIAL_INCLUDED: ['', 'Started studying', 'Graduated', 'Transferred away', 'Transferred to'],
    SPECIAL_EXCLUDED_COMBINED_PROGRAMME: [
      '',
      'Started studying bachelor',
      'Started studying licentiate',
      'Graduated bachelor',
      'Graduated licentiate',
    ],
    SPECIAL_INCLUDED_COMBINED_PROGRAMME: [
      '',
      'Started studying bachelor',
      'Started studying licentiate',
      'Graduated bachelor',
      'Graduated licentiate',
      'Transferred away',
      'Transferred to',
    ],
  },
  credits: {
    SPECIAL_EXCLUDED: ['', 'Total', 'Major students credits', 'Transferred credits'],
    SPECIAL_INCLUDED: [
      '',
      'Total',
      'Major students credits',
      'Non-major students credits',
      'Non-degree students credits',
      'Transferred credits',
    ],
  },
  creditProgress: {
    bachelor: [
      '',
      'All',
      '< 15 credits',
      '15-29 credits',
      '30-59 credits',
      '60-89 credits',
      '90-119 credits',
      '120-149 credits',
      '150-179 credits',
      '180 ≤ credits',
    ],
    bachelorMaster: [
      '',
      'All',
      '< 200 credits',
      '200-219 credits',
      '220-239 credits',
      '240-259 credits',
      '260-279 credits',
      '280-299 credits',
      '300 ≤ credits',
    ],
    master: [
      '',
      'All',
      '< 15 credits',
      '15-29 credits',
      '30-59 credits',
      '60-89 credits',
      '90-119 credits',
      '120 ≤ credits',
    ],
    combinedVetenary: [
      '',
      'All',
      '< 30 credits',
      '30-59 credits',
      '60-119 credits',
      '120-179 credits',
      '180-239 credits',
      '240-299 credits',
      '300-359 credits',
      '360 ≤ credits',
    ],
    doctoral: ['', 'All', '< 10 credits', '10-19 credits', '20-29 credits', '30-39 credits', '40 ≤ credits'],
  },
  studytracksStart: ['', 'All', 'Started studying', 'Currently enrolled', 'Absent', 'Inactive'],
  studytracksBasic: ['Graduated'],
  studytracksCombined: {
    licentiate: ['Graduated bachelor', 'Graduated licentiate'],
    master: ['Graduated bachelor', 'Graduated master'],
  },
  studytracksEnd: ['Men', 'Women', 'Other/\nUnknown', 'Finland', 'Other'],
}

const getCreditProgressTableTitles = (studyprogramme, combinedVetenaryProgramme, masterProgrammeOnly = false) => {
  if (combinedVetenaryProgramme) return tableTitles.creditProgress.combinedVetenary
  if (studyprogramme.includes('KH')) return tableTitles.creditProgress.bachelor
  if (studyprogramme.includes('MH'))
    return masterProgrammeOnly ? tableTitles.creditProgress.master : tableTitles.creditProgress.bachelorMaster
  return tableTitles.creditProgress.doctoral
}

const mapCodesToIds = data => {
  // Add programme id e.g. TKT
  const keys = Object.keys(codes)
  const progs = Object.keys(data)

  for (const prog of progs) {
    if (keys.includes(prog)) {
      data[prog].progId = codes[prog].toUpperCase()
    }
  }
}

const getId = code => {
  if (Object.keys(codes).includes(code)) {
    return codes[code].toUpperCase()
  }
  return ''
}

const getGoal = programme => {
  if (!programme) return 0
  if (programme.startsWith('KH') || programme.endsWith('-ba')) {
    return 36
  }
  if (programme.startsWith('MH') || programme.endsWith('-ma')) {
    if (programme === 'MH90_001') return 36 // vetenary programme's licentiate is 36 months.
    if (['MH30_004', '420420-ma'].includes(programme)) {
      return 24 + 6
    }
    if (['MH30_001', 'MH30_003', '320011-ma', '320001-ma', '320002-ma'].includes(programme)) {
      return 36 + 24 + 12 // medical, no separate bachelor
    }
    return 24
  }
  if (programme.includes('T')) {
    return 48
  }
  if (programme.startsWith('LI')) {
    return 78
  }
  return 48 //unknown, likely old doctor or licentiate
}

module.exports = {
  getCorrectStudentnumbers,
  formatStudyright,
  formatStudent,
  formatTransfer,
  formatCredit,
  getYearsArray,
  getYearsObject,
  getAcademicYearsObject,
  getStatsBasis,
  isMajorStudentCredit,
  isSpecialGroupCredit,
  getMedian,
  defineYear,
  getStartDate,
  alltimeStartDate,
  alltimeEndDate,
  combinedStudyprogrammes,
  getThesisType,
  getPercentage,
  getBachelorCreditGraphStats,
  getBachelorMasterCreditGraphStats,
  getMasterCreditGraphStats,
  getVetenaryCreditGraphStats,
  getDoctoralCreditGraphStats,
  getCreditGraphStats,
  getCreditThresholds,
  tableTitles,
  getCreditProgressTableTitles,
  isNonMajorCredit,
  mapCodesToIds,
  getId,
  getGoal,
}
