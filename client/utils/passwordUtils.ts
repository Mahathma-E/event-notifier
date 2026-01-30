
/**
 * Validates a password against strict security rules.
 * 
 * Rules:
 * - At least 8 characters long
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 number (0-9)
 * - At least 1 special character (! @ # $ % ^ & * ( ) _ + - = [ ] { } ; : , . < > ?)
 * 
 * @param password The password string to validate
 * @returns An object containing { isValid: boolean, error: string | null }
 */
export const validatePassword = (password: string): { isValid: boolean; error: string | null } => {
    if (password.length < 8) {
        return { isValid: false, error: "Password must be at least 8 characters long." };
    }
    if (!/[A-Z]/.test(password)) {
        return { isValid: false, error: "Password must contain at least one uppercase letter (A-Z)." };
    }
    if (!/[a-z]/.test(password)) {
        return { isValid: false, error: "Password must contain at least one lowercase letter (a-z)." };
    }
    if (!/[0-9]/.test(password)) {
        return { isValid: false, error: "Password must contain at least one number (0-9)." };
    }
    // Allowed special characters: ! @ # $ % ^ & * ( ) _ + - = [ ] { } ; : , . < > ?
    if (!/[!@#$%^&*()_+\-=\[\]{};:,.<>?]/.test(password)) {
        return { isValid: false, error: "Password must contain at least one special character (!@#$%^&*...)." };
    }

    return { isValid: true, error: null };
};
