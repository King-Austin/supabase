import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { handleError, post } from 'data/fetchers'
import type { SubscriptionTier } from 'data/subscriptions/types'
import type { ResponseError, UseCustomQueryOptions } from 'types'

import { organizationKeys } from './keys'
import type { CustomerAddress, CustomerTaxId } from './types'

export type OrganizationBillingSubscriptionPreviewVariables = {
  organizationSlug?: string
  tier?: SubscriptionTier
  address?: CustomerAddress
  taxId?: CustomerTaxId
}

export type OrganizationBillingSubscriptionPreviewResponse = {
  breakdown: {
    description: string
    unit_price: number
    unit_price_desc?: string
    quantity?: number
    total_price: number
    breakdown?: {
      project_name: string
      project_ref: string
      usage: number
    }[]
  }[]
  number_of_projects?: number
  plan_change_type?: 'downgrade' | 'none' | 'upgrade'
  active_projects?: {
    status:
      | 'INACTIVE'
      | 'ACTIVE_HEALTHY'
      | 'ACTIVE_UNHEALTHY'
      | 'COMING_UP'
      | 'UNKNOWN'
      | 'GOING_DOWN'
      | 'INIT_FAILED'
      | 'REMOVED'
      | 'RESTORING'
      | 'RESTARTING'
      | 'RESIZING'
      | 'UPGRADING'
    instance_size: string
    name: string
    ref: string
  }[]
  billed_via_partner?: boolean
  upfront_charge: {
    customer_balance: number
    prorated_credit: number
    taxable_amount: number
    total: number
    tax?: {
      tax_amount: number
      total_amount_excluding_tax: number
      total_amount_including_tax: number
      tax_rate_percentage: number
      currency: string
    }
  }
}

export async function previewOrganizationBillingSubscription({
  organizationSlug,
  tier,
  address,
  taxId,
}: OrganizationBillingSubscriptionPreviewVariables) {
  if (!organizationSlug) throw new Error('organizationSlug is required')
  if (!tier) throw new Error('tier is required')

  const { data, error } = await post(
    `/platform/organizations/{slug}/billing/subscription/preview`,
    {
      params: { path: { slug: organizationSlug } },
      body: {
        tier,
        ...(address && { address }),
        ...(taxId && { tax_id: taxId }),
      },
      headers: {
        Version: '2',
      },
    }
  )

  if (error) handleError(error)

  return data as OrganizationBillingSubscriptionPreviewResponse
}

export type OrganizationBillingSubscriptionPreviewData = Awaited<
  ReturnType<typeof previewOrganizationBillingSubscription>
>

export const useOrganizationBillingSubscriptionPreview = <
  TData = OrganizationBillingSubscriptionPreviewData,
>(
  { organizationSlug, tier, address, taxId }: OrganizationBillingSubscriptionPreviewVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<OrganizationBillingSubscriptionPreviewData, ResponseError, TData> = {}
) =>
  useQuery<OrganizationBillingSubscriptionPreviewData, ResponseError, TData>({
    queryKey: organizationKeys.subscriptionPreview(organizationSlug, tier, {
      ...address,
      ...taxId,
    } as Record<string, unknown> | undefined),
    queryFn: () =>
      previewOrganizationBillingSubscription({ organizationSlug, tier, address, taxId }),
    enabled: enabled && typeof organizationSlug !== 'undefined' && typeof tier !== 'undefined',
    placeholderData: keepPreviousData,
    ...options,
  })
