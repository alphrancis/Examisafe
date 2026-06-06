import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { ArrowLeft, Award, Info } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { PageTransition } from "../components/PageTransition";
import { Breadcrumbs } from "../components/Breadcrumbs";

export default function SeniorHighSchool() {
  const navigate = useNavigate();

  const grades = [
    { level: 11, colorClasses: { light: "bg-violet-50", text: "text-violet-600", border: "border-violet-100", bar: "bg-violet-500", btn: "bg-violet-600 hover:bg-violet-700" } },
    { level: 12, colorClasses: { light: "bg-purple-50", text: "text-purple-600", border: "border-purple-100", bar: "bg-purple-500", btn: "bg-purple-600 hover:bg-purple-700" } },
  ];

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <Header />
      <Breadcrumbs/>
      <PageTransition>
        <main className="container mx-auto px-4 py-8 md:py-12 flex-grow">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Button 
              onClick={() => navigate("/")}
              variant="outline"
              className="mb-8 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors duration-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="max-w-6xl mx-auto"
          >
            <motion.div variants={itemVariants} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight transition-colors duration-300">
                Senior High School <span className="text-indigo-600 dark:text-indigo-400">Examinations</span>
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto transition-colors duration-300">
                Select your grade level to access your specialized track examinations.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {grades.map(({ level, colorClasses }) => (
                <motion.div key={level} variants={itemVariants} className="transform transition-transform duration-300 hover:-translate-y-2 will-change-transform">
                  <Card className={`h-full border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl ${colorClasses.shadow} bg-white dark:bg-slate-800 overflow-hidden group transition-all duration-300`}>
                    <div className={`absolute top-0 left-0 w-full h-1 ${colorClasses.bar} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
                    <CardHeader className="text-center pb-6 pt-10">
                      <div className={`mx-auto mb-6 w-20 h-20 ${colorClasses.light} dark:bg-opacity-10 dark:bg-slate-700 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <Award className={`w-10 h-10 ${colorClasses.text}`} />
                      </div>
                      <CardTitle className="text-2xl text-slate-900 dark:text-white font-bold mb-2 transition-colors duration-300">Grade {level}</CardTitle>
                      <CardDescription className={`text-base ${colorClasses.text} opacity-90 font-medium ${colorClasses.light} dark:bg-opacity-10 dark:bg-slate-700 w-fit mx-auto px-4 py-1.5 rounded-full transition-colors duration-300`}>Examination Portal</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-10 px-8 text-center">
                      <Button 
                        onClick={() => navigate(`/grade/${level}`)}
                        className={`w-full text-base group text-white shadow-none transition-colors duration-300 ${colorClasses.btn}`}
                        size="lg"
                      >
                        Enter Grade {level}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.div variants={itemVariants} className="mt-16 text-center">
              <Card className="max-w-2xl mx-auto bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 shadow-sm transition-colors duration-300">
                <CardContent className="pt-6 pb-6 flex items-start gap-4 text-left">
                  <Info className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5 transition-colors duration-300" />
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed transition-colors duration-300">
                    <strong className="text-slate-900 dark:text-white block mb-1 transition-colors duration-300">Important Instructions:</strong> 
                      Read all instructions carefully.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </main>
      </PageTransition>
      <Footer />
    </div>
  );
}
