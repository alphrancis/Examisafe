import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { BookOpen, Users, ChevronRight } from "lucide-react";
import { motion, type Variants } from "framer-motion";

export default function Home() {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-16 flex-grow flex flex-col justify-center">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="max-w-5xl mx-auto w-full"
        >
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
              Welcome to the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Examination Portal</span>
            </h2>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Select your educational level to access your examination materials. 
              Please ensure you have your verified student ID ready before proceeding.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div variants={itemVariants} className="transform transition-transform duration-300 hover:-translate-y-1 will-change-transform">
              <Card className="h-full border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 bg-white overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                <CardHeader className="text-center pb-6 pt-10">
                  <div className="mx-auto mb-6 w-20 h-20 bg-blue-50/80 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="w-10 h-10 text-blue-600" />
                  </div>
                  <CardTitle className="text-2xl text-slate-900 font-bold mb-2">Junior High School</CardTitle>
                  <CardDescription className="text-sm text-blue-700 font-semibold bg-blue-50 w-fit mx-auto px-4 py-1.5 rounded-full">Grades 7 - 10</CardDescription>
                </CardHeader>
                <CardContent className="pb-10 px-8 text-center">
                  <p className="text-slate-600 mb-8 text-sm leading-relaxed">Access core subjects, foundational sciences, and preliminary language examinations.</p>
                  <Button 
                    onClick={() => navigate("/junior-high")}
                    className="w-full text-base group bg-blue-600 hover:bg-blue-700 shadow-none text-white"
                    size="lg"
                  >
                    Enter Junior High Portal
                    <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants} className="transform transition-transform duration-300 hover:-translate-y-1 will-change-transform">
              <Card className="h-full border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 bg-white overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-indigo-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                <CardHeader className="text-center pb-6 pt-10">
                  <div className="mx-auto mb-6 w-20 h-20 bg-indigo-50/80 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-10 h-10 text-indigo-600" />
                  </div>
                  <CardTitle className="text-2xl text-slate-900 font-bold mb-2">Senior High School</CardTitle>
                  <CardDescription className="text-sm text-indigo-700 font-semibold bg-indigo-50 w-fit mx-auto px-4 py-1.5 rounded-full">Grades 11 - 12</CardDescription>
                </CardHeader>
                <CardContent className="pb-10 px-8 text-center">
                  <p className="text-slate-600 mb-8 text-sm leading-relaxed">Access specialized track subjects, advanced sciences, and applied research exams.</p>
                  <Button 
                    onClick={() => navigate("/senior-high")}
                    className="w-full text-base group bg-indigo-600 hover:bg-indigo-700 shadow-none text-white"
                    size="lg"
                  >
                    Enter Senior High Portal
                    <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
