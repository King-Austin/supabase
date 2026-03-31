import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { AiAssistantDropdown } from 'components/ui/AiAssistantDropdown'
import { InlineLink } from 'components/ui/InlineLink'
import { FilesBucket as FilesBucketIcon } from 'icons'
import { EyeOff, Globe } from 'lucide-react'
import Link from 'next/link'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import type { AdvisorSignalItem } from './AdvisorPanel.types'

interface AdvisorSignalDetailProps {
  item: AdvisorSignalItem
  onDismiss: (fingerprint: string) => void
}

const buildSignalAssistantPrompt = (item: AdvisorSignalItem) => {
  if (item.sourceData.type === 'public-bucket') {
    return [
      `I'm reviewing an Advisor signal for a public storage bucket named "${item.sourceData.bucketId}".`,
      item.detailDescription ?? item.description,
      'Help me assess whether this public bucket is appropriate, what risks it introduces, and what alternatives or mitigations I should consider.',
      'Please suggest the clearest next step and when it is reasonable to dismiss this signal.',
    ].join('\n\n')
  }

  return [
    `I'm reviewing an Advisor signal for a banned IP address: ${item.sourceData.ip}.`,
    item.detailDescription ?? item.description,
    'Help me assess whether this ban should remain in place, what I should investigate before removing it, and what the safest next step is.',
    'Please include when it is reasonable to dismiss this signal versus remove the ban.',
  ].join('\n\n')
}

export const AdvisorSignalDetail = ({ item, onDismiss }: AdvisorSignalDetailProps) => {
  const snap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()

  const entityIcon =
    item.sourceData.type === 'banned-ip' ? (
      <Globe size={15} className="text-foreground-muted" />
    ) : (
      <FilesBucketIcon size={15} className="text-foreground-muted" />
    )
  const entityValue =
    item.sourceData.type === 'banned-ip' ? item.sourceData.ip : item.sourceData.bucketId
  const entityTooltip =
    item.sourceData.type === 'banned-ip'
      ? 'IP address currently blocked by network bans'
      : 'File storage bucket'
  const issueDescription =
    item.sourceData.type === 'banned-ip' ? (
      <>
        The IP address <code className="text-code-inline">{item.sourceData.ip}</code> is
        temporarily blocked because of suspicious traffic or repeated failed password attempts. If
        this block is expected, you can dismiss this signal or remove the ban.
      </>
    ) : (
      <>
        The bucket <code className="text-code-inline">{item.sourceData.bucketId}</code> is
        publicly readable, so anyone can list and access objects stored in it. Public buckets are
        often intentional, and you can dismiss this signal if that is expected.
      </>
    )

  const handleAskAssistant = () => {
    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    snap.newChat({
      name: `Review ${item.title.toLowerCase()}`,
      initialMessage: buildSignalAssistantPrompt(item),
    })
  }

  return (
    <div>
      <h3 className="text-sm mb-2">Entity</h3>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-2 py-0.5 bg-surface-200 border rounded-lg text-sm mb-6 w-fit">
            <span className="flex items-center text-foreground-muted" aria-hidden="true">
              {entityIcon}
            </span>
            <span>{entityValue}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">{entityTooltip}</TooltipContent>
      </Tooltip>

      <h3 className="text-sm mb-2">Issue</h3>
      <p className="text-sm text-foreground-light mb-6">
        {issueDescription}{' '}
        {item.learnMoreHref !== undefined && (
          <>
            <InlineLink href={item.learnMoreHref}>Learn more</InlineLink>.
          </>
        )}
      </p>

      <h3 className="text-sm mb-2">Resolve</h3>
      <div className="flex items-center gap-2">
        <AiAssistantDropdown
          label="Ask Assistant"
          buildPrompt={() => buildSignalAssistantPrompt(item)}
          onOpenAssistant={handleAskAssistant}
        />
        {item.actions.map((action) => (
          <Button key={`${item.fingerprint}-${action.href}`} type="default" asChild>
            <Link href={action.href}>
              <span className="flex items-center gap-2">{action.label}</span>
            </Link>
          </Button>
        ))}
        <Button
          type="default"
          icon={<EyeOff size={14} strokeWidth={1.5} />}
          onClick={() => onDismiss(item.fingerprint)}
        >
          Dismiss
        </Button>
      </div>
    </div>
  )
}
