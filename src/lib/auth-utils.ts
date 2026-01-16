/**
 * Maps Supabase authentication errors to user-friendly messages
 * to prevent information leakage about account states
 */
export function getAuthErrorMessage(error: Error): string {
  const message = error.message.toLowerCase();
  
  // Login errors - use generic message to prevent user enumeration
  if (message.includes('invalid login credentials') || 
      message.includes('invalid email or password')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  
  // Email confirmation
  if (message.includes('email not confirmed')) {
    return 'Please verify your email address before logging in.';
  }
  
  // Rate limiting
  if (message.includes('too many requests') || message.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  
  // Password reset errors
  if (message.includes('user not found') || message.includes('no user found')) {
    // Don't reveal if email exists for password reset
    return 'If an account with that email exists, you will receive a reset link.';
  }
  
  // Signup errors
  if (message.includes('user already registered') || message.includes('already exists')) {
    return 'An account with this email already exists. Try logging in instead.';
  }
  
  if (message.includes('password') && message.includes('weak')) {
    return 'Password is too weak. Please use at least 6 characters with a mix of letters and numbers.';
  }
  
  if (message.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }
  
  // Network/connection errors
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'Unable to connect. Please check your internet connection and try again.';
  }
  
  // Generic fallback - don't expose internal error details
  return 'Authentication failed. Please try again.';
}
