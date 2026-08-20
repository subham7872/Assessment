import React from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center max-w-sm w-full space-y-4">
        <div className="inline-flex p-3 bg-sky-600 rounded-xl text-white">
          <FolderKanban className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-white">404</h1>
        <h2 className="text-lg font-semibold text-slate-200">Page Not Found</h2>
        <p className="text-xs text-slate-400">
          The requested page does not exist or has been moved.
        </p>
        <div className="pt-4">
          <Link
            to="/projects"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Projects</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
