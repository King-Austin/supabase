import { useBannedIPsQuery } from 'data/banned-ips/banned-ips-query'
import { useBucketsQuery } from 'data/storage/buckets-query'
import { useMemo } from 'react'

import {
  ADVISOR_DEBUG_BANNED_IPS_ENV_VAR,
  createAdvisorSignalItems,
  getAdvisorDebugBannedIPs,
} from './AdvisorPanel.utils'
import { useAdvisorSignalDismissals } from './useAdvisorSignalDismissals'

// TODO(DEPR-430): Remove this local-only shim once network bans can be created for local testing.
const advisorDebugBannedIPs = getAdvisorDebugBannedIPs(
  process.env[ADVISOR_DEBUG_BANNED_IPS_ENV_VAR]
)

interface UseAdvisorSignalsOptions {
  projectRef?: string
  enabled?: boolean
}

export const useAdvisorSignals = ({
  projectRef,
  enabled = true,
}: UseAdvisorSignalsOptions = {}) => {
  const bannedIPsQuery = useBannedIPsQuery(
    { projectRef },
    {
      enabled,
    }
  )
  const bucketsQuery = useBucketsQuery(
    { projectRef },
    {
      enabled,
    }
  )
  const { dismissSignal, dismissedFingerprintSet } = useAdvisorSignalDismissals(projectRef)

  const data = useMemo(() => {
    const items = createAdvisorSignalItems({
      projectRef,
      bannedIPsData: bannedIPsQuery.data,
      debugBannedIPs: advisorDebugBannedIPs,
      buckets: bucketsQuery.data,
    })

    return items.filter((item) => !dismissedFingerprintSet.has(item.fingerprint))
  }, [projectRef, bannedIPsQuery.data, bucketsQuery.data, dismissedFingerprintSet])

  return {
    data,
    dismissSignal,
    isPending: bannedIPsQuery.isPending || bucketsQuery.isPending,
    isError: bannedIPsQuery.isError || bucketsQuery.isError,
  }
}
