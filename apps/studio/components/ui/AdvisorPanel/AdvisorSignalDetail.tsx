import { ExternalLink, EyeOff } from 'lucide-react'
import { InlineLink } from 'components/ui/InlineLink'
import Link from 'next/link'
import { Button } from 'ui'

import type { AdvisorSignalItem } from './AdvisorPanel.types'

interface AdvisorSignalDetailProps {
  item: AdvisorSignalItem
  onDismiss: (fingerprint: string) => void
}

export const AdvisorSignalDetail = ({ item, onDismiss }: AdvisorSignalDetailProps) => {
  const contextLabel = item.sourceData.type === 'banned-ip' ? 'IP address' : 'Bucket'
  const contextValue =
    item.sourceData.type === 'banned-ip' ? item.sourceData.ip : item.sourceData.bucketId
  const detailDescription = item.detailDescription ?? item.description

  return (
    <div>
      <h3 className="text-sm mb-2">Context</h3>
      <p className="text-sm text-foreground-light mb-6">
        {contextLabel}: {contextValue}
      </p>

      <h3 className="text-sm mb-2">Why this appears</h3>
      <p className="text-sm leading-6 text-foreground-light mb-6">
        {detailDescription}{' '}
        {item.learnMoreHref !== undefined && (
          <InlineLink href={item.learnMoreHref}>Learn more</InlineLink>
        )}
      </p>

      <h3 className="text-sm mb-2">Actions</h3>
      <div className="flex items-center gap-2">
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
