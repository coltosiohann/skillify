"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah K.",
    role: "Software Engineer",
    avatar: "https://i.pravatar.cc/48?img=47",
    stars: 5,
    text: "I went from zero Python knowledge to building my first web scraper in 3 weeks. The AI course was insanely well-structured — exactly what I needed.",
  },
  {
    name: "Marcus R.",
    role: "Marketing Manager",
    avatar: "https://i.pravatar.cc/48?img=12",
    stars: 5,
    text: "Tried Duolingo, Coursera, YouTube — nothing stuck. Skillify's roadmap actually held me accountable. I'm now conversational in Spanish after 2 months.",
  },
  {
    name: "Aisha T.",
    role: "Freelance Designer",
    avatar: "https://i.pravatar.cc/48?img=32",
    stars: 5,
    text: "The gamification kept me coming back every day. Boss Battles are addictive! I've completed 4 courses and feel like a completely different professional.",
  },
  {
    name: "Jordan L.",
    role: "Product Manager",
    avatar: "https://i.pravatar.cc/48?img=56",
    stars: 5,
    text: "Uploaded my existing notes as a PDF and Skillify built a course around them. Saved me weeks of organizing my learning. Absolutely genius feature.",
  },
  {
    name: "Nina W.",
    role: "University Student",
    avatar: "https://i.pravatar.cc/48?img=44",
    stars: 5,
    text: "Used it to prep for my data structures exam. The AI quiz generator was better than anything my professor gave us. Got an A.",
  },
  {
    name: "Carlos M.",
    role: "Startup Founder",
    avatar: "https://i.pravatar.cc/48?img=68",
    stars: 5,
    text: "I needed to learn financial modeling fast for investor meetings. Set a 2-week deadline and Skillify delivered exactly what I needed, nothing more.",
  },
];

export default function Testimonials() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="testimonials" ref={ref} className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: "easeOut" as const }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Testimonials
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl font-extrabold text-foreground mb-4">
            Loved by <span className="text-gradient">10,000+</span> Learners
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Real people, real results. See what our community has to say.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.05 + i * 0.08, ease: "easeOut" as const }}
              className="bg-white rounded-2xl border border-primary/8 p-6 shadow-sm hover:shadow-md hover:shadow-primary/8 hover:-translate-y-1 transition-all duration-200 cursor-default"
            >
              <div className="flex gap-0.5 mb-4">
                {[...Array(t.stars)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <img src={t.avatar} alt={t.name} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <p className="font-semibold text-foreground text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
