import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Building2, User, Mail, Lock, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const roles = [
  'SuperAdmin',
  'Admin',
  'PropertyManager',
  'FleetManager',
  'Accountant',
  'Viewer'
];

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'Admin'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(formData);
      toast.success('Account created! Please login.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div
        className="hidden lg:block lg:w-1/2 relative bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1764885517995-a4a4f940e1a6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBvZmZpY2UlMjBidWlsZGluZyUyMHNvbGFyJTIwcGFuZWxzfGVufDB8fHx8MTc3MjQ1MDE4NHww&ixlib=rb-4.1.0&q=85)'
        }}
      >
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
        <div className="relative h-full flex items-center justify-center p-12">
          <div className="text-white">
            <Building2 size={64} className="mb-6" />
            <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Join Enterprise ERP
            </h1>
            <p className="text-xl text-slate-200">
              Streamline property, utility & fleet operations
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Create Account
            </h2>
            <p className="text-slate-600">Get started with your enterprise dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" data-testid="register-form">
            <div>
              <Label htmlFor="full_name" className="text-sm font-medium text-slate-700">
                Full Name
              </Label>
              <div className="mt-2 relative">
                <User className="absolute left-3 top-3 text-slate-400" size={18} />
                <Input
                  id="full_name"
                  type="text"
                  required
                  data-testid="register-name-input"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="pl-10 h-11 border-slate-300 focus:ring-2 focus:ring-blue-800/20"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email Address
              </Label>
              <div className="mt-2 relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                <Input
                  id="email"
                  type="email"
                  required
                  data-testid="register-email-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 h-11 border-slate-300 focus:ring-2 focus:ring-blue-800/20"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </Label>
              <div className="mt-2 relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                <Input
                  id="password"
                  type="password"
                  required
                  data-testid="register-password-input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 h-11 border-slate-300 focus:ring-2 focus:ring-blue-800/20"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="role" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Shield size={16} />
                Role
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className="mt-2 h-11 border-slate-300" data-testid="register-role-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={loading}
              data-testid="register-submit-button"
              className="w-full h-11 bg-blue-800 hover:bg-blue-900 text-white font-semibold"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-800 font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
