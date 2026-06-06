import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { ArrowLeft, FileText, Info } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { PageTransition } from "../components/PageTransition";
import { Breadcrumbs } from "../components/Breadcrumbs";

export default function JuniorHighSchool() {
  const navigate = useNavigate();

  const grades = [
    { level: 7, colorClasses: { light: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", bar: "bg-emerald-500", hoverBar: "group-hover:bg-emerald-500", btn: "bg-emerald-600 hover:bg-emerald-700" } },
    { level: 8, colorClasses: { light: "bg-green-50", text: "text-green-600", border: "border-green-100", bar: "bg-green-500", hoverBar: "group-hover:bg-green-500", btn: "bg-green-600 hover:bg-green-700" } },
    { level: 9, colorClasses: { light: "bg-teal-50", text: "text-teal-600", border: "border-teal-100", bar: "bg-teal-500", hoverBar: "group-hover:bg-teal-500", btn: "bg-teal-600 hover:bg-teal-700" } },
    { level: 10, colorClasses: { light: "bg-cyan-50", text: "text-cyan-600", border: "border-cyan-100", bar: "bg-cyan-500", hoverBar: "group-hover:bg-cyan-500", btn: "bg-cyan-600 hover:bg-cyan-700" } },
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
      <Breadcrumbs />
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
                Junior High School <span className="text-blue-600 dark:text-blue-400">Examinations</span>
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto transition-colors duration-300">
                Select your specific grade level below to access your scheduled examinations.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {grades.map(({ level, colorClasses }, i) => (
                <motion.div key={level} variants={itemVariants} className="transform transition-transform duration-300 hover:-translate-y-2 will-change-transform">
                  <Card className={`h-full border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl ${colorClasses.shadow} bg-white dark:bg-slate-800 overflow-hidden group transition-all duration-300`}>
                    <div className={`absolute top-0 left-0 w-full h-1 ${colorClasses.bar} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
                    <CardHeader className="text-center pb-4 pt-8">
                      <div className={`mx-auto mb-4 w-16 h-16 ${colorClasses.light} dark:bg-opacity-10 dark:bg-slate-700 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <FileText className={`w-8 h-8 ${colorClasses.text}`} />
                      </div>
                      <CardTitle className="text-xl text-slate-900 dark:text-white font-bold transition-colors duration-300">Grade {level}</CardTitle>
                      <CardDescription className="text-slate-500 dark:text-slate-400 font-medium transition-colors duration-300">Examination Portal</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-8 px-6">
                      <Button 
                        onClick={() => navigate(`/grade/${level}`)}
                        className={`w-full group text-white shadow-none transition-colors duration-300 ${colorClasses.btn}`}
                      >
                        Enter Grade {level}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.div variants={itemVariants} className="mt-16 text-center">
              <Card className="max-w-2xl mx-auto bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 shadow-sm transition-colors duration-300">
                <CardContent className="pt-6 pb-6 flex items-start gap-4 text-left">
                  <Info className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 transition-colors duration-300" />
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed transition-colors duration-300">
                    <strong className="text-slate-900 dark:text-white block mb-1 transition-colors duration-300">Important Instructions:</strong> 
                      Read all instructions on the following page carefully before initiating any timed test.
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
