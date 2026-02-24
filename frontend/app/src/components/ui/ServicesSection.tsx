import { motion } from "framer-motion";
import { Plane, Hotel, Map, Globe, Shield, Clock } from "lucide-react";

const services = [
  {
    icon: Plane,
    title: "Flight Booking",
    description: "First-class and private jet arrangements tailored to your schedule and preferences.",
  },
  {
    icon: Hotel,
    title: "Luxury Accommodations",
    description: "Handpicked five-star hotels, private villas, and exclusive resorts worldwide.",
  },
  {
    icon: Map,
    title: "Custom Itineraries",
    description: "Bespoke travel plans designed around your interests, pace, and unique desires.",
  },
  {
    icon: Globe,
    title: "Global Concierge",
    description: "24/7 personal assistance from restaurant reservations to VIP event access.",
  },
  {
    icon: Shield,
    title: "Travel Insurance",
    description: "Comprehensive coverage ensuring peace of mind throughout your journey.",
  },
  {
    icon: Clock,
    title: "Airport Transfers",
    description: "Seamless luxury transportation with private drivers at every destination.",
  },
];

const ServicesSection = () => {
  return (
    <section id="services" className="section-padding bg-card">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="label-text text-primary mb-4">What We Offer</p>
          <h2 className="heading-lg text-foreground mb-6">Exceptional Services</h2>
          <div className="w-16 h-px bg-gold-gradient mx-auto" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="group p-8 border border-border rounded-sm hover:border-primary/30 transition-all duration-500"
            >
              <service.icon className="w-8 h-8 text-primary mb-6 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="heading-md text-foreground mb-3 text-xl">{service.title}</h3>
              <p className="body-text text-muted-foreground">{service.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;