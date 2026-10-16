'use client'

import { Button, Card, Stack, Text, Welcome } from '~/components'
import { useT } from '~/services/i18n'

import { useSignIn } from '../hooks'

export const SignInScreen = () => {
  const t = useT()
  const { signIn, pending, failed, signInForDevelopment } = useSignIn()

  return (
    <Welcome>
      <Card>
        <Stack $gap="md">
          <Text as="h2" variant="title">
            {t('signin_title')}
          </Text>
          <Text tone="muted">{t('signin_text')}</Text>
          <Button
            variant="primary"
            size="lg"
            disabled={pending}
            onClick={signIn}>
            {t('signin_google')}
          </Button>
          {signInForDevelopment ? (
            <Button onClick={signInForDevelopment}>{t('signin_dev')}</Button>
          ) : null}
          {failed ? (
            <Text variant="secondary" tone="danger">
              {t('signin_failed')}
            </Text>
          ) : null}
        </Stack>
      </Card>
    </Welcome>
  )
}
