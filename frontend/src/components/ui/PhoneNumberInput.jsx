// components/PhoneNumberInput.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { debounce } from 'lodash';
import api from '@/utils/api';

const PhoneNumberInput = ({ 
  value, 
  onChange, 
  propertyId, 
  excludeId = null,
  excludeType = null,
  label = "Phone Number",
  required = false,
  placeholder = "Enter 10 digit mobile number",
  disabled = false,
  className = ""
}) => {
  const [usageList, setUsageList] = useState([]);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  const checkPhoneUsage = useCallback(
    debounce(async (phone, propId) => {
      if (!phone || phone.length < 10 || !propId) {
        setUsageList([]);
        setChecking(false);
        return;
      }

      // Validate phone number format (basic 10-digit check)
      if (!/^\d{10}$/.test(phone)) {
        setError('Please enter a valid 10-digit phone number');
        setUsageList([]);
        setChecking(false);
        return;
      }

      setError('');
      setChecking(true);

      try {
        const response = await api.post('/check-phone-usage', {
          property_id: propId,
          phone_number: phone,
          exclude_id: excludeId,
          exclude_type: excludeType
        });
        
        setUsageList(response.data.used_in || []);
      } catch (error) {
        console.error('Error checking phone usage:', error);
      } finally {
        setChecking(false);
      }
    }, 500),
    [excludeId, excludeType]
  );

  useEffect(() => {
    checkPhoneUsage(value, propertyId);
    return () => {
      checkPhoneUsage.cancel();
    };
  }, [value, propertyId, checkPhoneUsage]);

  const handleChange = (e) => {
    // Allow only digits
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    onChange(val);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="phone_number">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </Label>
      <Input
        id="phone_number"
        type="tel"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={error ? 'border-rose-500 focus-visible:ring-rose-500' : ''}
      />
      
      {checking && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="animate-spin h-3 w-3 border-2 border-slate-500 border-t-transparent rounded-full"></div>
          Checking usage...
        </div>
      )}

      {error && (
        <p className="text-sm text-rose-500 flex items-center gap-1">
          <AlertCircle size={14} />
          {error}
        </p>
      )}

      {usageList.length > 0 && !checking && (
        <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-md p-3">
          <p className="font-medium mb-1 flex items-center gap-1">
            <AlertCircle size={14} />
            This number is already used in:
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-rose-700">
            {usageList.map((item, index) => (
              <li key={index} className="text-xs">
                {item.name} ({item.type === 'property-tax' ? 'Tax' : item.type === 'electricity' ? 'Electricity' : 'Gas'})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PhoneNumberInput;