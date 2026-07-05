import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, X } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const TOUR_KEY = 'chainwatch-onboarding-complete'

const TOUR_STEPS = [
  {
    title: 'Welcome to ChainWatch Pro',
    body: 'Monitor wallet risk across Ethereum, Base, Arbitrum, Polygon, and Solana from one dashboard.',
  },
  {
    title: 'Scan & compare wallets',
    body: 'Enter any address on the Dashboard to get risk scores, health metrics, and side-by-side comparisons.',
  },
  {
    title: 'Build your watchlist',
    body: 'Track wallets with localStorage persistence. Portfolio risk aggregates your entire watchlist.',
  },
  {
    title: 'Alerts & webhooks',
    body: 'Configure alert rules and test webhook delivery from the Webhooks page. Export PDF risk reports anytime.',
  },
  {
    title: 'Settings & compliance',
    body: 'Generate API keys, toggle themes, and run mock compliance reports before going to production.',
  },
]

export function OnboardingTour() {
  const [completed, setCompleted] = useLocalStorage(TOUR_KEY, false)
  const [step, setStep] = useLocalStorage('chainwatch-onboarding-step', 0)

  if (completed) return null

  const currentStep = TOUR_STEPS[Math.min(step, TOUR_STEPS.length - 1)]
  const isLast = step >= TOUR_STEPS.length - 1

  const finish = () => {
    setCompleted(true)
    setStep(0)
  }

  const next = () => {
    if (isLast) {
      finish()
      return
    }
    setStep((value) => value + 1)
  }

  return (
    <AnimatePresence>
      <motion.div
        className="onboarding-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <motion.div
          className="onboarding-modal panel"
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12 }}
        >
          <button type="button" className="onboarding-close icon-button" onClick={finish} aria-label="Skip tour">
            <X size={16} aria-hidden="true" />
          </button>

          <span className="eyebrow">Getting started · Step {step + 1} of {TOUR_STEPS.length}</span>
          <h2 id="onboarding-title">{currentStep.title}</h2>
          <p>{currentStep.body}</p>

          <div className="onboarding-dots" aria-hidden="true">
            {TOUR_STEPS.map((_, index) => (
              <span key={index} className={clsx({ active: index === step })} />
            ))}
          </div>

          <div className="onboarding-actions">
            <button type="button" className="secondary-button" onClick={finish}>
              Skip tour
            </button>
            <button type="button" className="primary-button" onClick={next}>
              {isLast ? 'Get started' : 'Next'}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}