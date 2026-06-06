import { GraduationCap } from "lucide-react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import {useTheme} from "./ThemeProvider";
import { Sun } from "lucide-react";
import { Moon } from "lucide-react";

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 text-white shadow-md sticky top-0 z-50 overflow-hidden transition-colors duration-500"
    >
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
      <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between relative z-10">
        <Link to="/" className="flex items-center gap-3 md:gap-4 hover:opacity-100 transition-all active:scale-[0.98] w-fit group">
          <div className="p-2 md:p-2.5 bg-white/10 backdrop-blur-sm rounded-xl shadow-inner group-hover:bg-white/20 group-hover:rotate-6 transition-all duration-300">
            <GraduationCap className="w-6 h-6 md:w-8 md:h-8 text-white group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white drop-shadow-sm line-clamp-1">
              TNHSA ExamiSafe
            </h1>
            <p className="text-[10px] md:text-xs text-blue-100 font-semibold tracking-wider uppercase mt-0.5 opacity-90 hidden sm:block">Student Examination Portal</p>
          </div>
        </Link>
        
        <button
          onClick={(e) => toggleTheme(e)}
          className="relative p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all duration-300 active:scale-95 ml-2 overflow-hidden w-10 h-10 md:w-11 md:h-11 flex items-center justify-center"
          aria-label="Toggle theme"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={theme}
              initial={{ y: -20, opacity: 0, rotate: -90 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: 20, opacity: 0, rotate: 90 }}
              transition={{ duration: 0.4, ease: "backOut" }}
              className="absolute flex items-center justify-center"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 md:w-6 md:h-6 text-yellow-300 drop-shadow-md" />
              ) : (
                <Moon className="w-5 h-5 md:w-6 md:h-6 text-white" />
              )}
            </motion.div>
          </AnimatePresence>
        </button>
      </div>
    </motion.header>
  );
}
