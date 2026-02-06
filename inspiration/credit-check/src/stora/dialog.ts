import { initiateIdAndCreditCheck } from '../auth/index.ts';
import type { CreditCheckSession } from '../services/creditCheckSession.ts';
import { checkCreditCheckStatus } from '../services/creditCheckSession.ts';

export interface CreditCheckDialogOptions {
    organizationId: string;
    onCreditCheckComplete?: (session: CreditCheckSession) => void;
    onError?: (error: Error) => void;
}

/**
 * Create and show credit check dialog
 */
export const createCreditCheckDialog = (
    options: CreditCheckDialogOptions
): HTMLElement => {
    const dialog = document.createElement('div');
    dialog.className = 'stora-credit-check-dialog';
    dialog.innerHTML = `
        <div class="stora-credit-check-dialog__container" style="
            border: 2px solid #007bff;
            border-radius: 8px;
            padding: 24px;
            margin: 20px 0;
            background-color: #f8f9fa;
        ">
            <div class="stora-credit-check-dialog__content">
                <h2 class="stora-credit-check-dialog__title" style="
                    margin-top: 0;
                    margin-bottom: 16px;
                    font-size: 24px;
                    font-weight: 600;
                    color: #212529;
                ">
                    Kredittjekk påkrevd
                </h2>
                <p class="stora-credit-check-dialog__description" style="
                    margin-bottom: 20px;
                    color: #495057;
                    line-height: 1.6;
                ">
                    For å bruke lagringsenheten må du først gjennomføre en kredittjekk. 
                    Dette er en sikkerhetsprosess som hjelper oss med å verifisere din identitet.
                </p>
                <button 
                    class="stora-credit-check-dialog__button button button--primary" 
                    style="
                        padding: 12px 24px;
                        background-color: #007bff;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        font-size: 16px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: background-color 0.2s;
                    "
                    onmouseover="this.style.backgroundColor='#0056b3'"
                    onmouseout="this.style.backgroundColor='#007bff'"
                >
                    Sjekk kreditt
                </button>
                <div class="stora-credit-check-dialog__loading" style="
                    display: none;
                    margin-top: 16px;
                    color: #6c757d;
                ">
                    Starter kredittjekk...
                </div>
                <div class="stora-credit-check-dialog__error" style="
                    display: none;
                    margin-top: 16px;
                    padding: 12px;
                    background-color: #f8d7da;
                    color: #721c24;
                    border-radius: 4px;
                "></div>
            </div>
        </div>
    `;

    // Attach button click handler
    const button = dialog.querySelector<HTMLButtonElement>('.stora-credit-check-dialog__button');
    const loading = dialog.querySelector<HTMLElement>('.stora-credit-check-dialog__loading');
    const errorDiv = dialog.querySelector<HTMLElement>('.stora-credit-check-dialog__error');

    if (button) {
        button.addEventListener('click', async () => {
            if (button.disabled) return;

            // Show loading state
            button.disabled = true;
            if (loading) loading.style.display = 'block';
            if (errorDiv) errorDiv.style.display = 'none';

            try {
                // Initiate credit check
                const result = await initiateIdAndCreditCheck();
                
                // Check if credit check was successful
                // The result should contain session information
                if (result.session) {
                    // Verify the session status
                    const status = await checkCreditCheckStatus(
                        options.organizationId,
                        result.session.subscriber_id
                    );

                    if (status && (status.status === 'approved' || status.status === 'passed' || status.status === 'completed')) {
                        // Credit check passed
                        if (options.onCreditCheckComplete) {
                            options.onCreditCheckComplete(result.session);
                        }
                    } else {
                        throw new Error('Kredittjekk ble ikke godkjent');
                    }
                } else {
                    throw new Error('Kunne ikke opprette kredittjekk-sesjon');
                }
            } catch (error) {
                console.error('Credit check error:', error);
                if (errorDiv) {
                    errorDiv.textContent = error instanceof Error ? error.message : 'En feil oppstod under kredittjekken';
                    errorDiv.style.display = 'block';
                }
                if (options.onError) {
                    options.onError(error instanceof Error ? error : new Error(String(error)));
                }
                // Re-enable button
                button.disabled = false;
                if (loading) loading.style.display = 'none';
            }
        });
    }

    return dialog;
};

/**
 * Show credit check dialog in booking complete section
 */
export const showCreditCheckDialog = (
    bookingCompleteSection: HTMLElement,
    options: CreditCheckDialogOptions
): void => {
    // Hide the default actions section
    const actionsSection = bookingCompleteSection.querySelector<HTMLElement>('.booking-complete__actions_section');
    if (actionsSection) {
        actionsSection.style.display = 'none';
    }

    // Create and insert dialog
    const dialog = createCreditCheckDialog({
        ...options,
        onCreditCheckComplete: (session) => {
            // Hide dialog
            dialog.style.display = 'none';
            
            // Show default actions section again
            if (actionsSection) {
                actionsSection.style.display = '';
            }

            if (options.onCreditCheckComplete) {
                options.onCreditCheckComplete(session);
            }
        },
    });

    // Insert dialog before actions section or at the end
    if (actionsSection && actionsSection.parentNode) {
        actionsSection.parentNode.insertBefore(dialog, actionsSection);
    } else {
        bookingCompleteSection.appendChild(dialog);
    }
};
