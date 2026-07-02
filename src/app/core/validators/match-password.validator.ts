import {AbstractControl, ValidationErrors, ValidatorFn} from "@angular/forms";

export function matchPasswordValidator(
    passwordKey: string,
    confirmPasswordKey: string
): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const passwordControl = control.get(passwordKey);
        const confirmPasswordControl = control.get(confirmPasswordKey);

        // Skip validation if controls haven't loaded yet
        if (!passwordControl || !confirmPasswordControl) {
            return null;
        }

        // Skip validation if the confirm field has other errors (like 'required')
        if (confirmPasswordControl.errors && !confirmPasswordControl.errors['passwordMismatch']) {
            return null;
        }

        // Set error on the confirm field if they do not match
        if (passwordControl.value !== confirmPasswordControl.value) {
            confirmPasswordControl.setErrors({passwordMismatch: true});
            return {passwordMismatch: true};
        } else {
            // Clear the error if they match
            confirmPasswordControl.setErrors(null);
            return null;
        }
    };
}