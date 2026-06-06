import {ChevronRight, Home } from "lucide-react";
import {Link, useLocation } from "react-router";
import { motion } from "framer-motion";

export function Breadcrumbs() {
    const location = useLocation();
    const pathnames = location.pathname.split("/").filter((x) => x);

    if(pathnames.length === 0 )return null;

    const breadcrumbs = [];

    let isJunior = false;
    let isSenior = false;

    pathnames.forEach((value, index) => {
        let to = `/${pathnames.slice(0, index + 1).join("/")}`;
        let name = value.replace(/-/g, " ");

        if(value === "junior-high"){
            name = "Junior High School";
            isJunior = true;
        } else if(value === "senior-high"){
            name = "Senior High School";
            isSenior = true;
        }else if(value === "grade"){
            return;
        }else if(!isNaN(Number(value))){
            name = `Grade ${value}`;
            const num = Number(value);
            if(num >= 7 && num <= 10) isJunior = true;
            if(num >= 11 && num <= 12) isSenior = true;
        }

        breadcrumbs.push({name, to, original:value});
    });
        if (breadcrumbs.length > 0 && breadcrumbs[breadcrumbs.length - 1].name.startsWith("Grade ")) {
        if (isJunior && !breadcrumbs.find(b => b.original === "junior-high")) {
        breadcrumbs.unshift({ name: "Junior High School", to: "/junior-high", original: "junior-high" });
        } else if (isSenior && !breadcrumbs.find(b => b.original === "senior-high")) {
        breadcrumbs.unshift({ name: "Senior High School", to: "/senior-high", original: "senior-high" });
        }
    }

    return (
        <motion.nav 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        aria-label="Breadcrumb" 
        className="container mx-auto px-4 md:px-6 py-3"
        >
        <ol className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400 overflow-x-auto pb-1 scrollbar-none whitespace-nowrap">
            <li>
            <Link to="/" className="flex items-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <Home className="w-4 h-4" />
                <span className="sr-only">Home</span>
            </Link>
            </li>
            {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
                <li key={crumb.to} className="flex items-center">
                <ChevronRight className="w-4 h-4 mx-1 opacity-50" />
                {isLast ? (
                    <span className="font-semibold text-slate-800 dark:text-slate-200" aria-current="page">
                    {crumb.name}
                    </span>
                ) : (
                    <Link to={crumb.to} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors capitalize">
                    {crumb.name}
                    </Link>
                )}
                </li>
            );
            })}
        </ol>
        </motion.nav>
    );
}