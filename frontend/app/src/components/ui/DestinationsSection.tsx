import { motion } from "framer-motion";
import destMaldives from "@/assets/dest-maldives.jpg";
import destSafari from "@/assets/dest-safari.jpg";
import destAmalfi from "@/assets/dest-amalfi.jpg";
import destJapan from "@/assets/dest-japan.jpg";

const destinations = [
  { image: destMaldives, name: "Maldives", subtitle: "Overwater Paradise" },
  { image: destSafari, name: "Kenya", subtitle: "Luxury Safari" },
  { image: destAmalfi, name: "Amalfi Coast", subtitle: "Italian Riviera" },
  { image: destJapan, name: "Kyoto", subtitle: "Ancient Elegance" },
];

const DestinationsSection = () => {
  return (
    <section id="destinations" className="section-padding bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="label-text text-primary mb-4">Curated Experiences</p>
          <h2 className="heading-lg text-foreground mb-6">Featured Destinations</h2>
          <div className="w-16 h-px bg-gold-gradient mx-auto" />
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {destinations.map((dest, index) => (
            <motion.div
              key={dest.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
              className="group relative overflow-hidden rounded-sm cursor-pointer"
            >
              <div className="aspect-3/4 overflow-hidden">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>
              <div className="absolute inset-0 bg-linear-to-t from-background/90 via-background/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="label-text text-primary mb-1">{dest.subtitle}</p>
                <h3 className="font-heading text-2xl text-foreground">{dest.name}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DestinationsSection;