/**
 * Draw Engine
 * Handles random and frequency-weighted algorithmic draws.
 * Score range: 1–45 (Stableford format), draw picks 5 unique numbers.
 */

/** Generate 5 unique random numbers between 1–45 */
function generateRandomNumbers(count = 5, min = 1, max = 45) {
  const numbers = new Set()
  while (numbers.size < count) {
    numbers.add(Math.floor(Math.random() * (max - min + 1)) + min)
  }
  return Array.from(numbers).sort((a, b) => a - b)
}

/**
 * Generate numbers weighted by score frequency across all users.
 * Scores that appear most often get higher draw probability.
 */
function generateAlgorithmicNumbers(allScores, count = 5, min = 1, max = 45) {
  if (!allScores || allScores.length === 0) return generateRandomNumbers(count, min, max)

  // Build frequency map — base weight 1, +3 per occurrence
  const freq = new Map()
  for (let i = min; i <= max; i++) freq.set(i, 1)
  allScores.forEach(s => {
    if (s >= min && s <= max) freq.set(s, (freq.get(s) || 1) + 3)
  })

  const entries = Array.from(freq.entries())
  const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0)
  const selected = new Set()
  let attempts = 0

  while (selected.size < count && attempts < 1000) {
    attempts++
    let rand = Math.random() * totalWeight
    for (const [num, weight] of entries) {
      rand -= weight
      if (rand <= 0 && !selected.has(num)) { selected.add(num); break }
    }
  }

  // Fallback to random if weighted selection stalls
  while (selected.size < count) selected.add(Math.floor(Math.random() * (max - min + 1)) + min)

  return Array.from(selected).sort((a, b) => a - b)
}

/** Count how many of a user's scores match the winning numbers */
function countMatches(userScores, winningNumbers) {
  return userScores.filter(s => winningNumbers.includes(s)).length
}

/**
 * Run the draw against all eligible entries.
 * Returns categorised winner arrays and a per-user match count map.
 */
function simulateDraw(entries, winningNumbers) {
  const winners5 = []
  const winners4 = []
  const winners3 = []
  const matchResults = {}

  entries.forEach(entry => {
    const matches = countMatches(entry.scores, winningNumbers)
    matchResults[entry.user_id] = matches
    if (matches === 5) winners5.push(entry.user_id)
    else if (matches === 4) winners4.push(entry.user_id)
    else if (matches === 3) winners3.push(entry.user_id)
  })

  return { winners5, winners4, winners3, matchResults }
}

/** Split pool equally among winners, rounded down to 2dp */
function calculatePrizePerWinner(poolAmount, winnerCount) {
  if (winnerCount === 0) return 0
  return Math.floor((poolAmount / winnerCount) * 100) / 100
}

// Prize pool split constants (40% / 35% / 25%)
const POOL_DISTRIBUTION = { jackpot: 0.40, match4: 0.35, match3: 0.25 }

module.exports = {
  generateRandomNumbers,
  generateAlgorithmicNumbers,
  simulateDraw,
  calculatePrizePerWinner,
  countMatches,
  POOL_DISTRIBUTION,
}
