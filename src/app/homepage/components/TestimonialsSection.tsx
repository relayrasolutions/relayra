import React from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

const testimonials = [
{
  quote:
  'Before Relayra, our fee collection was stuck at 68%. Within 90 days, we crossed 91%. The automated WhatsApp reminders do the work that used to take two staff members all month.',
  name: 'Sunita Krishnamurthy',
  title: 'Principal',
  school: 'Sunrise Public School, Pune',
  avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_171c3cdc6-1774931891196.png",
  rating: 5,
  result: '+23% collection rate'
},
{
  quote:
  'Parents used to call the office 40-50 times a day asking about fees, attendance, and exam dates. Now they just WhatsApp the school number and get instant answers. Our staff finally has time to focus on students.',
  name: 'Rajesh Nair',
  title: 'School Director',
  school: 'Heritage International School, Kochi',
  avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_16194ac75-1774931891491.png",
  rating: 5,
  result: '80% fewer phone calls'
},
{
  quote:
  'The setup was done in 3 days. I didn\'t have to do anything technical — just shared our student Excel sheet. Now I get a WhatsApp report every day at 4 PM with everything I need to know.',
  name: 'Meena Sharma',
  title: 'Principal',
  school: 'Delhi Valley CBSE School, New Delhi',
  avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_113646f52-1768628052380.png",
  rating: 5,
  result: 'Rs. 12L fees recovered in month 1'
},
{
  quote:
  'We were skeptical about the 15% guarantee. We ended up improving by 31%. The escalation system is brilliant — the tone goes from polite to firm automatically. We never have to chase parents anymore.',
  name: 'Vikram Patel',
  title: 'Trustee & Director',
  school: 'Ahmedabad Scholars Academy',
  avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1a3b5dfa6-1768855842479.png",
  rating: 5,
  result: '+31% collection improvement'
}];


export default function TestimonialsSection() {
  return (
    <section className="py-20 lg:py-28 bg-bg-base" aria-label="School testimonials">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 reveal">
          <p className="section-label mb-3">School Stories</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-800 text-text-primary tracking-tight mb-4">
            What principals{' '}
            <span className="text-gradient-blue">are saying</span>
          </h2>
          <p className="text-text-secondary text-lg">
            Real results from real schools across India.
          </p>
        </div>

        {/* Testimonial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials?.map((t, i) =>
          <div
            key={t?.name}
            className={`testimonial-card p-8 reveal ${i % 2 === 1 ? 'delay-200' : ''}`}>
            
              {/* Stars */}
              <div className="flex items-center gap-1 mb-5">
                {Array.from({ length: t?.rating })?.map((_, si) =>
              <Icon key={si} name="StarIcon" size={14} variant="solid" className="text-accent" />
              )}
              </div>

              {/* Quote */}
              <blockquote className="text-text-primary text-sm leading-relaxed mb-6 font-medium italic">
                "{t?.quote}"
              </blockquote>

              {/* Result pill */}
              <div className="inline-flex items-center gap-1.5 bg-teal/10 text-teal text-xs font-700 px-3 py-1.5 rounded-full mb-6">
                <Icon name="ArrowTrendingUpIcon" size={12} variant="outline" />
                {t?.result}
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-5 border-t border-border">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-border">
                  <AppImage
                  src={t?.avatar}
                  alt={`${t?.name}, ${t?.title} at ${t?.school}`}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover" />
                
                </div>
                <div>
                  <p className="font-display font-700 text-text-primary text-sm">{t?.name}</p>
                  <p className="text-text-secondary text-xs">
                    {t?.title}, {t?.school}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom note */}
        <div className="text-center mt-10 reveal delay-300">
          <p className="text-text-secondary text-sm">
            Placeholder testimonials — real school case studies coming soon.
          </p>
        </div>
      </div>
    </section>);

}