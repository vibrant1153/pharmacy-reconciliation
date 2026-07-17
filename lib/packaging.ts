interface LevelLike {
  order: number
  quantityInParent: number | null
}

/**
 * How many base units does ONE unit at `targetOrder` represent?
 * e.g. Box(0) -> Strip(1, qty=10) -> Tablet(2, qty=10, base)
 * baseUnitsPerLevel(levels, 0) = 100  (1 box = 100 tablets)
 * baseUnitsPerLevel(levels, 1) = 10   (1 strip = 10 tablets)
 * baseUnitsPerLevel(levels, 2) = 1    (1 tablet = 1 tablet)
 */
export function baseUnitsPerLevel(levels: LevelLike[], targetOrder: number): number {
  const sorted = [...levels].sort((a, b) => a.order - b.order)
  let result = 1
  for (const level of sorted) {
    if (level.order > targetOrder) {
      result *= level.quantityInParent ?? 1
    }
  }
  return result
}