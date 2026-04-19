"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah K.",
    role: "Software Engineer",
    avatar: "https://i.pravatar.cc/48?img=47",
    stars: 5,
    text: "I went from zero Python knowledge to building my first web scraper in 3 weeks. The AI course was insanely well-structured — exactly what I needed.",
    featured: true,
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
    <section id="testimonials" ref={ref} className="relative py-28 px-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #F7F8FC 0%, #EEF0FF 50%, #F7F8FC 100%)" }} />
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none" style={{ background: "rgba(91,76,245,0.06)" }} />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: "easeOut" as const }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 border" style={{ background: "rgba(91,76,245,0.08)", borderColor: "rgba(91,76,245,0.20)", color: "#5B4CF5" }}>
            Testimonials
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl font-extrabold text-slate-900 mb-5">
            Loved by{" "}
            <span style={{ background: "linear-gradient(135deg, #5B4CF5, #818CF8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              10,000+
            </span>{" "}
            Learners
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Real people, real results. See what our community has to say.
          </p>
        </motion.div>

        {/* Featured + grid layout */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Featured testimonial — spans 1 col, taller */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.05, ease: "easeOut" as const }}
            className="relative flex flex-col rounded-3xl p-7 overflow-hidden row-span-2"
            style={{
              background: "linear-gradient(145deg, #4338CA, #5B4CF5, #6D5FFA)",
              boxShadow: "0 24px 60px rgba(91,76,245,0.30)",
            }}
          >
            {/* Decorative quote */}
            <div className="absolute top-5 right-5 opacity-20">
              <Quote className="w-16 h-16 text-white" />
            </div>
            <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(129,140,248,0.25)" }} />

            <div className="flex gap-0.5 mb-5">
              {[...Array(5)].map((_, j) => (
                <Star key={j} className="w-4 h-4 fill-amber-300 text-amber-300" />
              ))}
            </div>
            <p className="text-white text-lg leading-relaxed mb-8 relative z-10 flex-1">
              &ldquo;{testimonials[0].text}&rdquo;
            </p>
            <div className="flex items-center gap-3 relative z-10">
              <img src={testimonials[0].avatar} alt={testimonials[0].name} width={44} height={44} className="w-11 h-11 rounded-full object-cover border-2 border-white/30" />
              <div>
                <p className="font-bold text-white text-sm">{testimonials[0].name}</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{testimonials[0].role}</p>
              </div>
            </div>
          </motion.div>

          {/* Remaining testimonials */}
          {testimonials.slice(1).map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + (i + 1) * 0.08, ease: "easeOut" as const }}
              className="flex flex-col bg-white rounded-2xl p-6 hover:-translate-y-1 transition-all duration-200 cursor-default"
              style={{
                border: "1px solid rgba(91,76,245,0.08)",
                boxShadow: "0 4px 20px rgba(15,23,42,0.06)",
              }}
            >
              <div className="flex gap-0.5 mb-4">
                {[...Array(t.stars)].map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-5 flex-1">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <img src={t.avatar} alt={t.name} width={36} height={36} className="w-9 h-9 rounded-full object-cover" />
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
