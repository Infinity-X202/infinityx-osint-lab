import type { DatasetMeta, IntelRecord } from '@/types'
import { NADRA_DATASET, NADRA_RECORDS } from '@/data/nadraRecords'
import { PRIZE_DATASET, PRIZE_RECORDS } from '@/data/prizeWinners'

export const DATASETS: DatasetMeta[] = [PRIZE_DATASET, NADRA_DATASET]

export function buildSyntheticRecords(): IntelRecord[] {
  return [...PRIZE_RECORDS, ...NADRA_RECORDS]
}

export const SYNTHETIC_RECORDS = buildSyntheticRecords()
