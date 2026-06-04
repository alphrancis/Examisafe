import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Home, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-16 flex-grow flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="max-w-md mx-auto text-center w-full"
        >
          <Card className="border-0 shadow-md bg-white overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 to-amber-600"></div>
            <CardHeader className="pb-6 pt-10">
              <motion.div 
                animate={{ rotate: [0, -5, 5, -5, 5, 0] }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mx-auto mb-6 w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-50 rounded-2xl flex items-center justify-center shadow-inner"
              >
                <AlertTriangle className="w-12 h-12 text-amber-600" />
              </motion.div>
              <CardTitle className="text-3xl text-slate-900 font-extrabold tracking-tight">Page Not Found</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 pb-10 px-8">
              <p className="text-lg text-slate-600">
                The examination module or page you're looking for doesn't exist or has been moved.
              </p>
              <Button 
                onClick={() => navigate("/")}
                size="lg"
                className="w-full"
              >
                <Home className="w-5 h-5 mr-2" />
                Return to Portal Home
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
