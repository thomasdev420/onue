'use client';

import Link from "next/link";

export default function Card({ icon: Icon, title, description, href }) {
  return (
    <Link href={href} className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6 text-center group cursor-pointer">
      <div className="flex flex-col items-center">
        {Icon && <Icon className="w-10 h-10 text-blue-600 mb-4 group-hover:text-blue-700 transition-colors duration-200" />}
        <h3 className="text-xl font-semibold text-gray-900 mb-1 group-hover:text-gray-800 transition-colors duration-200">
          {title}
        </h3>
        <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-200">
          {description}
        </p>
      </div>
    </Link>
  );
} 