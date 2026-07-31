import { createAddonOrder, confirmAddonPayment } from "../api/bookings.api";
import { createRazorpayOrder, verifyRazorpayPayment } from "../api/bookings.api";

/**
 * Launches Razorpay Checkout for a given booking + amount.
 * Resolves with the updated (populated) booking on success.
 * Rejects with an Error if verification fails or the user closes the popup.
 */
export const launchRazorpayCheckout = ({ bookingId, amount, customerName, customerMobile }) => {
  return new Promise((resolve, reject) => {
    createRazorpayOrder(bookingId, amount)
      .then(({ orderId, amount: orderAmount, currency, keyId }) => {
        const options = {
          key: keyId,
          amount: orderAmount,
          currency,
          name: "Orange International Spa",
          description: "Spa Service Payment",
          order_id: orderId,
          prefill: {
            name: customerName || "",
            contact: customerMobile || "",
          },
          theme: { color: "#f97316" }, // orange-500, matches the app's accent color
          handler: async (response) => {
            try {
              const updated = await verifyRazorpayPayment(bookingId, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount,
              });
              resolve(updated);
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled.")),
          },
        };

        if (!window.Razorpay) {
          reject(new Error("Razorpay script not loaded. Check index.html."));
          return;
        }
        const rzp = new window.Razorpay(options);
        rzp.open();
      })
      .catch(reject);
  });
};


/**
 * For the QR add-on flow ONLY. Charges for the items FIRST — they are only
 * written to the booking if payment succeeds. Cancelling the popup or failing
 * payment means nothing is added, no exceptions.
 */
export const launchAddonCheckout = ({ bookingId, services, mocktails, customerName, customerMobile }) => {
  return new Promise((resolve, reject) => {
    createAddonOrder(bookingId, { services, mocktails })
      .then(({ orderId, amount, currency, keyId }) => {
        const options = {
          key: keyId,
          amount,
          currency,
          name: "Orange International Spa",
          description: "Add-on Order",
          order_id: orderId,
          prefill: { name: customerName || "", contact: customerMobile || "" },
          theme: { color: "#f97316" },
          handler: async (response) => {
            try {
              const updated = await confirmAddonPayment(bookingId, {
                services,
                mocktails,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              resolve(updated);
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled — item was not added to your order.")),
          },
        };
        if (!window.Razorpay) {
          reject(new Error("Razorpay script not loaded."));
          return;
        }
        new window.Razorpay(options).open();
      })
      .catch(reject);
  });
};