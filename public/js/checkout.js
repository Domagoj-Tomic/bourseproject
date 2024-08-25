document.addEventListener('DOMContentLoaded', () => {
    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) {
        const sessionId = checkoutButton.getAttribute('data-session-id');
        const stripe = Stripe(document.getElementById('container').getAttribute('data-stripe-public-key'));
        checkoutButton.addEventListener('click', () => {
            stripe.redirectToCheckout({ sessionId }).then((result) => {
                if (result.error) {
                    alert(result.error.message);
                }
            });
        });
    }
});