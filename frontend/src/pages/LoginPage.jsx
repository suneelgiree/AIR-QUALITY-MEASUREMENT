import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Users } from 'lucide-react';
import { authService } from '../services/api';
import { useTranslation } from 'react-i18next';

const LoginPage = () => {
  // Initialize the translation hook from react-i18next
  const { t } = useTranslation();

  // State to toggle password visibility
  const [showPassword, setShowPassword] = useState(false);

  // State for form inputs
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // State to hold validation errors per field
  const [errors, setErrors] = useState({});

  // Loading state for disabling inputs and showing spinner
  const [isLoading, setIsLoading] = useState(false);

  // State to hold any API-level error message
  const [apiError, setApiError] = useState('');

  // React Router hook to navigate programmatically
  const navigate = useNavigate();

  // Handle form submission for login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    // Validate input fields with translated error messages
    const newErrors = {};
    if (!formData.email) newErrors.email = t('login.errors.emailRequired');
    if (!formData.password) newErrors.password = t('login.errors.passwordRequired');

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors); // Show errors and prevent API call
      return;
    }

    setIsLoading(true);
    try {
      // Call your API login service
      const response = await authService.login({
        email: formData.email,
        password: formData.password
      });

      // Save tokens and user data to localStorage
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
      localStorage.setItem('isAuthenticated', 'true');

      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      // Navigate to dashboard on successful login
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      // Handle API error responses with appropriate translated messages
      if (error.response) {
        setApiError(error.response.data?.error || t('login.errors.invalidCredentials'));
      } else if (error.request) {
        setApiError(t('login.errors.networkError'));
      } else {
        setApiError(t('login.errors.unexpectedError'));
      }
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  // Handle input changes and clear related errors on change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* Logo and app name */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-green-700 bg-clip-text text-transparent">
              BreathSafe
            </span>
          </Link>
          {/* Heading translated */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('login.signIn')}</h1>
        </div>

        {/* Show API error if any */}
        {apiError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {apiError}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email field with label and error */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              {t('login.email')}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('login.emailPlaceholder')}
              disabled={isLoading}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          {/* Password field with show/hide toggle */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              {t('login.password')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={t('login.passwordPlaceholder')}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>

          {/* Remember me checkbox and forgot password link */}
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input 
                type="checkbox" 
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isLoading}
              />
              <span className="ml-2 text-sm text-gray-600">{t('login.rememberMe')}</span>
            </label>
            <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
              {t('login.forgotPassword')}
            </a>
          </div>

          {/* Submit button with loading spinner */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all transform hover:scale-[1.02] focus:ring-4 focus:ring-blue-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('login.signingIn')}
              </div>
            ) : (
              t('login.signIn')
            )}
          </button>
        </form>

        {/* Link to registration page */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            {t('login.noAccount')}{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-500 font-semibold">
              {t('login.createAccount')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
