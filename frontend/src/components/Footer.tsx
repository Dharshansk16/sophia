"use client";
import { motion } from "framer-motion";
import { Github, Twitter, Mail, BookOpen, Users, MessageCircle } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: Github, href: "https://github.com", label: "GitHub" },
    { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
    { icon: Mail, href: "mailto:contact@sophia.ai", label: "Email" },
  ];

  const quickLinks = [
    { label: "Explore Characters", href: "#explore", icon: Users },
    { label: "Start Chat", href: "#chat", icon: MessageCircle },
    { label: "Historical Debates", href: "#debates", icon: BookOpen },
    { label: "Knowledge Library", href: "#library", icon: BookOpen },
  ];

  return (
    <footer className="relative bg-gradient-to-t from-black/5 via-white/10 to-white/20 backdrop-blur-md border-t border-black/10">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-black/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand Section */}
          <motion.div
            className="lg:col-span-4 text-center lg:text-left"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-black mb-3 tracking-tight">
                Sophia
              </h2>
              <p className="text-gray-600 text-base leading-relaxed max-w-sm mx-auto lg:mx-0">
                Where artificial intelligence meets historical wisdom, bringing the past to life through meaningful conversations.
              </p>
            </div>

            {/* Social Links */}
            <div className="flex justify-center lg:justify-start space-x-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-sm border border-black/10 flex items-center justify-center text-gray-600 hover:text-black hover:bg-white/80 transition-all duration-300 shadow-sm hover:shadow-md"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                >
                  <social.icon size={18} />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            className="lg:col-span-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-black mb-6 text-center lg:text-left">
              Explore History
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickLinks.map((link, index) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  className="group flex items-center space-x-3 p-3 rounded-xl bg-white/40 backdrop-blur-sm border border-black/5 hover:bg-white/60 hover:border-black/10 transition-all duration-300"
                  whileHover={{ scale: 1.02, x: 4 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                >
                  <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center group-hover:bg-black/10 transition-colors duration-300">
                    <link.icon size={16} className="text-gray-600 group-hover:text-black" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-black transition-colors duration-300">
                    {link.label}
                  </span>
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quote Section */}
          <motion.div
            className="lg:col-span-4 text-center lg:text-left"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 border border-black/10 shadow-lg">
              <div className="mb-4">
                <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mx-auto lg:mx-0">
                  <BookOpen size={24} className="text-black/60" />
                </div>
              </div>
              <blockquote className="text-gray-700 text-base italic leading-relaxed mb-4">
                "The past is never dead. It's not even past."
              </blockquote>
              <cite className="text-gray-500 text-sm font-medium">
                — William Faulkner
              </cite>
              <div className="mt-4 pt-4 border-t border-black/5">
                <p className="text-xs text-gray-500">
                  Nobel Prize-winning author and historian
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <motion.div
          className="border-t border-black/10 mt-12 pt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-500 text-sm">
              © {currentYear} Sophia. All rights reserved. | Bringing history to life through AI.
            </p>
            <div className="flex items-center space-x-6 text-sm">
              <button type="button" className="text-gray-500 hover:text-black transition-colors duration-200">
                Privacy Policy
              </button>
              <button type="button" className="text-gray-500 hover:text-black transition-colors duration-200">
                Terms of Service
              </button>
              <button type="button" className="text-gray-500 hover:text-black transition-colors duration-200">
                Contact
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Decorative bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />
    </footer>
  );
}