import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { ArrowLeft, Award, Info } from "lucide-react";
import { motion } from "motion/react";

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

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-8 md:py-12 flex-grow">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button 
            onClick={() => navigate("/")}
            variant="outline"
            className="mb-8"
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
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Senior High School <span className="text-indigo-600">Examinations</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Select your grade level to access your specialized track examinations.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {grades.map(({ level, colorClasses }) => (
              <motion.div key={level} variants={itemVariants} className="transform transition-transform duration-300 hover:-translate-y-1 will-change-transform">
                <Card className="h-full border border-slate-100 shadow-sm hover:shadow-md bg-white overflow-hidden group transition-all duration-300">
                  <div className={`absolute top-0 left-0 w-full h-1 ${colorClasses.bar} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
                  <CardHeader className="text-center pb-6 pt-10">
                    <div className={`mx-auto mb-6 w-20 h-20 ${colorClasses.light} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Award className={`w-10 h-10 ${colorClasses.text}`} />
                    </div>
                    <CardTitle className="text-2xl text-slate-900 font-bold mb-2">Grade {level}</CardTitle>
                    <CardDescription className={`text-base ${colorClasses.text} opacity-90 font-medium ${colorClasses.light} w-fit mx-auto px-4 py-1.5 rounded-full`}>Examination Portal</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-10 px-8 text-center">
                    <Button 
                      onClick={() => navigate(`/grade/${level}`)}
                      className={`w-full text-base group text-white shadow-none ${colorClasses.btn}`}
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
            <Card className="max-w-2xl mx-auto bg-indigo-50/50 border border-indigo-100 shadow-sm">
              <CardContent className="pt-6 pb-6 flex items-start gap-4 text-left">
                <Info className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700 leading-relaxed">
                  <strong className="text-slate-900 block mb-1">Important Instructions:</strong> 
                  Please ensure you have your student ID and examination materials ready before proceeding to your specific grade portal. Read all instructions carefully.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
