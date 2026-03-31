import type { IPData } from 'data/banned-ips/banned-ips-query'
import type { Lint } from 'data/lint/lint-query'
import type { Notification } from 'data/notifications/notifications-v2-query'
import type { Bucket } from 'data/storage/buckets-query'
import { describe, expect, it } from 'vitest'

import {
  createAdvisorLintItems,
  createAdvisorNotificationItems,
  createAdvisorSignalDismissalStorageKey,
  createAdvisorSignalItems,
  createBannedIPSignalFingerprint,
  createPublicBucketSignalFingerprint,
  sortAdvisorItems,
} from './AdvisorPanel.utils'

const createBucket = (overrides: Partial<Bucket> = {}): Bucket =>
  ({
    id: 'avatars',
    name: 'avatars',
    owner: 'owner-id',
    public: true,
    allowed_mime_types: [],
    file_size_limit: undefined,
    type: 'STANDARD',
    created_at: '2026-03-01T00:00:00.000Z',
    updated_at: '2026-03-02T00:00:00.000Z',
    ...overrides,
  }) as Bucket

const createLint = (overrides: Partial<Lint> = {}): Lint =>
  ({
    cache_key: 'lint-1',
    name: 'unknown_lint',
    detail: 'Critical lint detail',
    level: 'ERROR',
    categories: ['SECURITY'],
    metadata: {},
    ...overrides,
  }) as Lint

const createNotification = (overrides: Partial<Notification> = {}): Notification =>
  ({
    id: 'notification-1',
    inserted_at: '2026-03-01T00:00:00.000Z',
    priority: 'Info',
    status: 'seen',
    data: {
      title: 'Notification title',
      message: 'Notification body',
      actions: [],
    },
    ...overrides,
  }) as Notification

describe('AdvisorPanel.utils', () => {
  it('creates one signal per banned IP', () => {
    const bannedIPsData = {
      banned_ipv4_addresses: ['203.0.113.10'],
    } as IPData

    const result = createAdvisorSignalItems({
      projectRef: 'project-ref',
      bannedIPsData,
    })

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      source: 'signal',
      signalType: 'banned-ip',
      fingerprint: 'signal:banned-ip:203.0.113.10:v1',
      title: 'Banned IP address',
    })
  })

  it('creates multiple signals when multiple banned IPs exist', () => {
    const result = createAdvisorSignalItems({
      projectRef: 'project-ref',
      bannedIPsData: {
        banned_ipv4_addresses: ['203.0.113.10', '203.0.113.11'],
      } as IPData,
    })

    expect(result.map((item) => item.fingerprint)).toEqual([
      'signal:banned-ip:203.0.113.10:v1',
      'signal:banned-ip:203.0.113.11:v1',
    ])
  })

  it('creates one signal per public bucket', () => {
    const result = createAdvisorSignalItems({
      projectRef: 'project-ref',
      buckets: [createBucket()],
    })

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      source: 'signal',
      signalType: 'public-bucket',
      fingerprint: 'signal:public-bucket:avatars:v1',
      title: 'Public storage bucket',
    })
  })

  it('creates multiple signals when multiple public buckets exist', () => {
    const result = createAdvisorSignalItems({
      projectRef: 'project-ref',
      buckets: [
        createBucket({ id: 'avatars', name: 'avatars' }),
        createBucket({ id: 'exports', name: 'exports', updated_at: '2026-03-03T00:00:00.000Z' }),
      ],
    })

    expect(result.map((item) => item.fingerprint)).toEqual([
      'signal:public-bucket:avatars:v1',
      'signal:public-bucket:exports:v1',
    ])
  })

  it('orders mixed lint, signal and notification items by severity and recency', () => {
    const lintItems = createAdvisorLintItems([
      createLint({ cache_key: 'lint-critical', detail: 'Critical lint detail' }),
    ])
    const signalItems = createAdvisorSignalItems({
      projectRef: 'project-ref',
      buckets: [createBucket({ id: 'exports', updated_at: '2026-03-04T00:00:00.000Z' })],
    })
    const notificationItems = createAdvisorNotificationItems([
      createNotification({
        id: 'notification-info',
        data: { title: 'Notification title', message: 'Body', actions: [] },
      }),
    ])

    const sorted = sortAdvisorItems([...notificationItems, ...signalItems, ...lintItems])

    expect(sorted.map((item) => item.source)).toEqual(['lint', 'signal', 'notification'])
  })

  it('uses exact resource fingerprints so dismissing one bucket does not hide another', () => {
    const dismissedFingerprint = createPublicBucketSignalFingerprint('avatars')
    const signals = createAdvisorSignalItems({
      projectRef: 'project-ref',
      buckets: [
        createBucket({ id: 'avatars', name: 'avatars' }),
        createBucket({ id: 'exports', name: 'exports' }),
      ],
    })

    const visibleSignals = signals.filter((item) => item.fingerprint !== dismissedFingerprint)

    expect(visibleSignals.map((item) => item.fingerprint)).toEqual([
      'signal:public-bucket:exports:v1',
    ])
  })

  it('uses exact resource fingerprints so dismissing one IP does not hide another', () => {
    const dismissedFingerprint = createBannedIPSignalFingerprint('203.0.113.10')
    const signals = createAdvisorSignalItems({
      projectRef: 'project-ref',
      bannedIPsData: {
        banned_ipv4_addresses: ['203.0.113.10', '203.0.113.11'],
      } as IPData,
    })

    const visibleSignals = signals.filter((item) => item.fingerprint !== dismissedFingerprint)

    expect(visibleSignals.map((item) => item.fingerprint)).toEqual([
      'signal:banned-ip:203.0.113.11:v1',
    ])
  })

  it('builds project-scoped dismissal storage keys', () => {
    expect(createAdvisorSignalDismissalStorageKey('project-a')).toBe(
      'advisor-signal-dismissals:project-a'
    )
    expect(createAdvisorSignalDismissalStorageKey('project-b')).toBe(
      'advisor-signal-dismissals:project-b'
    )
  })
})
