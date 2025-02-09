import React from 'react'
import { Popup, Icon } from 'semantic-ui-react'
import { copyToClipboard } from 'common'

export const getCopyableEmailColumn = ({ popupStates, copyToClipboardAll, handlePopupOpen, handlePopupClose }) => {
  return {
    mergeHeader: true,
    merge: true,
    key: 'email',
    export: false,
    sortable: false,
    children: [
      {
        key: 'emailValue',
        sortable: false,
        title: (
          <>
            Email
            <Popup
              trigger={
                <Icon
                  size="large"
                  link
                  name="copy"
                  onClick={copyToClipboardAll}
                  style={{ float: 'right', marginLeft: '0.25em' }}
                  color="grey"
                />
              }
              content="Copied email list!"
              on="click"
              open={popupStates['0']}
              onClose={() => handlePopupClose('0')}
              onOpen={() => handlePopupOpen('0')}
              position="top right"
            />
          </>
        ),
        textTitle: 'Email',
        getRowVal: s => s.email,
      },
      {
        key: 'copyEmail',
        textTitle: 'Secondary email',
        sortable: false,
        getRowVal: s => s.secondaryEmail,
        getRowContent: s =>
          s.email && !s.obfuscated ? (
            <Popup
              trigger={
                <Icon
                  link
                  name="copy outline"
                  onClick={() => {
                    copyToClipboard(s.email)
                  }}
                  style={{ float: 'right' }}
                />
              }
              content="Email copied!"
              on="click"
              open={popupStates[s.studentNumber]}
              onClose={() => handlePopupClose(s.studentNumber)}
              onOpen={() => handlePopupOpen(s.studentNumber)}
              position="top right"
            />
          ) : null,
        cellProps: { className: 'iconCellNoPointer' },
      },
    ],
  }
}

export const hiddenNameAndEmailForExcel = [
  {
    key: 'hidden-lastname',
    title: 'Last name',
    getRowVal: s => s.lastname,
    export: true,
  },
  {
    key: 'hidden-firstnames',
    title: 'First names',
    getRowVal: s => s.firstnames,
    export: true,
  },
  {
    key: 'hidden-email',
    title: 'E-mail',
    getRowVal: s => s.email ?? '',
    export: true,
  },
  {
    key: 'hidden-secondary-email',
    title: 'Secondary E-mail',
    getRowVal: s => s.secondaryEmail ?? '',
    export: true,
  },
]
