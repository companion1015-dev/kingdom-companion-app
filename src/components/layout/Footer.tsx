import Link from 'next/link'
import Image from 'next/image'
import { Heart } from 'lucide-react'

const footerLinks = [
  { group: 'Scripture',  links: [{ label:'Bible',              href:'/bible'         }, { label:'Topics',            href:'/topics'        }, { label:'Daily Encouragement', href:'/daily'          }] },
  { group: 'Grow',       links: [{ label:'Devotionals',        href:'/devotionals'   }, { label:'Reading Plans',     href:'/reading-plans' }, { label:'Prayer Journal',      href:'/journal'        }] },
  { group: 'Learn',      links: [{ label:'Blog & Resources',   href:'/blog'          }, { label:'About',             href:'/about'         }, { label:'Contact',             href:'/contact'        }] },
  { group: 'Legal',      links: [{ label:'Privacy Policy',     href:'/privacy'       }, { label:'Terms of Use',      href:'/terms'         }, { label:'Support the Ministry',href:'/support'        }] },
]

export default function Footer() {
  return (
    <footer className="bg-navy-dark text-white/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Brand — uses official logo */}
        <div className="flex items-center gap-4 mb-10">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-lg shadow-navy-dark/50 shrink-0">
            <Image src="/images/logo.png" alt="Kingdom Companion" fill className="object-cover" sizes="56px" />
          </div>
          <div>
            <span className="block font-display text-lg font-semibold text-white">Kingdom Companion</span>
            <span className="block text-xs text-gold/65 tracking-widest uppercase font-body mt-0.5">
              Scripture · Encouragement · Peace · Purpose
            </span>
            <span className="block text-xs text-white/30 font-body mt-1 italic font-display">
              &ldquo;Rooted in Truth. Built for Life.&rdquo;
            </span>
          </div>
        </div>

        {/* Five pillars from the logo */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-10 pb-8 border-b border-white/8">
          {[
            { icon: '📖', label: 'Read God\'s Word'        },
            { icon: '💬', label: 'Understand with AI Insight' },
            { icon: '🙏', label: 'Pray with Faith'         },
            { icon: '❤️', label: 'Reflect & Journal'       },
            { icon: '🌱', label: 'Grow Every Day'          },
          ].map(p => (
            <span key={p.label} className="flex items-center gap-2 text-xs text-white/30 font-body">
              <span>{p.icon}</span> {p.label}
            </span>
          ))}
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-12 border-b border-white/8">
          {footerLinks.map(group => (
            <div key={group.group}>
              <h4 className="text-xs font-semibold text-white/35 tracking-widest uppercase mb-4">{group.group}</h4>
              <ul className="space-y-2.5">
                {group.links.map(link => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-white/55 hover:text-gold transition-colors font-body">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/25">
          <div className="flex items-center gap-3">
            <div className="relative w-6 h-6 rounded-md overflow-hidden">
              <Image src="/images/logo.png" alt="" fill className="object-cover" sizes="24px" />
            </div>
            <p>Scripture quotations from the Holy Bible, New International Version® (NIV). All rights reserved.</p>
          </div>
          <p className="flex items-center gap-1.5 shrink-0">
            Built with <Heart className="w-3 h-3 text-clay fill-current" /> for the Kingdom
          </p>
        </div>
      </div>
    </footer>
  )
}
