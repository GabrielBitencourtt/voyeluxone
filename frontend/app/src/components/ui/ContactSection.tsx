import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Instagram, Send } from "lucide-react";

const ContactSection = () => {
  return (
    <section id="contact" className="section-padding bg-card">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="label-text text-primary mb-4">Start Your Journey</p>
          <h2 className="heading-lg text-foreground mb-6">Get in Touch</h2>
          <div className="w-16 h-px bg-gold-gradient mx-auto" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="body-text text-muted-foreground mb-10">
              Ready to embark on your next extraordinary journey? Whether you have a
              destination in mind or need inspiration, I'm here to create a travel
              experience beyond your imagination.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-sm bg-secondary flex items-center justify-center">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="label-text text-muted-foreground text-[10px] mb-0.5">Email</p>
                  <p className="body-text text-foreground">hello@voyeluxone.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-sm bg-secondary flex items-center justify-center">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="label-text text-muted-foreground text-[10px] mb-0.5">Phone</p>
                  <p className="body-text text-foreground">+1 (555) 000-0000</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-sm bg-secondary flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="label-text text-muted-foreground text-[10px] mb-0.5">Location</p>
                  <p className="body-text text-foreground">United States</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-10">
              <a href="#" className="w-10 h-10 rounded-sm bg-secondary flex items-center justify-center hover:bg-primary/10 transition-colors">
                <Instagram className="w-4 h-4 text-primary" />
              </a>
              <a href="#" className="w-10 h-10 rounded-sm bg-secondary flex items-center justify-center hover:bg-primary/10 transition-colors">
                <Send className="w-4 h-4 text-primary" />
              </a>
            </div>
          </motion.div>

          {/* Contact form */}
          <motion.form
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="label-text text-muted-foreground text-[10px] block mb-2">Name</label>
                <input
                  type="text"
                  className="w-full bg-secondary border border-border rounded-sm px-4 py-3 body-text text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="label-text text-muted-foreground text-[10px] block mb-2">Email</label>
                <input
                  type="email"
                  className="w-full bg-secondary border border-border rounded-sm px-4 py-3 body-text text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors"
                  placeholder="your@email.com"
                />
              </div>
            </div>
            <div>
              <label className="label-text text-muted-foreground text-[10px] block mb-2">Destination Interest</label>
              <input
                type="text"
                className="w-full bg-secondary border border-border rounded-sm px-4 py-3 body-text text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors"
                placeholder="Where do you dream of going?"
              />
            </div>
            <div>
              <label className="label-text text-muted-foreground text-[10px] block mb-2">Message</label>
              <textarea
                rows={5}
                className="w-full bg-secondary border border-border rounded-sm px-4 py-3 body-text text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors resize-none"
                placeholder="Tell me about your dream trip..."
              />
            </div>
            <button
              type="submit"
              className="label-text bg-gold-gradient text-primary-foreground px-10 py-4 rounded-sm hover:opacity-90 transition-opacity w-full sm:w-auto"
            >
              Send Message
            </button>
          </motion.form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;