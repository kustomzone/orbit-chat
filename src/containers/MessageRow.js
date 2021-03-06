'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import classNames from 'classnames'

import MessageTimestamp from 'components/MessageTimestamp'
import MessageUser from 'components/MessageUser'
import MessageContent from 'components/MessageContent'

import 'styles/Message.scss'

function MessageRow ({
  message,
  colorifyUsernames,
  useEmojis,
  emojiSet,
  useLargeMessage,
  useMonospaceFont,
  highlightWords
}) {
  const isCommand = message.Post.content && message.Post.content.startsWith('/me')

  return (
    <div className={classNames('Message', { large: useLargeMessage, monospace: useMonospaceFont })}>
      <MessageTimestamp message={message} />
      <MessageUser message={message} colorify={colorifyUsernames} isCommand={isCommand} />
      <MessageContent
        message={message}
        useEmojis={useEmojis}
        emojiSet={emojiSet}
        isCommand={isCommand}
        highlightWords={highlightWords}
      />
    </div>
  )
}

MessageRow.propTypes = {
  message: PropTypes.object.isRequired,
  colorifyUsernames: PropTypes.bool,
  useEmojis: PropTypes.bool,
  emojiSet: PropTypes.string.isRequired,
  useLargeMessage: PropTypes.bool,
  useMonospaceFont: PropTypes.bool,
  highlightWords: PropTypes.array
}

MessageRow.defaultProps = {
  colorifyUsernames: true,
  useEmojis: true,
  useLargeMessage: false,
  useMonospaceFont: false,
  highlightWords: []
}

export default observer(MessageRow)
