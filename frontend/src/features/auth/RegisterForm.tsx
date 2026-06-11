import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import { parseApiError } from '@/api/errorHandler';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { registerSchema, type RegisterSchema } from '@/features/auth/schemas';

export default function RegisterForm() {
  const { registerInitiate, registerVerify } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [phoneForVerify, setPhoneForVerify] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
    },
  });

  const initiateMutation = useMutation({
    mutationFn: (data: RegisterSchema) =>
      registerInitiate({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
      }),
    onSuccess: (_, variables) => {
      setPhoneForVerify(variables.phone);
      toast.success('Verification OTP sent to your phone.');
      setStep('otp');
    },
    onError: (error) => {
      const parsedError = parseApiError(error);
      toast.error(parsedError.message);
    },
  });

  const onSubmit = (data: RegisterSchema) => {
    initiateMutation.mutate(data);
  };

  const verifyMutation = useMutation({
    mutationFn: (otpStr: string) => registerVerify(phoneForVerify, otpStr),
    onSuccess: () => {
      toast.success('Account created successfully');
      navigate('/dashboard', { replace: true });
    },
    onError: (error) => {
      const parsedError = parseApiError(error);
      toast.error(parsedError.message);
      setOtpError(parsedError.message);
    },
  });

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setOtpError('Please enter a valid 6-digit OTP');
      return;
    }
    setOtpError('');
    verifyMutation.mutate(otp);
  };

  const handleResendOtp = () => {
    const values = getValues();
    initiateMutation.mutate(values);
  };

  if (step === 'otp') {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setStep('register')}
          className="flex items-center text-sm font-medium text-primary hover:underline mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to registration
        </button>

        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Verify your phone</h2>
          <p className="text-sm text-muted-foreground">
            We sent a verification code to <span className="font-semibold">{phoneForVerify}</span>
          </p>
        </div>

        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">One-Time Password (OTP)</Label>
            <Input
              id="otp"
              type="text"
              pattern="\d*"
              maxLength={6}
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="text-center text-2xl tracking-widest font-mono py-6"
              autoFocus
            />
            {otpError && (
              <p className="text-sm text-destructive">{otpError}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={verifyMutation.isPending}>
            {verifyMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Verify & Create Account
          </Button>
        </form>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={handleResendOtp}
            className="text-sm text-primary hover:underline font-medium"
          >
            Didn't receive a code? Resend OTP
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="John Doe"
          autoComplete="name"
          aria-invalid={!!errors.name}
          {...register('name')}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          {...register('password')}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+1 (555) 123-4567"
          autoComplete="tel"
          aria-invalid={!!errors.phone}
          {...register('phone')}
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={initiateMutation.isPending}>
        {initiateMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
        Create Account
      </Button>
    </form>
  );
}
