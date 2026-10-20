'use client'

import { useState } from 'react'
import { BellIcon, CheckCircleIcon, CopyIcon, RssIcon, WebhookIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { AsyncButton } from '../../../components/ui/async-button'
import { Field, FieldDescription, FieldError, FieldLabel } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '../../../components/ui/input-group'
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { demo, type PublicStatusCopy } from './data'

interface SubscribePopoverProps {
  copy: PublicStatusCopy
  feedUrl: string
  onSubscribe?: (email: string) => Promise<unknown> | unknown
  onSaveWebhook?: (url: string) => Promise<unknown> | unknown
}

function SubscribePopover({ copy, feedUrl, onSubscribe, onSaveWebhook }: SubscribePopoverProps) {
  const [email, setEmail] = useState('')
  const [endpoint, setEndpoint] = useState('')
  const [copied, setCopied] = useState(false)
  // A rejection's message, under the field it belongs to.
  const [failed, setFailed] = useState<{ email?: string; webhook?: string }>({})
  const run = async (field: 'email' | 'webhook', action: () => Promise<unknown> | unknown) => {
    setFailed({})
    try {
      await action()
    } catch (error) {
      setFailed({ [field]: error instanceof Error && error.message ? error.message : copy.failed })
      throw error
    }
  }
  return (
    <Popover>
      <PopoverTrigger render={<Button size="sm" />}>
        <BellIcon size={16} /> {copy.subscribe}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <Tabs defaultValue="email" className="gap-4">
          <TabsList variant="pill" aria-label={copy.subscribeBy} className="w-full">
            <TabsTrigger value="email" className="flex-1">
              {copy.email}
            </TabsTrigger>
            <TabsTrigger value="rss" className="flex-1">
              <RssIcon size={14} /> {copy.rss}
            </TabsTrigger>
            <TabsTrigger value="webhook" className="flex-1">
              <WebhookIcon size={14} /> {copy.webhook}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="email">
            <form noValidate onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-3">
              <Field invalid={!!failed.email}>
                <FieldLabel>{copy.email}</FieldLabel>
                <Input type="email" value={email} placeholder={copy.emailPlaceholder} onChange={(e) => setEmail(e.target.value)} />
                <FieldDescription>{copy.emailHint}</FieldDescription>
                {failed.email && <FieldError>{failed.email}</FieldError>}
              </Field>
              <AsyncButton
                type="submit"
                pendingLabel={copy.subscribing}
                successLabel={copy.subscribed}
                errorLabel={copy.invalidEmail}
                onAction={async () => {
                  const address = email.trim()
                  if (!/^\S+@\S+\.\S+$/.test(address)) throw new Error('invalid')
                  await run('email', () => (onSubscribe ? onSubscribe(address) : demo('PublicStatus: onSubscribe', 800)))
                }}
              >
                {copy.subscribeToUpdates}
              </AsyncButton>
            </form>
          </TabsContent>
          <TabsContent value="rss">
            <Field>
              <FieldLabel>{copy.feedUrl}</FieldLabel>
              <InputGroup>
                <InputGroupInput readOnly value={feedUrl} />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    aria-label={copied ? copy.copied : copy.copyFeed}
                    onClick={() => {
                      void navigator.clipboard?.writeText(feedUrl).catch(() => {})
                      setCopied(true)
                      setTimeout(() => setCopied(false), 1600)
                    }}
                  >
                    {copied ? <CheckCircleIcon trigger="mount" size={14} /> : <CopyIcon size={14} />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              <FieldDescription>{copy.feedHint}</FieldDescription>
            </Field>
          </TabsContent>
          <TabsContent value="webhook">
            <form noValidate onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-3">
              <Field invalid={!!failed.webhook}>
                <FieldLabel>{copy.endpoint}</FieldLabel>
                <Input type="url" value={endpoint} placeholder={copy.endpointPlaceholder} onChange={(e) => setEndpoint(e.target.value)} />
                <FieldDescription>{copy.webhookHint}</FieldDescription>
                {failed.webhook && <FieldError>{failed.webhook}</FieldError>}
              </Field>
              <AsyncButton
                type="submit"
                variant="outline"
                successLabel={copy.webhookSaved}
                errorLabel={copy.webhookFailed}
                onAction={() => run('webhook', () => (onSaveWebhook ? onSaveWebhook(endpoint.trim()) : demo('PublicStatus: onSaveWebhook', 700)))}
              >
                {copy.saveWebhook}
              </AsyncButton>
            </form>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}

export { SubscribePopover }
