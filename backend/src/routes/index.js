const express = require('express')
const router  = express.Router()

const { requireAuth, requireAdmin, requireSubscription } = require('../middleware/auth')
const scoresCtrl        = require('../controllers/scores')
const charitiesCtrl     = require('../controllers/charities')
const subscriptionsCtrl = require('../controllers/subscriptions')
const drawsCtrl         = require('../controllers/draws')
const winnersCtrl       = require('../controllers/winners')
const adminCtrl         = require('../controllers/admin')

// ── Health check ─────────────────────────────────────────────────────
router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// ── Scores ────────────────────────────────────────────────────────────
router.get   ('/scores',      requireAuth, requireSubscription, scoresCtrl.getScores)
router.post  ('/scores',      requireAuth, requireSubscription, scoresCtrl.addScore)
router.patch ('/scores/:id',  requireAuth, requireSubscription, scoresCtrl.updateScore)
router.delete('/scores/:id',  requireAuth, requireSubscription, scoresCtrl.deleteScore)

// ── Charities (public read, admin write) ─────────────────────────────
router.get   ('/charities',      charitiesCtrl.getCharities)
router.get   ('/charities/:id',  charitiesCtrl.getCharity)
router.post  ('/charities',      requireAuth, requireAdmin, charitiesCtrl.createCharity)
router.patch ('/charities/:id',  requireAuth, requireAdmin, charitiesCtrl.updateCharity)
router.delete('/charities/:id',  requireAuth, requireAdmin, charitiesCtrl.deleteCharity)

// ── User charity selection ────────────────────────────────────────────
router.get ('/user/charity',  requireAuth, charitiesCtrl.getUserCharity)
router.post('/user/charity',  requireAuth, charitiesCtrl.setUserCharity)

// ── Subscriptions ─────────────────────────────────────────────────────
router.get ('/subscriptions/me',       requireAuth, subscriptionsCtrl.getMySubscription)
router.post('/subscriptions/checkout', requireAuth, subscriptionsCtrl.createCheckout)
router.post('/subscriptions/portal',   requireAuth, subscriptionsCtrl.openPortal)

// ── Draws ─────────────────────────────────────────────────────────────
router.get('/draws',          requireAuth, drawsCtrl.getDraws)
router.get('/draws/:id',      requireAuth, drawsCtrl.getDraw)
router.get('/draws/:id/my-entry', requireAuth, drawsCtrl.getMyEntry)

// ── Winners ───────────────────────────────────────────────────────────
router.get  ('/winners',    requireAuth, winnersCtrl.getWinners)
router.patch('/winners/:id',requireAuth, winnersCtrl.updateWinner)

// ── Admin ─────────────────────────────────────────────────────────────
router.get  ('/admin/analytics',       requireAuth, requireAdmin, adminCtrl.getAnalytics)
router.get  ('/admin/users',           requireAuth, requireAdmin, adminCtrl.getUsers)
router.patch('/admin/users/:id',       requireAuth, requireAdmin, adminCtrl.updateUser)
router.get  ('/admin/users/:id/scores',requireAuth, requireAdmin, adminCtrl.getUserScores)
router.get  ('/admin/subscriptions',   requireAuth, requireAdmin, subscriptionsCtrl.getAllSubscriptions)
router.post ('/admin/draws',           requireAuth, requireAdmin, drawsCtrl.manageDraw)

module.exports = router
