import type { Direction } from './format'
import styles from './market.module.css'

/**
 * Colour by direction of change.
 *
 * A gain and a loss are distinguishable by their sign as well as their colour,
 * so the meaning survives for anyone who cannot rely on colour alone.
 */

/** For inline text on an existing type scale, such as a quote's change. */
export const DIRECTION_TEXT_CLASS: Record<Direction, string> = {
  up: styles.up,
  down: styles.down,
  flat: styles.flat,
}

/**
 * For a standalone stat value, which carries its own type scale.
 *
 * Kept in this module so the size and the colour are never split across two
 * stylesheets, where their order in the bundle would decide which wins.
 */
export const DIRECTION_VALUE_CLASS: Record<Direction, string> = {
  up: styles.statValueUp,
  down: styles.statValueDown,
  flat: styles.statValueFlat,
}
