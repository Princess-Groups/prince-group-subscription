export function capturedPaymentMatches(
  payment: { order_id: string | null; status: string; amount: number; currency: string },
  stored: { orderId: string; totalAmount: number },
) {
  return payment.status === "captured" && payment.currency === "INR" &&
    payment.order_id === stored.orderId && Number.isSafeInteger(payment.amount) &&
    payment.amount === Math.round(stored.totalAmount * 100);
}