import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FolderKanban, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import * as authApi from '../api/authApi';
import { getErrorMessage } from '../utils/formatters';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authApi.resetPassword(token, data.password);
      toast.success('Password reset successfully! Please sign in with your new password.');
      navigate('/login');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full bg-slate-800 rounded-xl shadow-xl p-8 border border-slate-700">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-sky-600 rounded-xl text-white mb-3">
            <FolderKanban className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Create New Password</h2>
          <p className="text-slate-400 text-sm mt-1">
            Set your new account password
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              New Password
            </label>
            <input
              type="password"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
                pattern: {
                  value: /^(?=.*[A-Za-z])(?=.*\d)/,
                  message: 'Password must contain at least one letter and one number',
                },
              })}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-rose-400 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) => value === password || 'Passwords do not match',
              })}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="text-rose-400 text-xs mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span>Resetting password...</span>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Reset Password</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          Remember your password?{' '}
          <Link to="/login" className="text-sky-400 hover:text-sky-300 font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
