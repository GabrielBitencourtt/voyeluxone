import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    text: "An absolutely incredible experience. Every detail was flawlessly arranged, from our private villa in Bali to the sunset yacht dinner. Truly a once-in-a-lifetime trip.",
    author: "Sarah M.",
    location: "New York, USA",
  },
  {
    text: "I've traveled the world, but never with such elegance and ease. Voyelux One understood exactly what we wanted and exceeded every expectation.",
    author: "James L.",
    location: "London, UK",
  },
  {
    text: "From our honeymoon in Santorini to a family safari in Kenya, every journey has been perfectly curated. We wouldn't trust anyone else with our travels.",
    author: "Ana & Pedro R.",
    location: "São Paulo, Brazil",
  },
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="section-padding bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="label-text text-primary mb-4">Client Stories</p>
          <h2 className="heading-lg text-foreground mb-6">What They Say</h2>
          <div className="w-16 h-px bg-gold-gradient mx-auto" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, index) => (
            <motion.div
              key={t.author}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
              className="p-8 border border-border rounded-sm"
            >
              <Quote className="w-8 h-8 text-primary/30 mb-6" />
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
                ))}
              </div>
              <p className="body-text text-foreground/80 mb-6 italic">"{t.text}"</p>
              <div>
                <p className="font-heading text-lg text-foreground">{t.author}</p>
                <p className="label-text text-muted-foreground text-[10px] mt-1">{t.location}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;