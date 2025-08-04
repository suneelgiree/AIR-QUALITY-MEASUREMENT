import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Users, Check, MapPin, Chrome } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import authService from '../services/api/auth';

const RegisterPage = () => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', confirmPassword: '', location: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const [apiError, setApiError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors(prevErrors => ({ ...prevErrors, [e.target.name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = t('register.errors.fullNameRequired');
    if (!formData.email) newErrors.email = t('register.errors.emailRequired');
    if (!formData.password) newErrors.password = t('register.errors.passwordRequired');
    if (formData.password && formData.password.length < 6)
      newErrors.password = t('register.errors.passwordMinLength');
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = t('register.errors.passwordMismatch');
    if (!formData.location.trim()) newErrors.location = t('register.errors.locationRequired');
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(''); 
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // --- FIX: The data object now perfectly matches the backend serializer ---
      await authService.register({
        email: formData.email,
        full_name: formData.fullName,
        location: formData.location,
        password: formData.password,
        password2: formData.confirmPassword // Sending the confirmation password as `password2`
        // The extra 'username' field has been removed.
      });
      
      navigate('/login', { state: { successMessage: t('register.successMessage') } });
    } catch (error) {
      if (error.response && error.response.data) {
        const serverErrors = error.response.data;
        
        if (typeof serverErrors === 'object' && serverErrors.detail) {
          setApiError(serverErrors.detail);
        } 
        else if (typeof serverErrors === 'object') {
          const formattedErrors = {};
          for (const key in serverErrors) {
            if (Array.isArray(serverErrors[key])) {
              // The backend serializer uses 'password' for the mismatch error key
              if (key === 'password') {
                formattedErrors['confirmPassword'] = serverErrors[key].join(' ');
              } else {
                formattedErrors[key] = serverErrors[key].join(' ');
              }
            }
          }
          setErrors(formattedErrors);
        } 
        else {
          setApiError(t('register.apiErrorGeneric'));
        }
      } else {
        setApiError(t('register.apiErrorNetwork'));
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const API_BASE_URL = 'http://127.0.0.1:8000';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-green-700 bg-clip-text text-transparent">
              BreathSafe
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('register.createAccount')}</h1>
        </div>

        {apiError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-center">
            {apiError}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <a
            href={`${API_BASE_URL}/accounts/google/login/`}
            className="w-full flex items-center justify-center py-3 px-4 rounded-lg font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all transform hover:scale-[1.02] focus:ring-2 focus:ring-gray-200"
          >
            <Chrome className="w-5 h-5 mr-3 text-red-500" />
            {t('register.continueWithGoogle', 'Continue with Google')}
          </a>
        </div>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-4 text-gray-500 text-sm">{t('register.orSignUpWithEmail')}</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">{t('register.fullName')}</label>
            <input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`} placeholder={t('register.fullNamePlaceholder')} disabled={isLoading}/>
            {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">{t('register.email')}</label>

            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.email ? 'border-red-500' : 'border-gray-300'}`} placeholder={t('register.emailPlaceholder')} disabled={isLoading}/>
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">{t('register.location')}</label>
            <div className="relative">
              <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} className={`w-full px-4 py-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.location ? 'border-red-500' : 'border-gray-300'}`} placeholder={t('register.locationPlaceholder')} disabled={isLoading}/>
              <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">{t('register.password')}</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} id="password" name="password" value={formData.password} onChange={handleChange} className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12 ${errors.password ? 'border-red-500' : 'border-gray-300'}`} placeholder={t('register.passwordPlaceholder')} disabled={isLoading}/>
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700" tabIndex={-1} disabled={isLoading}>
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">{t('register.confirmPassword')}</label>
            <div className="relative">
              <input type={showConfirmPassword ? 'text' : 'password'} id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`} placeholder={t('register.confirmPasswordPlaceholder')} disabled={isLoading}/>
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700" tabIndex={-1} disabled={isLoading}>
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
          </div>
          <div className="flex items-start space-x-3">
            <input type="checkbox" id="terms" className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500" required disabled={isLoading}/>
            <label htmlFor="terms" className="text-sm text-gray-600">
              {t('register.agreeTo')}{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500">{t('register.termsOfService')}</a>{' '}
              {t('register.and')}{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500">{t('register.privacyPolicy')}</a>
            </label>
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all transform hover:scale-[1.02] focus:ring-4 focus:ring-blue-200 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none" disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                {t('register.creatingAccount')}
              </div>
            ) : (
              <><Check className="w-5 h-5" /><span>{t('register.createAccount')}</span></>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            {t('register.alreadyHaveAccount')}{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-500 font-semibold">
              {t('register.signInHere')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;