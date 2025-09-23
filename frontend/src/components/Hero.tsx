"use client";
import { motion } from "framer-motion";

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            <div className="absolute bg-transparent md:bg-black/10" />
            {/* Animated Background */}
            <div className="absolute inset-0">
                {/* Particle effects */}
                <div className="absolute inset-0">
                    {Array.from({ length: 50 }, (_, i) => {
                        const id = `particle-${i}`;
                        const left = `${(i * 37 % 100)}%`;
                        const top = `${(i * 53 % 100)}%`;
                        const duration = 3 + ((i * 29) % 200) / 100;
                        const delay = ((i * 17) % 200) / 100;
                        return (
                            <motion.div
                                key={id}
                                className="absolute w-1 h-1 bg-black/20 rounded-full"
                                style={{
                                    left,
                                    top,
                                }}
                                animate={{
                                    y: [0, -20, 0],
                                    opacity: [0.2, 0.8, 0.2],
                                }}
                                transition={{
                                    duration,
                                    repeat: Infinity,
                                    delay,
                                }}
                            />
                        );
                    })}
                </div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Left Content */}
                    <motion.div
                        className="text-center lg:text-left"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: {
                                    duration: 0.6,
                                    staggerChildren: 0.2,
                                },
                            },
                        }}
                        initial="hidden"
                        animate="visible"
                    >
                        <motion.h1
                            className="text-4xl md:text-7xl font-bold leading-tight mb-6"
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0 },
                            }}
                        >
                            <span className="bg-gradient-to-r from-black via-black to-black bg-clip-text text-transparent">
                                Converse with History,
                            </span>
                            <br />
                            <span className="text-black">Debate with Legends</span>
                        </motion.h1>

                        <motion.p
                            className="text-base sm:text-xl md:text-2xl text-gray-700 mb-8 max-w-2xl mx-auto lg:mx-0"
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0 },
                            }}
                        >
                            Sophia lets you chat with historic characters or spark debates
                            with AI-powered authenticity and citations.
                        </motion.p>

                        <motion.div
                            className="flex flex-row gap-4 justify-center lg:justify-start"
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0 },
                            }}
                        >
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            >
                                <button
                                    type="button"
                                    className="bg-black text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-2xl shadow-2xl shadow-black/25 hover:shadow-black/40 transition-all duration-300 text-base sm:text-lg"
                                >
                                    Start Exploring
                                </button>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            >
                                <button
                                    type="button"
                                    className="border-2 border-black text-black hover:bg-black/10 font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-2xl backdrop-blur-sm transition-all duration-300 text-base sm:text-lg flex items-center"
                                >
                                    <span className="w-5 h-5 mr-2 bg-black rounded-full inline-block" />
                                    Watch Demo
                                </button>
                            </motion.div>
                        </motion.div>
                    </motion.div>

                    {/* Right Content - Chat Mockup */}
                    <motion.div
                        className="relative w-full flex justify-center"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: {
                                    duration: 0.6,
                                    staggerChildren: 0.2,
                                },
                            },
                        }}
                        initial="hidden"
                        animate="visible"
                    >
                        <motion.div
                            className="relative bg-white/40 backdrop-blur-xl rounded-3xl p-4 sm:p-6 border border-black/10 shadow-2xl max-w-xs sm:max-w-md w-full mx-auto"
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0 },
                            }}
                        >
                            {/* Chat Header */}
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-black/10">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                                        <span className="text-white font-bold text-sm">E</span>
                                    </div>
                                    <div>
                                        <h3 className="text-black font-semibold text-base sm:text-lg">
                                            Einstein vs Newton
                                        </h3>
                                        <p className="text-gray-600 text-xs">Historical Debate</p>
                                    </div>
                                </div>
                                <div className="w-3 h-3 rounded-full bg-black"></div>
                            </div>

                            {/* Chat Messages */}
                            <div className="space-y-4">
                                <motion.div
                                    className="flex justify-start"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5, duration: 0.5 }}
                                >
                                    <div className="bg-black/80 text-white backdrop-blur-sm rounded-2xl rounded-tl-sm px-3 sm:px-4 py-2 max-w-[80%]">
                                        <p className="text-sm">
                                            "Imagination is more important than knowledge."
                                        </p>
                                        <span className="text-xs text-gray-300 mt-1 block">
                                            Einstein
                                        </span>
                                    </div>
                                </motion.div>

                                <motion.div
                                    className="flex justify-end"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.8, duration: 0.5 }}
                                >
                                    <div className="bg-black/10 backdrop-blur-sm rounded-2xl rounded-tr-sm px-3 sm:px-4 py-2 max-w-[80%]">
                                        <p className="text-black text-sm">
                                            "If I have seen further, it is by standing on the
                                            shoulders of giants."
                                        </p>
                                        <span className="text-xs text-gray-600 mt-1 block">
                                            Newton
                                        </span>
                                    </div>
                                </motion.div>

                                <motion.div
                                    className="flex justify-start"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1.1, duration: 0.5 }}
                                >
                                    <div className="bg-black/80 text-white backdrop-blur-sm rounded-2xl rounded-tl-sm px-3 sm:px-4 py-2 max-w-[80%]">
                                        <p className="text-sm">
                                            "The important thing is not to stop questioning..."
                                        </p>
                                        <span className="text-xs text-gray-300 mt-1 block">
                                            Einstein
                                        </span>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Typing indicator */}
                            <motion.div
                                className="flex items-center space-x-2 mt-4 text-gray-600"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.4, duration: 0.5 }}
                            >
                                <div className="flex space-x-1">
                                    <motion.div
                                        className="w-2 h-2 bg-black rounded-full"
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                                    />
                                    <motion.div
                                        className="w-2 h-2 bg-black rounded-full"
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                                    />
                                    <motion.div
                                        className="w-2 h-2 bg-black rounded-full"
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                                    />
                                </div>
                                <span className="text-sm">Newton is typing...</span>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}