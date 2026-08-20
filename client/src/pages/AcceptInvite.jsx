import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FolderKanban } from 'lucide-react';
import useProjectStore from '../store/projectStore';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/formatters';

const AcceptInvite = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const acceptInvite = useProjectStore((state) => state.acceptInvite);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processInvite = async () => {
      try {
        const project = await acceptInvite(token);
        toast.success(`Joined project: ${project.name}!`);
        navigate(`/projects/${project._id}`);
      } catch (err) {
        toast.error(getErrorMessage(err));
        navigate('/projects');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      processInvite();
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center max-w-sm w-full space-y-4">
        <div className="inline-flex p-3 bg-sky-600 rounded-xl text-white">
          <FolderKanban className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Joining Project Workspace</h2>
        <p className="text-sm text-slate-400">Processing your invitation link...</p>
        <div className="pt-4">
          <Spinner size="lg" />
        </div>
      </div>
    </div>
  );
};

export default AcceptInvite;
