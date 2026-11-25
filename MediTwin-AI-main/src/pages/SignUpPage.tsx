/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useRouter } from '../services/router';
import { useAuth } from '../auth/AuthContext';
import { UserRole } from '../models/types';
import { 
  HeartHandshake, 
  Stethoscope, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  AlertCircle, 
  Check, 
  Eye, 
  EyeOff, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export const SignUpPage: React.FC = () => {
  const { navigate } = useRouter();
  const { signUp, signInWithGoogle } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('PATIENT');
  const [showPassword, setShowPassword] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  // Real-time password criteria
  const hasMinLength = password.length >= 6;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation checks
    if (!name.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!hasMinLength) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match. Please verify both passwords.');
      return;
    }

    setIsSubmitting(true);
    try {
      const createdUser = await signUp({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        role,
      });

      // Redirect to role-specific onboarding immediately upon creation
      if (createdUser.role === 'DOCTOR') {
        navigate('/doctor/onboarding');
      } else {
        navigate('/patient/onboarding');
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while creating your account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setFormError(null);
    setIsGoogleSubmitting(true);
    try {
      const createdUser = await signInWithGoogle(role);
      if (createdUser.role === 'DOCTOR') {
        navigate('/doctor/onboarding');
      } else {
        navigate('/patient/onboarding');
      }
    } catch (err: any) {
      setFormError(err.message || 'Google registration was not completed. Please try again or use email registration.');
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const quickFillSample = (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (selectedRole === 'PATIENT') {
      const rand = Math.floor(100 + Math.random() * 900);
      setName('Emily Harrison');
      setEmail(`emily.harrison${rand}@meditwin.health`);
      setPassword('Password123!');
      setConfirmPassword('Password123!');
    } else {
      const rand = Math.floor(100 + Math.random() * 900);
      setName('Dr. Sarah Lin, MD');
      setEmail(`dr.sarahlin${rand}@clinic.org`);
      setPassword('Password123!');
      setConfirmPassword('Password123!');
    }
    setFormError(null);
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 min-h-[calc(100vh-140px)]">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sky-100 text-sky-600 mb-3">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Create your account
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Join MEDiTWIN AI for personalized medication safety intelligence
          </p>
        </div>

        {/* Error Alert */}
        {formError && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2.5 text-rose-800 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Registration Notice: </span>
              {formError}
            </div>
          </div>
        )}

        {/* Role Selection */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            1. Select Account Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              id="role-select-patient"
              onClick={() => setRole('PATIENT')}
              className={`p-3 rounded-xl border text-left flex items-start space-x-3 transition-all cursor-pointer ${
                role === 'PATIENT'
                  ? 'border-sky-500 bg-sky-50/60 ring-2 ring-sky-500/20 text-sky-900 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
              }`}
            >
              <div className={`p-2 rounded-lg ${role === 'PATIENT' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold">Patient</div>
                <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Personal safety &amp; twin</div>
              </div>
            </button>

            <button
              type="button"
              id="role-select-doctor"
              onClick={() => setRole('DOCTOR')}
              className={`p-3 rounded-xl border text-left flex items-start space-x-3 transition-all cursor-pointer ${
                role === 'DOCTOR'
                  ? 'border-teal-500 bg-teal-50/60 ring-2 ring-teal-500/20 text-teal-900 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
              }`}
            >
              <div className={`p-2 rounded-lg ${role === 'DOCTOR' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold">Doctor</div>
                <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Clinical decision tool</div>
              </div>
            </button>
          </div>
        </div>

        {/* Google Quick Sign Up */}
        <div className="mb-5">
          <button
            type="button"
            id="google-signup-btn"
            onClick={handleGoogleSignUp}
            disabled={isGoogleSubmitting || isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-xs transition-all flex items-center justify-center space-x-3 disabled:opacity-60 cursor-pointer"
          >
            {isGoogleSubmitting ? (
              <span className="inline-block w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Register with Google as {role === 'DOCTOR' ? 'Doctor' : 'Patient'}</span>
              </>
            )}
          </button>
        </div>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-white text-slate-400 font-medium">Or register with email</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="signup-name">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="signup-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'DOCTOR' ? 'e.g., Dr. Sarah Lin' : 'e.g., Emily Harrison'}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-900"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="signup-email">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="signup-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-900"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="signup-password">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            {/* Password Validation Checklist */}
            <div className="mt-2 space-y-1">
              <div className="flex items-center space-x-1.5 text-[11px]">
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${hasMinLength ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-400'}`}>
                  <Check className="w-2.5 h-2.5" />
                </span>
                <span className={hasMinLength ? 'text-teal-700 font-medium' : 'text-slate-500'}>
                  At least 6 characters
                </span>
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="signup-confirm-password">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="signup-confirm-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type password"
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-all text-slate-900 ${
                  confirmPassword && !passwordsMatch
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-300 focus:border-sky-500 focus:ring-sky-500/20'
                }`}
              />
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="mt-1 text-[11px] text-rose-600">Passwords do not match</p>
            )}
            {confirmPassword && passwordsMatch && (
              <p className="mt-1 text-[11px] text-teal-600 font-medium flex items-center space-x-1">
                <Check className="w-3 h-3" />
                <span>Passwords match</span>
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="signup-submit-btn"
            disabled={isSubmitting || isGoogleSubmitting}
            className="w-full mt-4 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-70 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Complete Registration ({role === 'DOCTOR' ? 'Doctor' : 'Patient'})</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

        {/* Quick-fill helper for test evaluation */}
        <div className="mt-4 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="text-[11px] font-semibold text-slate-600 flex items-center space-x-1 mb-1.5">
            <Sparkles className="w-3 h-3 text-sky-500" />
            <span>Fast test registration:</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => quickFillSample('PATIENT')}
              className="py-1 px-2 text-[11px] bg-white border border-slate-200 rounded-lg hover:border-sky-300 text-slate-700 hover:text-sky-700 font-medium cursor-pointer"
            >
              Fill Patient Details
            </button>
            <button
              type="button"
              onClick={() => quickFillSample('DOCTOR')}
              className="py-1 px-2 text-[11px] bg-white border border-slate-200 rounded-lg hover:border-teal-300 text-slate-700 hover:text-teal-700 font-medium cursor-pointer"
            >
              Fill Doctor Details
            </button>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-4 flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Secured with Firebase Firestore &amp; Web Crypto</span>
        </div>

        {/* Switch to Login */}
        <div className="mt-6 text-center text-xs text-slate-600">
          Already have an account?{' '}
          <button
            id="signup-goto-login-btn"
            onClick={() => navigate('/login')}
            className="font-semibold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer"
          >
            Sign In here
          </button>
        </div>

      </div>
    </div>
  );
};
