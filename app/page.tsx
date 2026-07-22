import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'
import HeroSection from '@/components/home/HeroSection'
import DailyEncouragementSection from '@/components/home/DailyEncouragementSection'
import SearchSection from '@/components/home/SearchSection'
import DevotionalSection from '@/components/home/DevotionalSection'
import TopicsSection from '@/components/home/TopicsSection'
import MissionStrip from '@/components/home/MissionStrip'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kingdom Companion — A Peaceful Place with God\'s Word',
  description: 'Read the Bible, receive Scripture-centred encouragement, follow devotionals, and grow in your faith. Always free. No advertisements.',
}

export default function HomePage() {
  return (
    <>
      <Navigation />

      <main id="main-content">
        {/* 1. Hero — primary emotion input & daily verse */}
        <HeroSection />

        {/* 2. Daily Encouragement preview */}
        <DailyEncouragementSection />

        {/* 3. Universal search */}
        <SearchSection />

        {/* 4. Featured devotional + reading plans */}
        <DevotionalSection />

        {/* 5. Scripture by topic grid */}
        <TopicsSection />

        {/* 6. Mission statement + CTAs */}
        <MissionStrip />
      </main>

      <Footer />
    </>
  )
}
