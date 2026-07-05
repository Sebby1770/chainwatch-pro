import { motion } from 'framer-motion'
import { Check, CircleDollarSign } from 'lucide-react'
import clsx from 'clsx'
import { useState } from 'react'
import { KpiCard } from '../components/KpiCard'
import { SectionTitle } from '../components/SectionTitle'
import { pricingPlans } from '../lib/constants'
import { formatCurrency } from '../lib/utils'

export function Pricing() {
  const [subscriberCount, setSubscriberCount] = useState(420)
  const [monthlyPrice, setMonthlyPrice] = useState(149)
  const [infraCost, setInfraCost] = useState(2800)

  const monthlyRevenue = subscriberCount * monthlyPrice
  const paymentFees = monthlyRevenue * 0.032
  const projectedProfit = monthlyRevenue - paymentFees - infraCost
  const annualRunRate = monthlyRevenue * 12
  const conversionRate = 0.024

  return (
    <div className="page pricing-page">
      <section className="band-heading centered">
        <span className="eyebrow">
          <CircleDollarSign size={14} aria-hidden="true" />
          Pricing
        </span>
        <h2>Three tiers for every stage of growth.</h2>
        <p>Free for exploration, Pro for active traders, Enterprise for desks and DAOs.</p>
      </section>

      <section className="pricing-cards-grid">
        {pricingPlans.map((plan, index) => (
          <motion.article
            key={plan.name}
            className={clsx('pricing-card large', { highlighted: plan.highlighted })}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div>
              <span>{plan.market}</span>
              <h3>{plan.name}</h3>
              <strong>
                {plan.price}
                <small>/mo</small>
              </strong>
            </div>
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>
                  <Check size={15} aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
            <button type="button" className={plan.highlighted ? 'primary-button' : 'secondary-button'}>
              {plan.name === 'Free' ? 'Get started' : plan.name === 'Pro' ? 'Start Pro' : 'Contact sales'}
            </button>
          </motion.article>
        ))}
      </section>

      <section className="panel revenue-panel">
        <SectionTitle icon={CircleDollarSign} eyebrow="Revenue planner" title="Subscription model simulator" />
        <div className="planner-grid">
          <label>
            <span>Subscribers</span>
            <input
              type="range"
              min="50"
              max="3000"
              step="10"
              value={subscriberCount}
              onChange={(event) => setSubscriberCount(Number(event.target.value))}
            />
            <strong>{subscriberCount.toLocaleString()}</strong>
          </label>
          <label>
            <span>Monthly price</span>
            <input
              type="range"
              min="29"
              max="799"
              step="10"
              value={monthlyPrice}
              onChange={(event) => setMonthlyPrice(Number(event.target.value))}
            />
            <strong>{formatCurrency(monthlyPrice)}</strong>
          </label>
          <label>
            <span>Infra and tools</span>
            <input
              type="range"
              min="500"
              max="25000"
              step="100"
              value={infraCost}
              onChange={(event) => setInfraCost(Number(event.target.value))}
            />
            <strong>{formatCurrency(infraCost)}</strong>
          </label>
        </div>
        <div className="revenue-results">
          <KpiCard
            icon={CircleDollarSign}
            label="MRR"
            value={formatCurrency(monthlyRevenue)}
            detail={`${(conversionRate * 100).toFixed(1)}% demo conversion`}
            tone="good"
          />
          <KpiCard
            icon={CircleDollarSign}
            label="Monthly profit"
            value={formatCurrency(projectedProfit)}
            detail="After fees and infra"
            tone={projectedProfit > 0 ? 'good' : 'warn'}
          />
          <KpiCard icon={CircleDollarSign} label="ARR" value={formatCurrency(annualRunRate)} detail="Before annual discounts" />
        </div>
      </section>
    </div>
  )
}