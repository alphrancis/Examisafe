import { GraduationCap } from "lucide-react";
import { Link } from "react-router";
import { motion } from "framer-motion";

export default function Header() {
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 text-white shadow-md sticky top-0 z-50 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
      <div className="container mx-auto px-6 py-4 flex items-center justify-between relative z-10">
        <Link to="/" className="flex items-center gap-4 hover:opacity-100 transition-all active:scale-[0.98] w-fit group">
          <div className="p-2.5 bg-white/10 backdrop-blur-sm rounded-xl shadow-inner group-hover:bg-white/20 group-hover:rotate-6 transition-all duration-300">
            <GraduationCap className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-sm">
              TNHSA ExamiSafe
            </h1>
            <p className="text-xs text-blue-100 font-semibold tracking-wider uppercase mt-0.5 opacity-90">Student Examination Portal</p>
          </div>
        </Link>
      </div>
    </motion.header>
  );
}
