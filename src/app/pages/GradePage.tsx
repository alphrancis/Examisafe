import { useNavigate, useParams } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { 
  ArrowLeft, Calculator, Microscope, BookOpen, 
  Globe, Laptop, Atom, FlaskConical, 
  Feather, Landmark, BookText, Info
} from "lucide-react";
import { motion } from "motion/react";

const getSubjectIcon = (subject: string) => {
  const lower = subject.toLowerCase();
  if (lower.includes("math")) return <Calculator className="w-5 h-5" />;
  if (lower.includes("science")) return <Microscope className="w-5 h-5" />;
  if (lower.includes("physics")) return <Atom className="w-5 h-5" />;
  if (lower.includes("chemistry")) return <FlaskConical className="w-5 h-5" />;
  if (lower.includes("technology")) return <Laptop className="w-5 h-5" />;
  if (lower.includes("social studies")) return <Globe className="w-5 h-5" />;
  if (lower.includes("humanities")) return <Landmark className="w-5 h-5" />;
  if (lower.includes("literature")) return <Feather className="w-5 h-5" />;
  if (lower.includes("filipino")) return <BookText className="w-5 h-5" />;
  return <BookOpen className="w-5 h-5" />;
};

export default function GradePage() {
  const navigate = useNavigate();
  const { gradeLevel } = useParams();
  
  const grade = parseInt(gradeLevel || "0");
  const isJuniorHigh = grade >= 7 && grade <= 10;
  
  const examSubjects = isJuniorHigh 
    ? ["Mathematics", "Science", "English", "Filipino", "Social Studies", "Technology"]
    : ["Advanced Mathematics", "Physics", "Chemistry", "English Literature", "Filipino Literature", "Humanities"];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans">
      <Header />
      
      <main className="container mx-auto px-4 py-8 md:py-12 flex-grow max-w-5xl">
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <button 
            onClick={() => navigate(isJuniorHigh ? "/junior-high" : "/senior-high")}
            className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to {isJuniorHigh ? "Junior High" : "Senior High"}
          </button>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={itemVariants} className="mb-10">
            <h2 className="text-3xl font-semibold text-slate-900 tracking-tight mb-3">
              Grade {grade} Examinations
            </h2>
            <p className="text-slate-500 text-base max-w-2xl leading-relaxed">
              Select a subject below to begin your scheduled examination. Ensure you are in a quiet environment before proceeding.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-10">
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-slate-800">
                <Info className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-sm tracking-wide">Before you begin</h3>
              </div>
              <ul className="grid sm:grid-cols-2 gap-y-2 gap-x-6 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-slate-300 mt-0.5">•</span>
                  Ensure a stable internet connection.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-300 mt-0.5">•</span>
                  Have your student ID ready for verification.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-300 mt-0.5">•</span>
                  Pace yourself; time limits are strictly enforced.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-300 mt-0.5">•</span>
                  Examinations cannot be paused once initiated.
                </li>
              </ul>
            </div>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {examSubjects.map((subject, index) => (
              <motion.div key={subject} variants={itemVariants} className="will-change-transform">
                <Card className="h-full border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 bg-white group hover:-translate-y-1">
                  <CardContent className="p-6 flex flex-col h-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-slate-900 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                    <div className="flex items-start mb-4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                        {getSubjectIcon(subject)}
                      </div>
                    </div>
                    <div className="mb-6 flex-grow">
                      <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{subject}</h3>
                      <p className="text-sm text-slate-500 font-medium">Grade {grade} Assessment</p>
                    </div>
                    <Button className="w-full bg-slate-900 hover:bg-blue-600 text-white shadow-none rounded-lg font-semibold transition-colors duration-300">
                      Start Examination
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}