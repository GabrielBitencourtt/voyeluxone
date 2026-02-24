import { motion } from "framer-motion";
import { Award, Users, MapPin } from "lucide-react";
import aboutPhoto from "@/assets/about-photo.jpeg";

const stats = [
  { icon: Award, value: "10+", label: "Years Experience" },
  { icon: Users, value: "500+", label: "Happy Clients" },
  { icon: MapPin, value: "60+", label: "Countries" },
];

const AboutSection = () => {
  return (
    <section id="about" className="section-padding bg-card">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Photo placeholder */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="aspect-[3/4] max-w-md mx-auto lg:mx-0 bg-secondary rounded-sm overflow-hidden border border-border">
              <img src={aboutPhoto} alt="Voyelux One - Personal Travel Assistant" className="w-full h-full object-cover" />
            </div>
            {/* Decorative border */}
            <div className="absolute -bottom-4 -right-4 w-full h-full border border-primary/20 rounded-sm max-w-md mx-auto lg:mx-0 -z-10" />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="label-text text-primary mb-4">About Me</p>
            <h2 className="heading-lg text-foreground mb-6">
              Your Trusted Travel Companion
            </h2>
            <div className="w-16 h-px bg-gold-gradient mb-8" />

            <p className="body-text text-muted-foreground mb-6">
              Based in the United States, I specialize in crafting luxurious, tailor-made travel
              experiences for discerning clients worldwide. With a deep passion for exploration
              and an unwavering commitment to excellence, I transform your travel dreams into
              unforgettable realities.
            </p>
            <p className="body-text text-muted-foreground mb-10">
              Whether you're seeking a romantic getaway in the Maldives, an adventurous safari
              in Africa, or a cultural immersion in Japan, I handle every detail with precision
              and care — so you can simply enjoy the journey.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="font-heading text-3xl text-gold-gradient text-gold mb-1">{stat.value}</p>
                  <p className="label-text text-muted-foreground text-[10px]">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
