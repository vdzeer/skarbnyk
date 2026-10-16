import { useState } from 'react'

import { Button, Row, Stack, Text } from '~/components'
import { APP_NAME } from '~/services/brand'
import { copyText, downloadFile } from '~/services/download'
import { useT } from '~/services/i18n'

import { Key } from './styled'

/** Eight groups read best as two lines of four. */
const twoLines = (text: string) => {
  const groups = text.split('-')
  const half = Math.ceil(groups.length / 2)
  return `${groups.slice(0, half).join('-')}\n${groups.slice(half).join('-')}`
}

type Props = {
  recoveryText: string
}

/** The recovery key on screen, once, with ways to keep it. */
export const RecoveryKeyCard = ({ recoveryText }: Props) => {
  const t = useT()
  const [copied, setCopied] = useState(false)

  const copy = async () => setCopied(await copyText(recoveryText))

  const download = () =>
    downloadFile(
      t('recovery_file_name', { app: APP_NAME }),
      t('recovery_file_text', { app: APP_NAME, key: recoveryText }),
      'text/plain;charset=utf-8',
    )

  return (
    <Stack $gap="md">
      <Key aria-label={t('recovery_key_label')}>{twoLines(recoveryText)}</Key>
      <Row>
        <Button icon="copy" stretch onClick={copy}>
          {copied ? t('action_copied') : t('action_copy')}
        </Button>
        <Button icon="download" stretch onClick={download}>
          {t('recovery_download')}
        </Button>
      </Row>
      <Text variant="secondary" tone="muted">
        {t('recovery_hint')}
      </Text>
    </Stack>
  )
}
