import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { AiAssistantDropdown } from 'components/ui/AiAssistantDropdown'
import { InlineLink } from 'components/ui/InlineLink'
import { Box, ExternalLink, EyeOff, Globe } from 'lucide-react'
import Link from 'next/link'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { Button } from 'ui'

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
      <Globe size={15} strokeWidth={1.5} className="text-foreground-muted" />
    ) : (
      <Box size={15} strokeWidth={1.5} className="text-foreground-muted" />
    )
  const entityValue =
    item.sourceData.type === 'banned-ip' ? item.sourceData.ip : item.sourceData.bucketId
  const detailDescription = item.detailDescription ?? item.description

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
      <div className="flex items-center gap-1 px-2 py-0.5 bg-surface-200 border rounded-lg text-sm mb-6 w-fit">
        {entityIcon}
        <span>{entityValue}</span>
      </div>

      <h3 className="text-sm mb-2">Issue</h3>
      <p className="text-sm text-foreground-light mb-6">
        {detailDescription}{' '}
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
              <span className="flex items-center gap-2">
                <ExternalLink size={14} strokeWidth={1.5} />
                {action.label}
              </span>
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
